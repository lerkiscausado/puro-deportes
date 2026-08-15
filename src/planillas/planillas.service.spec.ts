import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PlanillasService } from './planillas.service';
import { Planilla } from './planilla.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { EstadoPlanilla } from './enums/estado-planilla.enum';

describe('PlanillasService', () => {
  let service: PlanillasService;
  let planillasRepoMock: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    remove: jest.Mock;
  };
  let usersRepoMock: { findOne: jest.Mock };
  let torneosRepoMock: { findOne: jest.Mock };
  let equiposRepoMock: { findOne: jest.Mock };
  let jugadoresRepoMock: { findOne: jest.Mock };

  beforeEach(async () => {
    planillasRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    };
    usersRepoMock = { findOne: jest.fn() };
    torneosRepoMock = { findOne: jest.fn() };
    equiposRepoMock = { findOne: jest.fn() };
    jugadoresRepoMock = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanillasService,
        {
          provide: getRepositoryToken(Planilla),
          useValue: planillasRepoMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepoMock,
        },
        {
          provide: getRepositoryToken(Torneo),
          useValue: torneosRepoMock,
        },
        {
          provide: getRepositoryToken(Equipo),
          useValue: equiposRepoMock,
        },
        {
          provide: getRepositoryToken(Jugador),
          useValue: jugadoresRepoMock,
        },
      ],
    }).compile();

    service = module.get<PlanillasService>(PlanillasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 1;
    const dto = {
      idTorneo: 10,
      idEquipo: 20,
      idJugador: 30,
      numeroCamiseta: 10,
      estado: EstadoPlanilla.ACTIVO,
    };

    const mockUser = { id: 1, name: 'Admin' } as unknown as User;
    const mockTorneo = { id: 10, nombre: 'Copa Verano' } as unknown as Torneo;
    const mockEquipo = { id: 20, nombre: 'Los Halcones' } as unknown as Equipo;
    const mockJugador = {
      id: 30,
      nombre: 'Carlos',
      apellidos: 'Gomez',
    } as unknown as Jugador;

    beforeEach(() => {
      usersRepoMock.findOne.mockResolvedValue(mockUser);
      torneosRepoMock.findOne.mockResolvedValue(mockTorneo);
      equiposRepoMock.findOne.mockResolvedValue(mockEquipo);
      jugadoresRepoMock.findOne.mockResolvedValue(mockJugador);
    });

    it('con número de camiseta ya usado en el mismo equipo lanza BadRequestException con el mensaje correcto', async () => {
      // 1. Check jugador activo en torneo: no existe duplicado de jugador
      planillasRepoMock.findOne.mockImplementation(({ where }) => {
        if (where.jugador && where.estado === EstadoPlanilla.ACTIVO) {
          return Promise.resolve(null);
        }
        // 2. Check numeroCamiseta en equipo y torneo: ya ocupado por otro jugador
        if (where.numeroCamiseta === 10) {
          return Promise.resolve({
            id: 99,
            numeroCamiseta: 10,
            jugador: { nombre: 'Andres', apellidos: 'Perez' },
          });
        }
        return Promise.resolve(null);
      });

      await expect(service.create(dto, userId)).rejects.toThrow(
        new BadRequestException(
          'El número de camiseta 10 ya está asignado a "Andres Perez" en el equipo "Los Halcones".',
        ),
      );
      expect(planillasRepoMock.create).not.toHaveBeenCalled();
    });

    it('con el mismo número pero en un EQUIPO DIFERENTE del mismo torneo funciona correctamente', async () => {
      // No existe jugador en torneo ni camiseta en el equipo 20
      planillasRepoMock.findOne.mockResolvedValue(null);

      const nuevaPlanilla = {
        id: 1,
        user: mockUser,
        torneo: mockTorneo,
        equipo: mockEquipo,
        jugador: mockJugador,
        numeroCamiseta: 10,
        estado: EstadoPlanilla.ACTIVO,
      };

      planillasRepoMock.create.mockReturnValue(nuevaPlanilla);
      planillasRepoMock.save.mockResolvedValue(nuevaPlanilla);

      // Para el findOne final
      planillasRepoMock.findOne.mockImplementation(({ where }) => {
        if (where.id === 1) {
          return Promise.resolve(nuevaPlanilla);
        }
        return Promise.resolve(null);
      });

      const res = await service.create(dto, userId);

      expect(planillasRepoMock.create).toHaveBeenCalledWith({
        user: mockUser,
        torneo: mockTorneo,
        equipo: mockEquipo,
        jugador: mockJugador,
        numeroCamiseta: 10,
        estado: EstadoPlanilla.ACTIVO,
      });
      expect(res.id).toBe(1);
      expect(res.numeroCamiseta).toBe(10);
    });

    it('convierte un error de duplicado a nivel de BD (QueryFailedError con ER_DUP_ENTRY) en BadRequestException', async () => {
      planillasRepoMock.findOne.mockResolvedValue(null);
      planillasRepoMock.create.mockReturnValue({});

      const dbError: any = new QueryFailedError('query', [], new Error('Duplicate entry'));
      dbError.driverError = { code: 'ER_DUP_ENTRY' };
      planillasRepoMock.save.mockRejectedValue(dbError);

      await expect(service.create(dto, userId)).rejects.toThrow(
        new BadRequestException(
          'Ese número de camiseta ya fue asignado a otro jugador de este equipo, intenta con otro número.',
        ),
      );
    });
  });

  describe('update', () => {
    const id = 1;
    const planillaExistente = {
      id: 1,
      torneo: { id: 10, nombre: 'Copa Verano' },
      equipo: { id: 20, nombre: 'Los Halcones' },
      jugador: { id: 30, nombre: 'Carlos', apellidos: 'Gomez' },
      numeroCamiseta: 7,
      estado: EstadoPlanilla.ACTIVO,
      user: { id: 1 },
    } as any;

    it('con número de camiseta que choca con otra planilla del mismo equipo lanza BadRequestException', async () => {
      // Primer findOne(id) obtiene la planilla a editar
      planillasRepoMock.findOne.mockImplementation(({ where }) => {
        if (where.id === 1) {
          return Promise.resolve(planillaExistente);
        }
        // Segundo findOne: check jugador en torneo
        if (where.jugador && where.estado === EstadoPlanilla.ACTIVO) {
          return Promise.resolve(null);
        }
        // Tercer findOne: check numeroCamiseta
        if (where.numeroCamiseta === 10) {
          return Promise.resolve({
            id: 2,
            numeroCamiseta: 10,
            jugador: { nombre: 'Luis', apellidos: 'Diaz' },
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.update(id, { numeroCamiseta: 10 }),
      ).rejects.toThrow(
        new BadRequestException(
          'El número de camiseta 10 ya está asignado a "Luis Diaz" en el equipo "Los Halcones".',
        ),
      );
    });

    it('NO se dispara al "chocar consigo misma" (editar sin cambiar camiseta ni chocar con otra)', async () => {
      planillasRepoMock.findOne.mockImplementation(({ where }) => {
        if (where.id === 1) {
          return Promise.resolve(planillaExistente);
        }
        // No choca con otra planilla porque where tiene id: Not(1)
        return Promise.resolve(null);
      });

      planillasRepoMock.merge.mockImplementation((orig, changes) => ({
        ...orig,
        ...changes,
      }));
      planillasRepoMock.save.mockResolvedValue(planillaExistente);

      const res = await service.update(id, { estado: EstadoPlanilla.SUSPENDIDO });

      expect(res).toBeDefined();
      expect(planillasRepoMock.save).toHaveBeenCalled();
    });

    it('convierte un error de duplicado a nivel de BD (QueryFailedError con ER_DUP_ENTRY) en BadRequestException en update', async () => {
      planillasRepoMock.findOne.mockImplementation(({ where }) => {
        if (where.id === 1) {
          return Promise.resolve(planillaExistente);
        }
        return Promise.resolve(null);
      });

      planillasRepoMock.merge.mockImplementation((orig, changes) => ({
        ...orig,
        ...changes,
      }));

      const dbError: any = new QueryFailedError('query', [], new Error('Duplicate entry'));
      dbError.driverError = { code: 'ER_DUP_ENTRY' };
      planillasRepoMock.save.mockRejectedValue(dbError);

      await expect(
        service.update(id, { numeroCamiseta: 99 }),
      ).rejects.toThrow(
        new BadRequestException(
          'Ese número de camiseta ya fue asignado a otro jugador de este equipo, intenta con otro número.',
        ),
      );
    });
  });
});
