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
});
