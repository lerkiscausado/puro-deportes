import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { FavoritosService } from './favoritos.service';
import { Favorito } from './favorito.entity';
import { Torneo } from '../torneos/torneo.entity';

describe('FavoritosService', () => {
  let service: FavoritosService;
  let favoritosRepositoryMock: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let torneosRepositoryMock: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    favoritosRepositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => ({ id: undefined, ...data })),
      save: jest.fn(),
      remove: jest.fn(),
    };

    torneosRepositoryMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritosService,
        {
          provide: getRepositoryToken(Favorito),
          useValue: favoritosRepositoryMock,
        },
        {
          provide: getRepositoryToken(Torneo),
          useValue: torneosRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<FavoritosService>(FavoritosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── agregar ────────────────────────────────────────────────────────────────

  describe('agregar', () => {
    it('agrega un favorito nuevo y retorna mensaje + id', async () => {
      torneosRepositoryMock.findOne.mockResolvedValue({ id: 5, name: 'Torneo A' });
      favoritosRepositoryMock.findOne.mockResolvedValue(null); // no existe previo
      favoritosRepositoryMock.save.mockResolvedValue({ id: 42, user: { id: 1 }, torneo: { id: 5 } });

      const result = await service.agregar(1, 5);

      expect(torneosRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(favoritosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 }, torneo: { id: 5 } },
      });
      expect(favoritosRepositoryMock.save).toHaveBeenCalled();
      expect(result.id).toBe(42);
      expect(result.message).toContain('exitosamente');
    });

    it('lanza ConflictException si el favorito ya existe (check optimista)', async () => {
      torneosRepositoryMock.findOne.mockResolvedValue({ id: 5 });
      favoritosRepositoryMock.findOne.mockResolvedValue({ id: 10 }); // ya existe

      await expect(service.agregar(1, 5)).rejects.toThrow(
        new ConflictException('Este torneo ya está en tus favoritos'),
      );

      expect(favoritosRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si save() falla con ER_DUP_ENTRY (condición de carrera)', async () => {
      torneosRepositoryMock.findOne.mockResolvedValue({ id: 5 });
      favoritosRepositoryMock.findOne.mockResolvedValue(null); // check optimista: libre

      const dbDupError = new QueryFailedError('INSERT INTO favoritos...', [], {
        code: 'ER_DUP_ENTRY',
      } as any);
      favoritosRepositoryMock.save.mockRejectedValue(dbDupError);

      await expect(service.agregar(1, 5)).rejects.toThrow(
        new ConflictException('Este torneo ya está en tus favoritos'),
      );
    });

    it('lanza NotFoundException si el torneo no existe', async () => {
      torneosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.agregar(1, 999)).rejects.toThrow(
        new NotFoundException('Torneo no encontrado'),
      );

      expect(favoritosRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(favoritosRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  // ─── eliminar ───────────────────────────────────────────────────────────────

  describe('eliminar', () => {
    it('elimina el favorito si existe', async () => {
      const mockFavorito = { id: 10, user: { id: 1 }, torneo: { id: 5 } };
      favoritosRepositoryMock.findOne.mockResolvedValue(mockFavorito);
      favoritosRepositoryMock.remove.mockResolvedValue(mockFavorito);

      await expect(service.eliminar(1, 5)).resolves.toBeUndefined();

      expect(favoritosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 }, torneo: { id: 5 } },
      });
      expect(favoritosRepositoryMock.remove).toHaveBeenCalledWith(mockFavorito);
    });

    it('lanza NotFoundException si el favorito no existe', async () => {
      favoritosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.eliminar(1, 99)).rejects.toThrow(
        new NotFoundException('Este torneo no está en tus favoritos'),
      );

      expect(favoritosRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });

  // ─── misFavoritos ────────────────────────────────────────────────────────────

  describe('misFavoritos', () => {
    it('retorna la lista aplanada de torneos del usuario correcto, ordenada por createdAt DESC', async () => {
      const now = new Date();
      const yesterday = new Date(Date.now() - 86400000);

      const mockFavoritos = [
        {
          id: 2,
          createdAt: now,
          torneo: { id: 10, name: 'Torneo Reciente', deporte: 'Futbol' },
        },
        {
          id: 1,
          createdAt: yesterday,
          torneo: { id: 5, name: 'Torneo Antiguo', deporte: 'Baloncesto' },
        },
      ];

      favoritosRepositoryMock.find.mockResolvedValue(mockFavoritos);

      const result = await service.misFavoritos(7);

      // Verifica que la consulta filtre por el userId correcto
      expect(favoritosRepositoryMock.find).toHaveBeenCalledWith({
        where: { user: { id: 7 } },
        relations: { torneo: true },
        order: { createdAt: 'DESC' },
      });

      // Verifica que la respuesta está aplanada
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(10);
      expect(result[0].name).toBe('Torneo Reciente');
      expect(result[0].favoritoDesde).toBe(now);
      expect(result[1].id).toBe(5);
      expect(result[1].name).toBe('Torneo Antiguo');
      expect(result[1].favoritoDesde).toBe(yesterday);

      // La respuesta NO debe contener la estructura anidada original
      expect(result[0]).not.toHaveProperty('torneo');
    });

    it('retorna array vacío si el usuario no tiene favoritos', async () => {
      favoritosRepositoryMock.find.mockResolvedValue([]);

      const result = await service.misFavoritos(99);

      expect(result).toEqual([]);
    });
  });
});
