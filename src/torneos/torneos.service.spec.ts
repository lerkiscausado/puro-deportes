import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TorneosService } from './torneos.service';
import { Torneo } from './torneo.entity';
import { User } from '../users/user.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { EstadoTorneo } from './enums/estado-torneo.enum';
import { Deporte } from './enums/deporte.enum';
import { Rama } from './enums/rama.enum';

describe('TorneosService', () => {
  let service: TorneosService;
  let torneosRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    torneosRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TorneosService,
        {
          provide: getRepositoryToken(Torneo),
          useValue: torneosRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Escenario),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TorneosService>(TorneosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicById', () => {
    it('debe retornar el torneo sin incluir la relación user en relations', async () => {
      const mockTorneo: Partial<Torneo> = {
        id: 1,
        name: 'Torneo Nocturno',
        deporte: Deporte.FUTBOL,
        rama: Rama.MASCULINO,
        estado: EstadoTorneo.EN_JUEGO,
        escenario: { id: 5, nombre: 'Cancha 1' } as Escenario,
      };

      torneosRepositoryMock.findOne.mockResolvedValue(mockTorneo);

      const result = await service.findPublicById(1);

      expect(torneosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockTorneo);
      expect(result.user).toBeUndefined();
    });

    it('debe lanzar NotFoundException si el torneo no existe', async () => {
      torneosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findPublicById(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findPublicById(999)).rejects.toThrow(
        'Torneo no encontrado',
      );
    });
  });
});
