import * as fs from 'fs';
import { join } from 'path';
import { getUploadsPath } from './uploads-path.util';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('getUploadsPath', () => {
  const originalEnv = process.env.UPLOADS_PATH;

  beforeEach(() => {
    jest.clearAllMocks();
    if (originalEnv !== undefined) {
      process.env.UPLOADS_PATH = originalEnv;
    } else {
      delete process.env.UPLOADS_PATH;
    }
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.UPLOADS_PATH = originalEnv;
    } else {
      delete process.env.UPLOADS_PATH;
    }
  });

  it('debe crear el directorio de forma recursiva con mkdirSync si NO existe', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = getUploadsPath('equipos');
    const expectedPath = join(process.cwd(), 'uploads', 'equipos');

    expect(result).toBe(expectedPath);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('NO debe llamar a mkdirSync si el directorio YA existe', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const result = getUploadsPath('torneos');
    const expectedPath = join(process.cwd(), 'uploads', 'torneos');

    expect(result).toBe(expectedPath);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('debe respetar la variable de entorno UPLOADS_PATH si está configurada', () => {
    process.env.UPLOADS_PATH = '/custom/uploads/path';
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const result = getUploadsPath('noticias');
    const expectedPath = join('/custom/uploads/path', 'noticias');

    expect(result).toBe(expectedPath);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
  });
});
