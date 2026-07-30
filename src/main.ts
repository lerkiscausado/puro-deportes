import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Helmet — cabeceras HTTP de seguridad ──────────────────────────────────
  // Debe registrarse ANTES que CORS para no interferir con las cabeceras
  // Access-Control-* que NestJS agrega posteriormente.
  // Activa cabeceras como: Content-Security-Policy, X-Frame-Options,
  // X-XSS-Protection, Strict-Transport-Security, etc.
  app.use(helmet());
  // ─────────────────────────────────────────────────────────────────────────

  // ── Prefijo global de API ─────────────────────────────────────────────────
  // Todas las rutas de los controllers quedan bajo /api (ej: /api/torneos,
  // /api/users/login). El prefijo NO afecta a los archivos estáticos servidos
  // mediante useStaticAssets(), que siguen accesibles en /uploads/... tal cual.
  app.setGlobalPrefix('api');
  // ─────────────────────────────────────────────────────────────────────────

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── CORS ──────────────────────────────────────────────────────────────────
  // CORS_ORIGIN puede contener uno o varios orígenes separados por comas.
  // Ejemplo: "http://localhost:3001,https://purodeporte.com"
  const corsOriginEnv = process.env.CORS_ORIGIN;

  let allowedOrigins: string[];
  if (corsOriginEnv) {
    allowedOrigins = corsOriginEnv.split(',').map((o) => o.trim());
  } else {
    console.warn(
      '[CORS] La variable de entorno CORS_ORIGIN no está configurada. ' +
        'Se usará el valor por defecto: http://localhost:3001',
    );
    allowedOrigins = ['http://localhost:3001'];
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ── Archivos estáticos (uploads) ─────────────────────────────────────────
  // Se sirven desde /uploads/... SIN el prefijo /api (useStaticAssets actúa
  // a nivel Express, fuera del router de NestJS, por lo que el global prefix
  // no lo afecta).
  // En producción (Docker) configurar UPLOADS_PATH con la ruta interna del
  // volumen montado (ej: /app/uploads) para que los archivos sean persistentes.
  const uploadsPath = process.env.UPLOADS_PATH ?? join(process.cwd(), 'uploads');
  if (!process.env.UPLOADS_PATH) {
    console.warn(
      '[UPLOADS] La variable de entorno UPLOADS_PATH no está configurada. ' +
        `Se usará el valor por defecto: ${uploadsPath}`,
    );
  }
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
  // ─────────────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
