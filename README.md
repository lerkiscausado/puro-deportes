<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Prefijo global de la API

Todas las rutas de la API están bajo el prefijo **`/api`**. Ejemplos:

| Método | Ruta |
|--------|------|
| `POST` | `/api/users/login` |
| `POST` | `/api/users/register` |
| `GET` | `/api/torneos/public` |
| `GET` | `/api/noticias` |
| `POST` | `/api/uploads/logo` |

> **Excepción:** los archivos estáticos (imágenes subidas) se sirven directamente
> desde `/uploads/...` **sin** el prefijo `/api`, ya que son gestionados por
> Express y no por el router de NestJS.
> Ejemplo: `GET /uploads/logos/mi-logo.png`

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Seguridad

### Cabeceras HTTP — Helmet

[Helmet](https://helmetjs.github.io/) está habilitado como middleware global.
Agrega automáticamente cabeceras de seguridad en todas las respuestas:

- `Content-Security-Policy`
- `X-Frame-Options` (protección contra clickjacking)
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`, entre otras.

### Rate Limiting — @nestjs/throttler

Se aplica rate limiting global y límites específicos en los endpoints de autenticación:

| Endpoint | Límite | Ventana |
|---|---|---|
| Todos los demás endpoints | 100 peticiones / IP | 1 minuto |
| `POST /api/users/login` | **5 peticiones / IP** | 1 minuto |
| `POST /api/users/register` | **3 peticiones / IP** | 1 minuto |

Al superar el límite, el servidor responde con HTTP `429 Too Many Requests` y el mensaje:
> "Demasiados intentos, por favor espera un momento antes de volver a intentarlo."

### Protección contra enumeración de usuarios

El endpoint `POST /api/users/login` devuelve **siempre el mismo mensaje de error**
(`"Credenciales inválidas"`) independientemente de si el email no existe o si la
contraseña es incorrecta. Esto evita que un atacante pueda descubrir qué emails
están registrados en el sistema.

---

## Migraciones de base de datos


El proyecto usa TypeORM 0.3.x con un flujo de migraciones explícitas para entornos
distintos al de desarrollo local.

### Comportamiento según entorno

| `NODE_ENV` | `synchronize` | Cómo se actualiza el esquema |
|---|---|---|
| `development` | ✅ activado | TypeORM sincroniza automáticamente al arrancar |
| `production` / `staging` / cualquier otro | ❌ desactivado | **Ejecutar `npm run migration:run` antes de iniciar la app** |

> [!WARNING]
> Nunca despliegues en producción sin correr las migraciones primero.
> Con `synchronize: false`, TypeORM no altera el esquema automáticamente —
> si hay diferencias entre las entidades y la BD, la app puede fallar en runtime.

### Flujo de trabajo

**1. Generar una nueva migración** (cuando modifiques una entidad):
```bash
npm run migration:generate -- src/migrations/NombreDescriptivo
# Ejemplo:
npm run migration:generate -- src/migrations/AgregarCampoFotoTorneo
```
TypeORM compara las entidades actuales contra el esquema real de la BD
y genera el archivo de migración con los cambios mínimos necesarios.

**2. Revisar el archivo generado** en `src/migrations/` antes de commitear.

**3. Aplicar migraciones pendientes:**
```bash
npm run migration:run
```

**4. Revertir la última migración** (si algo sale mal):
```bash
npm run migration:revert
```

**5. Ver el estado de las migraciones:**
```bash
npm run migration:show
```

### Despliegue en producción/staging

```bash
# 1. Correr migraciones ANTES de iniciar la app
npm run migration:run

# 2. Iniciar la aplicación
npm run start:prod
```

## Deployment


When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Variables de entorno

Este proyecto requiere un archivo `.env` en la raíz para funcionar correctamente.

**Pasos para configurarlo:**

1. Copia el archivo de ejemplo incluido en el repositorio:
   ```bash
   cp .env.example .env
   ```
2. Abre `.env` y reemplaza cada valor de ejemplo con los valores reales de tu entorno (credenciales de base de datos, secreto JWT, etc.).
3. **Nunca subas `.env` al repositorio.** Ya está incluido en `.gitignore`, pero verifica que no lo agregues accidentalmente con `git add`.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP en el que levanta el servidor |
| `DB_HOST` | Host del servidor MySQL |
| `DB_PORT` | Puerto del servidor MySQL |
| `DB_USERNAME` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `DB_DATABASE` | Nombre de la base de datos |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `CORS_ORIGIN` | Orígenes permitidos en CORS (ver formato abajo) |
| `NODE_ENV` | Entorno de ejecución (`development` / `production` / `test`) |

### Configuración de `CORS_ORIGIN`

La variable `CORS_ORIGIN` controla qué orígenes pueden hacer peticiones al backend.
Acepta **uno o varios orígenes separados por comas** (sin espacios entre ellos).

```dotenv
# Un solo origen (típico en desarrollo local)
CORS_ORIGIN=http://localhost:3001

# Varios orígenes (desarrollo local + producción)
CORS_ORIGIN=http://localhost:3001,https://purodeporte.com
```

> **Nota:** Si `CORS_ORIGIN` no está definida, el servidor arranca con el fallback
> `http://localhost:3001` y muestra un aviso en consola. En producción **siempre**
> define esta variable explícitamente.

---

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
