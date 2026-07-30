# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: BUILD
# Instala todas las dependencias (incluyendo devDependencies) y compila TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copia solo los manifiestos primero para aprovechar la caché de capas de Docker.
# Si package*.json no cambia, esta capa se reutiliza aunque cambie el código fuente.
COPY package*.json ./

# Instala TODAS las dependencias (dev incluidas) para poder compilar con NestJS CLI.
RUN npm ci

# Copia el resto del código fuente
COPY . .

# Compila TypeScript → /app/dist
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: PRODUCTION
# Imagen limpia con solo lo necesario para ejecutar la app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Crea un usuario no-root para correr la aplicación.
# Esto reduce el riesgo en caso de vulnerabilidad en la app o dependencias.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copia los manifiestos e instala SOLO dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código compilado desde el stage "build"
COPY --from=build /app/dist ./dist

# Crea el directorio de uploads y asigna permisos al usuario de la app.
# En producción este directorio será sobreescrito por el volumen montado desde
# el VPS (/data/puro-deportes/uploads), pero crearlo aquí garantiza que el
# usuario appuser tenga los permisos necesarios sobre el punto de montaje.
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Cambia al usuario sin privilegios de root
USER appuser

# Documenta el puerto que la app expone.
# El valor real se configura con la variable de entorno PORT (por defecto 3000).
EXPOSE 3000

# Inicia la aplicación ejecutando directamente el JS compilado (sin ts-node).
# Las migraciones se deben correr ANTES de este comando (ver DEPLOY.md).
CMD ["node", "dist/main"]
