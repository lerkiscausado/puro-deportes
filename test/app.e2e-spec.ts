import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Se aplica el mismo prefijo global que en main.ts para que los tests sean
    // coherentes con el comportamiento real del servidor.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / → 404 (la raíz no tiene handler; todas las rutas viven bajo /api)', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('GET /api/users/login sin body → 400 (el endpoint existe bajo /api)', () => {
    return request(app.getHttpServer())
      .post('/api/users/login')
      .send({})
      .expect(400);
  });

  it('GET /api/torneos/public → 200 y NO debe exponer datos sensibles (password, email, phone) en la respuesta', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/torneos/public')
      .expect(200);

    const jsonString = JSON.stringify(response.body);
    expect(jsonString).not.toContain('password');
    expect(jsonString).not.toContain('email');
    expect(jsonString).not.toContain('phone');
  });

  it('GET /api/torneos/:id/public → responde sin requerir JWT guard', async () => {
    const response = await request(app.getHttpServer()).get('/api/torneos/999999/public');
    expect(response.status).toBe(404);
  });

  it('GET /api/inscripciones/torneo/:torneoId/public → responde sin requerir JWT guard', async () => {
    const response = await request(app.getHttpServer()).get('/api/inscripciones/torneo/1/public');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/partidos/torneo/:torneoId/public → responde sin requerir JWT guard', async () => {
    const response = await request(app.getHttpServer()).get('/api/partidos/torneo/1/public');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
