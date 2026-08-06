import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/users/enums/role.enum';

/**
 * Tests E2E de control de acceso por roles.
 *
 * Verifica que:
 *  - Un usuario con role=USER recibe 403 al intentar POST en recursos de escritura.
 *  - Un usuario con role=MANAGER recibe 201/400 (acceso permitido) en los mismos endpoints.
 *
 * Los tokens son firmados directamente con JwtService — no se toca la BD.
 */

// Aumentamos el timeout global para que la inicialización del módulo (y posibles
// reintentos de conexión a la BD) tengan suficiente tiempo.
jest.setTimeout(30000);

describe('Role Access Control (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let userToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = app.get(JwtService);

    // Token con role=USER (seguidor)
    userToken = jwtService.sign({ sub: 9999, email: 'user@test.co', name: 'User Test', role: Role.USER });
    // Token con role=MANAGER (organizador)
    managerToken = jwtService.sign({ sub: 9998, email: 'manager@test.co', name: 'Manager Test', role: Role.MANAGER });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /api/torneos ───────────────────────────────────────────────────────

  describe('POST /api/torneos', () => {
    it('USER → 403 Forbidden', () => {
      return request(app.getHttpServer())
        .post('/api/torneos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nombre: 'Torneo Test', deporte: 'Fútbol', rama: 'Masculino', año: 2026 })
        .expect(403);
    });

    it('MANAGER → no 403 (puede acceder; puede ser 201 o 400 por validaciones)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/torneos')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ nombre: 'Torneo Test', deporte: 'Fútbol', rama: 'Masculino', año: 2026 });

      // El guard de roles NO debe bloquear al MANAGER (no debe ser 403)
      expect(res.status).not.toBe(403);
    });
  });

  // ─── POST /api/equipos ───────────────────────────────────────────────────────

  describe('POST /api/equipos', () => {
    it('USER → 403 Forbidden', () => {
      return request(app.getHttpServer())
        .post('/api/equipos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nombre: 'Equipo Test', deporte: 'Fútbol' })
        .expect(403);
    });

    it('MANAGER → no 403 (puede acceder)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/equipos')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ nombre: 'Equipo Test', deporte: 'Fútbol' });

      expect(res.status).not.toBe(403);
    });
  });

  // ─── POST /api/uploads/logo ──────────────────────────────────────────────────

  describe('POST /api/uploads/logo', () => {
    it('USER → 403 Forbidden', () => {
      return request(app.getHttpServer())
        .post('/api/uploads/logo')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('MANAGER → no 403 (puede acceder; 400 por falta de archivo es aceptable)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/uploads/logo')
        .set('Authorization', `Bearer ${managerToken}`);

      // El guard de roles NO debe bloquear al MANAGER (no debe ser 403)
      expect(res.status).not.toBe(403);
    });
  });

  // ─── Endpoints sin token siguen devolviendo 401 ───────────────────────────

  it('POST /api/torneos sin token → 401', () => {
    return request(app.getHttpServer())
      .post('/api/torneos')
      .send({ nombre: 'Torneo Test' })
      .expect(401);
  });

  it('POST /api/equipos sin token → 401', () => {
    return request(app.getHttpServer())
      .post('/api/equipos')
      .send({ nombre: 'Equipo Test' })
      .expect(401);
  });

  it('POST /api/uploads/logo sin token → 401', () => {
    return request(app.getHttpServer())
      .post('/api/uploads/logo')
      .expect(401);
  });
});
