# DEPLOY.md — Guía de despliegue en VPS (Hostinger)

> Este documento describe el procedimiento **completo y ordenado** para desplegar
> el backend de **puro-deportes** en un VPS con acceso root usando Docker Compose.
>
> **Arquitectura:**
> - Backend NestJS → dentro de un contenedor Docker
> - MySQL → instalado directamente en el VPS (**fuera** de Docker, nunca dockerizar)
> - Uploads → directorio en el VPS montado como volumen en el contenedor

---

> [!CAUTION]
> **Rotación de credenciales obligatoria antes de producción.**
> Las credenciales de este proyecto (DB_PASSWORD, JWT_SECRET) fueron compartidas
> en texto plano durante el proceso de configuración. **Rota ambas antes de
> considerar el entorno como producción final.** Ver paso 4 para los comandos.

---

## Índice

1. [Instalar Docker en el VPS](#1-instalar-docker-en-el-vps)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Preparar almacenamiento persistente de uploads](#3-preparar-almacenamiento-persistente-de-uploads)
4. [Configurar el archivo `.env` de producción](#4-configurar-el-archivo-env-de-producción)
5. [Hardening de MySQL — CRÍTICO antes de exponer a internet](#5-hardening-de-mysql--crítico-antes-de-exponer-a-internet)
6. [Migraciones de base de datos](#6-migraciones-de-base-de-datos)
7. [Levantar el servicio con Docker Compose](#7-levantar-el-servicio-con-docker-compose)
8. [Verificar la conexión end-to-end](#8-verificar-la-conexión-end-to-end)
9. [Actualizar la aplicación (redeploy)](#9-actualizar-la-aplicación-redeploy)
10. [Backup de uploads](#10-backup-de-uploads)
11. [Referencia rápida de comandos](#11-referencia-rápida-de-comandos)

---

## 1. Instalar Docker en el VPS

```bash
# Actualizar paquetes del sistema
apt update && apt upgrade -y

# Instalar Docker usando el script oficial
curl -fsSL https://get.docker.com | sh

# Verificar instalación (DEBE ser >= 20.10 para soportar host-gateway)
docker --version
# Ejemplo de salida esperada: Docker version 25.x.x

# Docker Compose viene integrado desde Docker >= 23.x
docker compose version
```

---

## 2. Clonar el repositorio

```bash
# Crear directorio del proyecto
mkdir -p /opt/puro-deportes
cd /opt/puro-deportes

# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO> .

# Verificar que los archivos clave están presentes
ls -la Dockerfile docker-compose.yml .env.example
```

---

## 3. Preparar almacenamiento persistente de uploads

El contenedor corre con el usuario `appuser` (UID 1000). Los uploads deben
vivir **fuera del contenedor** para sobrevivir a cualquier rebuild.

```bash
# Crear directorios persistentes
mkdir -p /data/puro-deportes/uploads/logos
mkdir -p /data/puro-deportes/uploads/torneos
mkdir -p /data/puro-deportes/uploads/noticias

# Asignar permisos al usuario del contenedor (UID 1000 = appuser en la imagen)
chown -R 1000:1000 /data/puro-deportes/uploads
chmod -R 755 /data/puro-deportes/uploads

# Verificar
ls -la /data/puro-deportes/uploads
```

> [!CAUTION]
> Nunca guardes uploads dentro de `/opt/puro-deportes` (el directorio del código
> fuente que se reconstruye en cada deploy). Siempre deben vivir en
> `/data/puro-deportes/uploads` montado como volumen.

---

## 4. Configurar el archivo `.env` de producción

Crea el `.env` dentro del directorio del proyecto clonado. **Nunca subirlo al repo.**

```bash
cd /opt/puro-deportes
nano .env
```

Contenido del `.env` de producción:

```dotenv
PORT=3000
NODE_ENV=production

# ─── Base de datos ────────────────────────────────────────────────────────────
# ⚠️  USAR host.docker.internal — NO la IP pública del VPS, NO localhost.
# El contenedor corre en red bridge y solo puede alcanzar MySQL del VPS
# a través de este alias especial (mapeado a host-gateway en docker-compose.yml).
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USERNAME=adossofn_admin
DB_PASSWORD=NUEVA_CONTRASEÑA_SEGURA_ROTADA
DB_DATABASE=adossofn_purodeporte

# ─── Autenticación ────────────────────────────────────────────────────────────
# Generar con: openssl rand -base64 64
JWT_SECRET=NUEVO_SECRETO_LARGO_Y_ALEATORIO_ROTADO

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGIN=https://purodeporte.com

# ─── Uploads ──────────────────────────────────────────────────────────────────
# Ruta INTERNA del volumen montado en el contenedor
UPLOADS_PATH=/app/uploads
```

### Rotar credenciales (obligatorio)

```bash
# Generar nuevo JWT_SECRET seguro
openssl rand -base64 64

# Cambiar la contraseña del usuario MySQL
mysql -u root -p
```
```sql
ALTER USER 'adossofn_admin'@'172.17.0.%' IDENTIFIED BY 'NUEVA_CONTRASEÑA_SEGURA';
ALTER USER 'adossofn_admin'@'localhost' IDENTIFIED BY 'NUEVA_CONTRASEÑA_SEGURA';
FLUSH PRIVILEGES;
```

---

## 5. Hardening de MySQL — CRÍTICO antes de exponer a internet

> [!WARNING]
> Este paso es **obligatorio**. Si MySQL escucha en la IP pública del VPS
> con credenciales conocidas, el sistema está comprometido. Ejecutar **todos**
> los sub-pasos en orden y verificar cada uno antes de continuar.

### 5a. Verificar cómo está escuchando MySQL actualmente

```bash
# Ver en qué interfaces/IPs está escuchando MySQL ahora mismo
netstat -tlnp | grep 3306
# o
ss -tlnp | grep 3306
```

Si aparece `0.0.0.0:3306` o `<IP_PUBLICA>:3306`, MySQL está expuesto a internet → **continuar con 5b**.
Si ya aparece solo `127.0.0.1:3306` → MySQL solo escucha localmente, verificar permisos de Docker igualmente.

### 5b. Identificar la interfaz de red de Docker

Después de instalar Docker, aparece la interfaz `docker0`:

```bash
# Ver la IP del bridge de Docker
ip addr show docker0
# Ejemplo de salida: inet 172.17.0.1/16 brd 172.17.255.255

# Anotar la IP del bridge (normalmente 172.17.0.1)
# El rango de la subred es 172.17.0.0/16
```

### 5c. Editar `bind-address` en la configuración de MySQL

```bash
# Encontrar el archivo de configuración de MySQL
find /etc/mysql -name "*.cnf" 2>/dev/null

# Editar el archivo principal (ruta típica en Ubuntu/Debian)
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Dentro del archivo, localizar la línea `bind-address` y modificarla:

```ini
[mysqld]
# Configuración ANTES (insegura si era 0.0.0.0 o la IP pública):
# bind-address = 0.0.0.0
# bind-address = 187.x.x.x   ← IP pública → ELIMINAR

# Configuración SEGURA: escuchar solo en localhost Y en el bridge de Docker.
# Nota: MySQL 8.0+ soporta múltiples valores separados por coma.
bind-address = 127.0.0.1,172.17.0.1
```

> [!NOTE]
> Si tu versión de MySQL no soporta múltiples valores en `bind-address`,
> usa `bind-address = 0.0.0.0` y depende **exclusivamente** del firewall
> (paso 5e) para bloquear el acceso desde internet.

```bash
# Reiniciar MySQL para aplicar el cambio
systemctl restart mysql

# Verificar el nuevo estado — ya NO debe aparecer 0.0.0.0:3306 ni la IP pública
netstat -tlnp | grep 3306
# Salida esperada:
# tcp  0  0  127.0.0.1:3306  0.0.0.0:*  LISTEN  <pid>/mysqld
# tcp  0  0  172.17.0.1:3306  0.0.0.0:*  LISTEN  <pid>/mysqld
```

### 5d. Verificar y ajustar los permisos del usuario MySQL

El usuario `adossofn_admin` necesita permiso para conectarse desde la subred
de Docker (`172.17.0.%`), no solo desde `localhost` ni desde `%` (cualquier host).

```bash
mysql -u root -p
```

```sql
-- Ver los hosts desde los que tiene permiso el usuario actual
SELECT user, host FROM mysql.user WHERE user = 'adossofn_admin';

-- Si el host es '%' (cualquier host) o solo 'localhost', ajustarlo:

-- 1. Crear el usuario para la subred de Docker (si no existe)
CREATE USER IF NOT EXISTS 'adossofn_admin'@'172.17.0.%'
    IDENTIFIED BY 'NUEVA_CONTRASEÑA_SEGURA';

-- 2. Dar permisos sobre la base de datos del proyecto
GRANT ALL PRIVILEGES ON adossofn_purodeporte.*
    TO 'adossofn_admin'@'172.17.0.%';

-- 3. Mantener acceso desde localhost para mantenimiento directo en el VPS
CREATE USER IF NOT EXISTS 'adossofn_admin'@'localhost'
    IDENTIFIED BY 'NUEVA_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON adossofn_purodeporte.*
    TO 'adossofn_admin'@'localhost';

-- 4. REVOCAR acceso desde '%' (cualquier host) si existe
-- (verificar primero con el SELECT de arriba si existe @'%')
DROP USER IF EXISTS 'adossofn_admin'@'%';

-- 5. Aplicar cambios
FLUSH PRIVILEGES;

-- 6. Verificar el resultado final
SELECT user, host FROM mysql.user WHERE user = 'adossofn_admin';
-- Debe mostrar solo: localhost | 172.17.0.%
```

### 5e. Configurar el firewall (ufw) para bloquear MySQL desde internet

```bash
# Ver el estado actual del firewall y las reglas existentes
ufw status numbered

# Si hay alguna regla que permita 3306 desde "Anywhere", eliminarla primero:
# ufw delete <NUMERO_DE_REGLA>

# Bloquear el puerto 3306 desde cualquier origen externo
ufw deny 3306/tcp

# Verificar que el puerto de la API esté permitido
ufw allow 3000/tcp

# Ver el resultado
ufw status
# La regla de 3306 debe aparecer como DENY
```

### 5f. Verificación final del hardening

```bash
# 1. MySQL no escucha en IP pública
netstat -tlnp | grep 3306
# Esperado: solo 127.0.0.1 y 172.17.0.1

# 2. Puerto 3306 bloqueado externamente
# (desde otra máquina o usando nmap instalado en el VPS)
nmap -p 3306 <IP_PUBLICA_DEL_VPS>
# Esperado: filtered o closed

# 3. Conexión de prueba desde localhost (debe funcionar)
mysql -u adossofn_admin -p adossofn_purodeporte -e "SELECT 1;"

# 4. Los permisos de usuario son correctos
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='adossofn_admin';"
# Debe mostrar: localhost | 172.17.0.%  (NO debe mostrar %)
```

---

## 6. Migraciones de base de datos

> [!NOTE]
> **Las migraciones se aplican automáticamente al arrancar el contenedor.**
> El CMD del Dockerfile ejecuta `npm run migration:run` antes de iniciar NestJS.
> Si no hay migraciones pendientes, el comando termina en milisegundos sin
> afectar el tiempo de arranque. No necesitas ningún paso manual adicional.

Con `NODE_ENV=production`, `synchronize` está desactivado. El arranque del
contenedor aplica todas las migraciones pendientes antes de levantar la app,
lo que garantiza que cualquier `docker compose up -d --build` deja la BD
sincronizada automáticamente.

### Aplicar migraciones sin reiniciar el contenedor (opcional)

Si necesitas aplicar (o revisar) migraciones en un contenedor ya corriendo
**sin reiniciarlo**, puedes hacerlo manualmente:

```bash
# Opción A — dentro del contenedor ya corriendo
docker compose exec backend npm run migration:run

# Opción B — contenedor temporal (si el servicio está caído)
docker compose run --rm backend npm run migration:run
```

---

## 7. Levantar el servicio con Docker Compose

```bash
cd /opt/puro-deportes

# Construir la imagen y levantar en modo detached (background)
docker compose up -d --build

# Verificar que el contenedor está corriendo
docker compose ps

# Ver logs en tiempo real (Ctrl+C para salir sin detener el servicio)
docker compose logs -f backend
```

---

## 8. Verificar la conexión end-to-end

```bash
# 1. Verificar que la API responde
curl http://localhost:3000/api/torneos/public

# 2. Probar que el contenedor alcanza MySQL vía host.docker.internal
#    Registrar un usuario de prueba → requiere conexión a BD
curl -s -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Deploy",
    "email": "test-deploy@purodeporte.com",
    "password": "TestPassword123!",
    "phone": "1234567890"
  }'
# Respuesta esperada: 201 con datos del usuario (sin password)
# Si retorna 500 con error de conexión → revisar paso 5

# 3. Verificar login del usuario de prueba
curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-deploy@purodeporte.com","password":"TestPassword123!"}'
# Respuesta esperada: 200 con access_token JWT

# 4. Verificar que los uploads son accesibles (reemplazar con un archivo real)
curl -I http://localhost:3000/uploads/logos/alguna-imagen.png
```

> [!TIP]
> Si el login devuelve 429 (Too Many Requests), espera 1 minuto — el rate limiting
> de autenticación está configurado en 5 intentos/minuto por IP.

---

## 9. Actualizar la aplicación (redeploy)

Flujo estándar para cada actualización de código:

```bash
cd /opt/puro-deportes

# 1. Obtener los últimos cambios del repositorio
git pull origin main

# 2. Reconstruir la imagen e iniciar el servicio actualizado
#    Las migraciones pendientes se aplican AUTOMÁTICAMENTE al arrancar el contenedor.
#    No es necesario ningún paso adicional de migraciones.
docker compose up -d --build

# 3. Verificar que todo arrancó correctamente (incluyendo las migraciones en los logs)
docker compose logs -f backend
```

> [!NOTE]
> Los datos de MySQL y los archivos en `/data/puro-deportes/uploads`
> **no se tocan en ningún paso** del redeploy — solo se reconstruye la imagen.

### Rollback si algo sale mal

```bash
# Volver al commit anterior
git log --oneline -5          # identificar el commit estable
git checkout <COMMIT_HASH>

# Reconstruir con el código anterior
docker compose up -d --build
```

---

## 10. Backup de uploads

### Opción A — rsync hacia otro servidor (recomendado)

```bash
# Agregar al crontab del root: crontab -e
# Backup diario a las 2:00 AM
0 2 * * * rsync -az /data/puro-deportes/uploads/ usuario@servidor-backup:/backups/puro-deportes/uploads/
```

### Opción B — tar comprimido localmente (mínimo aceptable)

```bash
# Backup semanal (domingos 3:00 AM), conserva últimas 4 semanas
0 3 * * 0 tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz /data/puro-deportes/uploads && find /backups -name 'uploads-*.tar.gz' -mtime +28 -delete
```

> [!WARNING]
> Un backup en el mismo disco del VPS **no protege contra fallo del disco**.
> Usa siempre una copia en almacenamiento externo (rsync a otro servidor,
> rclone hacia S3/Backblaze B2, etc.).

---

## 11. Referencia rápida de comandos

```bash
# Levantar (o reconstruir) — las migraciones se aplican automáticamente al arrancar
docker compose up -d --build

# Ver logs
docker compose logs -f backend

# Parar el servicio
docker compose down

# Aplicar migraciones manualmente SIN reiniciar el contenedor (caso excepcional)
docker compose exec backend npm run migration:run

# Shell interactivo dentro del contenedor
docker compose exec backend sh

# Estado de los servicios
docker compose ps

# Limpiar imágenes antiguas
docker image prune -f

# Verificar que MySQL escucha correctamente
netstat -tlnp | grep 3306

# Verificar permisos de usuario MySQL
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='adossofn_admin';"
```
