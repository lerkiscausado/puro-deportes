import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/users/enums/role.enum';
import * as fs from 'fs';
import * as path from 'path';

// Aumentamos el timeout global para que la inicialización del módulo (y posibles
// reintentos de conexión a la BD) tengan suficiente tiempo.
jest.setTimeout(30000);

describe('UploadsController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let validToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Espejo del prefijo global configurado en main.ts
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = app.get(JwtService);
    // Generamos un token con role MANAGER para las pruebas
    // (el endpoint /uploads/logo ahora requiere ADMIN o MANAGER)
    validToken = jwtService.sign({ sub: 1, role: Role.MANAGER });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/uploads/logo (POST) - Debería retornar 401 si no se envía token', () => {
    return request(app.getHttpServer()).post('/api/uploads/logo').expect(401);
  });

  it('/api/uploads/logo (POST) - Debería retornar 401 si el token es inválido', () => {
    return request(app.getHttpServer())
      .post('/api/uploads/logo')
      .set('Authorization', 'Bearer token_invalido_de_prueba')
      .expect(401);
  });

  it('/api/uploads/logo (POST) - Debería retornar 400 si no se envía ningún archivo', () => {
    return request(app.getHttpServer())
      .post('/api/uploads/logo')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(400)
      .expect((res) => {
        const body = res.body as { message: string };
        expect(body.message).toContain('No se ha proporcionado el archivo');
      });
  });

  it('/api/uploads/logo (POST) - Debería retornar 400 si el archivo no es una imagen', () => {
    // Usamos un buffer de texto simulando un archivo no permitido
    const textBuffer = Buffer.from('contenido_de_texto');

    return request(app.getHttpServer())
      .post('/api/uploads/logo')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('logo', textBuffer, 'test.txt')
      .expect(400)
      .expect((res) => {
        const body = res.body as { message: string };
        expect(body.message).toContain('Solo se permiten archivos de imagen');
      });
  });

  it('/api/uploads/logo (POST) - Debería subir exitosamente una imagen válida', async () => {
    // Buffer de 1x1 píxeles de una imagen PNG transparente en base64
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const imgBuffer = Buffer.from(pngBase64, 'base64');

    const res = await request(app.getHttpServer())
      .post('/api/uploads/logo')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('logo', imgBuffer, 'test-logo.png')
      .expect(201);

    const body = res.body as { message: string; filename: string; url: string };
    expect(body).toHaveProperty('message', 'Logo subido con éxito');
    expect(body).toHaveProperty('filename');
    expect(body).toHaveProperty('url');
    expect(body.url).toContain('/uploads/logos/logo-');

    // Verificar físicamente que el archivo fue creado y luego eliminarlo para no dejar basura
    const filePath = path.join(
      __dirname,
      '..',
      'uploads',
      'logos',
      body.filename,
    );
    expect(fs.existsSync(filePath)).toBe(true);

    // Limpieza
    fs.unlinkSync(filePath);
  });
});
