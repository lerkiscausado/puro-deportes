import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PublicidadService } from './publicidad.service';
import { Publicidad } from './publicidad.entity';
import { CreatePublicidadDto } from './dto/create-publicidad.dto';
import { UpdatePublicidadDto } from './dto/update-publicidad.dto';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('PublicidadService', () => {
  let service: PublicidadService;
  let publicidadRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    publicidadRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      merge: jest.fn((entity, dto) => Object.assign({}, entity, dto)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicidadService,
        {
          provide: getRepositoryToken(Publicidad),
          useValue: publicidadRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<PublicidadService>(PublicidadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    const validDto: CreatePublicidadDto = {
      link: 'https://example.com',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
    };

    it('lanza BadRequestException cuando no se sube ninguna imagen', async () => {
      await expect(
        service.create(validDto, undefined, 1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(validDto, undefined, 1),
      ).rejects.toThrow('Debes cargar una imagen para la publicidad');
    });

    it('lanza BadRequestException cuando fechaFin es anterior a fechaInicio', async () => {
      const dtoFechasInvalidas: CreatePublicidadDto = {
        link: 'https://example.com',
        fechaInicio: '2026-12-31',
        fechaFin: '2026-01-01',
      };
      const mockFile = { filename: 'publicidad-123.jpg' } as Express.Multer.File;

      await expect(
        service.create(dtoFechasInvalidas, mockFile, 1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(dtoFechasInvalidas, mockFile, 1),
      ).rejects.toThrow('La fecha de fin debe ser posterior o igual a la fecha de inicio.');
    });

    it('lanza BadRequestException cuando fechaFin es anterior a fechaInicio (sin imagen)', async () => {
      const dtoFechasInvalidas: CreatePublicidadDto = {
        link: 'https://example.com',
        fechaInicio: '2026-06-01',
        fechaFin: '2026-05-01',
      };

      // Sin imagen lanza primero el error de imagen (imagen tiene precedencia)
      await expect(
        service.create(dtoFechasInvalidas, undefined, 1),
      ).rejects.toThrow('Debes cargar una imagen para la publicidad');
    });

    it('crea correctamente con imagen y fechas válidas', async () => {
      const mockFile = { filename: 'publicidad-123.jpg' } as Express.Multer.File;
      const expectedPublicidad = {
        id: 1,
        link: validDto.link,
        fechaInicio: validDto.fechaInicio,
        fechaFin: validDto.fechaFin,
        imagen: 'publicidad-123.jpg',
        user: { id: 1 },
      };

      publicidadRepositoryMock.create.mockReturnValue(expectedPublicidad);
      publicidadRepositoryMock.save.mockResolvedValue(expectedPublicidad);

      const result = await service.create(validDto, mockFile, 1);

      expect(publicidadRepositoryMock.create).toHaveBeenCalledWith({
        ...validDto,
        imagen: 'publicidad-123.jpg',
        user: { id: 1 },
      });
      expect(result.imagen).toBe('publicidad-123.jpg');
    });

    it('acepta fechaFin igual a fechaInicio (vigencia de un solo día)', async () => {
      const dtoMismaDia: CreatePublicidadDto = {
        link: 'https://example.com',
        fechaInicio: '2026-06-15',
        fechaFin: '2026-06-15',
      };
      const mockFile = { filename: 'publicidad-123.jpg' } as Express.Multer.File;

      publicidadRepositoryMock.create.mockReturnValue({ ...dtoMismaDia, imagen: 'publicidad-123.jpg', user: { id: 1 } });
      publicidadRepositoryMock.save.mockResolvedValue({ id: 1, ...dtoMismaDia, imagen: 'publicidad-123.jpg' });

      const result = await service.create(dtoMismaDia, mockFile, 1);
      expect(result).toBeDefined();
    });
  });

  // ─── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    const existingPublicidad: Partial<Publicidad> = {
      id: 1,
      link: 'https://old.com',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
      imagen: 'publicidad-antigua.jpg',
    };

    it('reemplaza la imagen y elimina la anterior del disco al actualizar con archivo nuevo', async () => {
      const updateDto: UpdatePublicidadDto = { link: 'https://new.com' };
      const mockFile = { filename: 'publicidad-nueva.jpg' } as Express.Multer.File;

      publicidadRepositoryMock.findOne.mockResolvedValue(existingPublicidad);
      publicidadRepositoryMock.save.mockResolvedValue({
        ...existingPublicidad,
        link: 'https://new.com',
        imagen: 'publicidad-nueva.jpg',
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.update(1, updateDto, mockFile);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(publicidadRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ imagen: 'publicidad-nueva.jpg' }),
      );
      expect(result.imagen).toBe('publicidad-nueva.jpg');
    });

    it('conserva la imagen actual cuando no se sube archivo nuevo', async () => {
      const updateDto: UpdatePublicidadDto = { link: 'https://updated.com' };

      publicidadRepositoryMock.findOne.mockResolvedValue(existingPublicidad);
      publicidadRepositoryMock.save.mockResolvedValue({
        ...existingPublicidad,
        link: 'https://updated.com',
      });

      await service.update(1, updateDto, undefined);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(publicidadRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ imagen: 'publicidad-antigua.jpg' }),
      );
    });

    it('no intenta borrar imagen del disco si el registro no tenía imagen previa', async () => {
      const publicidadSinImagen: Partial<Publicidad> = {
        ...existingPublicidad,
        imagen: undefined as any,
      };
      const updateDto: UpdatePublicidadDto = {};
      const mockFile = { filename: 'primera-imagen.jpg' } as Express.Multer.File;

      publicidadRepositoryMock.findOne.mockResolvedValue(publicidadSinImagen);
      publicidadRepositoryMock.save.mockResolvedValue({
        ...publicidadSinImagen,
        imagen: 'primera-imagen.jpg',
      });

      await service.update(1, updateDto, mockFile);

      // existsSync no debe llamarse porque no había imagen previa
      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(publicidadRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ imagen: 'primera-imagen.jpg' }),
      );
    });

    it('lanza BadRequestException si la fecha de fin queda antes de la de inicio al actualizar', async () => {
      publicidadRepositoryMock.findOne.mockResolvedValue(existingPublicidad);

      const updateDtoInvalido: UpdatePublicidadDto = {
        fechaFin: '2025-12-31', // anterior a fechaInicio '2026-01-01'
      };

      await expect(
        service.update(1, updateDtoInvalido, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el anuncio no existe', async () => {
      publicidadRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, {}, undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findVigentesPublic() ─────────────────────────────────────────────────

  describe('findVigentesPublic()', () => {
    it('retorna solo los anuncios cuya fecha actual está dentro del rango fechaInicio-fechaFin', async () => {
      // Fechas relativas al día actual para que el test sea siempre válido
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const toISO = (d: Date) => d.toISOString().split('T')[0];

      // Los mocks representan solo los registros que TypeORM devolvería
      // tras aplicar el filtro LessThanOrEqual / MoreThanOrEqual.
      const vigenteMock = {
        id: 1,
        imagen: 'publicidad-vigente.jpg',
        link: 'https://vigente.com',
      };

      publicidadRepositoryMock.find.mockResolvedValue([vigenteMock]);

      const result = await service.findVigentesPublic();

      // Debe haber llamado a find con los operadores LessThanOrEqual / MoreThanOrEqual
      expect(publicidadRepositoryMock.find).toHaveBeenCalledTimes(1);

      const findArgs = publicidadRepositoryMock.find.mock.calls[0][0];
      expect(findArgs).toHaveProperty('where.fechaInicio');
      expect(findArgs).toHaveProperty('where.fechaFin');
      expect(findArgs).toHaveProperty('select');

      // El resultado contiene el mock devuelto
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(vigenteMock);
    });

    it('NO incluye fechaInicio, fechaFin ni user en la respuesta', async () => {
      const publicidadMock = {
        id: 2,
        imagen: 'banner.jpg',
        link: 'https://banner.com',
      };

      publicidadRepositoryMock.find.mockResolvedValue([publicidadMock]);

      const result = await service.findVigentesPublic();

      expect(result).toHaveLength(1);
      const item = result[0];

      // Solo deben existir estos tres campos
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('imagen');
      expect(item).toHaveProperty('link');
      expect(item).not.toHaveProperty('fechaInicio');
      expect(item).not.toHaveProperty('fechaFin');
      expect(item).not.toHaveProperty('user');
    });

    it('retorna un array vacío cuando no hay anuncios vigentes', async () => {
      publicidadRepositoryMock.find.mockResolvedValue([]);

      const result = await service.findVigentesPublic();

      expect(result).toEqual([]);
    });

    it('la llamada a find incluye el campo select con id, imagen y link', async () => {
      publicidadRepositoryMock.find.mockResolvedValue([]);

      await service.findVigentesPublic();

      const findArgs = publicidadRepositoryMock.find.mock.calls[0][0];
      expect(findArgs.select).toEqual({
        id: true,
        imagen: true,
        link: true,
      });
    });
  });

  // ─── remove() ─────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('elimina el registro y borra la imagen del disco', async () => {
      const existingPublicidad: Partial<Publicidad> = {
        id: 1,
        imagen: 'publicidad-a-borrar.jpg',
      };

      publicidadRepositoryMock.findOne.mockResolvedValue(existingPublicidad);
      publicidadRepositoryMock.remove.mockResolvedValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.remove(1);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(publicidadRepositoryMock.remove).toHaveBeenCalledWith(existingPublicidad);
    });

    it('lanza NotFoundException si el anuncio a eliminar no existe', async () => {
      publicidadRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
