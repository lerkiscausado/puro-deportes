import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/users/enums/role.enum';

/**
 * Tests E2E para el módulo de visitas.
 *
 * Verifica que:
 *  - POST /api/visitas/registrar es público (no requiere token) → 201.
 *  - GET  /api/visitas/estadisticas sin token                  → 401.
 *  - GET  /api/visitas/estadisticas con token USER             → 403.
 *  - GET  /api/visitas/estadisticas con token MANAGER          → 403.
 *  - GET  /api/visitas/estadisticas con token ADMIN            → 200.
 *
 * Los tokens son firmados directamente con JwtService — no se toca la BD.
 */

jest.setTimeout(30000);

describe('Visitas (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let adminToken: string;
  let managerToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = app.get(JwtService);

    // Tokens de prueba — no se accede a la BD
    adminToken = jwtService.sign({
      sub: 1,
      email: 'admin@test.co',
      name: 'Admin Test',
      role: Role.ADMIN,
    });

    managerToken = jwtService.sign({
      sub: 2,
      email: 'manager@test.co',
      name: 'Manager Test',
      role: Role.MANAGER,
    });

    userToken = jwtService.sign({
      sub: 3,
      email: 'user@test.co',
      name: 'User Test',
      role: Role.USER,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /api/visitas/registrar ─────────────────────────────────────────────

  describe('POST /api/visitas/registrar', () => {
    it('es público: registra visita sin token → 201', () => {
      return request(app.getHttpServer())
        .post('/api/visitas/registrar')
        .send({ ruta: '/torneos' })
        .expect(201);
    });

    it('es público: funciona con token de usuario normal también → 201', () => {
      return request(app.getHttpServer())
        .post('/api/visitas/registrar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ruta: '/noticias' })
        .expect(201);
    });

    it('valida el DTO: ruta vacía → 400', () => {
      return request(app.getHttpServer())
        .post('/api/visitas/registrar')
        .send({ ruta: '' })
        .expect(400);
    });

    it('valida el DTO: ruta ausente → 400', () => {
      return request(app.getHttpServer())
        .post('/api/visitas/registrar')
        .send({})
        .expect(400);
    });

    it('valida el DTO: ruta demasiado larga (> 255 chars) → 400', () => {
      return request(app.getHttpServer())
        .post('/api/visitas/registrar')
        .send({ ruta: '/'.padEnd(256, 'a') })
        .expect(400);
    });
  });

  // ─── GET /api/visitas/estadisticas ───────────────────────────────────────────

  describe('GET /api/visitas/estadisticas', () => {
    it('sin token → 401 Unauthorized', () => {
      return request(app.getHttpServer())
        .get('/api/visitas/estadisticas')
        .expect(401);
    });

    it('token USER → 403 Forbidden', () => {
      return request(app.getHttpServer())
        .get('/api/visitas/estadisticas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('token MANAGER → 403 Forbidden', () => {
      return request(app.getHttpServer())
        .get('/api/visitas/estadisticas')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('token ADMIN → 200 con estructura de estadísticas correcta', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/visitas/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verifica que la respuesta contiene los campos esperados
      expect(res.body).toHaveProperty('totalVisitas');
      expect(res.body).toHaveProperty('visitasHoy');
      expect(res.body).toHaveProperty('visitasUltimos7Dias');
      expect(res.body).toHaveProperty('visitasUltimos30Dias');
      expect(res.body).toHaveProperty('rutasMasVisitadas');
      expect(Array.isArray(res.body.rutasMasVisitadas)).toBe(true);

      // Los valores deben ser números
      expect(typeof res.body.totalVisitas).toBe('number');
      expect(typeof res.body.visitasHoy).toBe('number');
      expect(typeof res.body.visitasUltimos7Dias).toBe('number');
      expect(typeof res.body.visitasUltimos30Dias).toBe('number');
    });
  });
});
