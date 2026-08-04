import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PartidosService } from './partidos.service';
import { Partido } from './partido.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { Inscripcion } from '../inscripciones/inscripcion.entity';
import { EstadoPartido } from './enums/estado-partido.enum';
import { TipoJuego } from './enums/tipo-juego.enum';

describe('PartidosService', () => {
  let service: PartidosService;
  let partidosRepositoryMock: {
    find: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    partidosRepositoryMock = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartidosService,
        {
          provide: getRepositoryToken(Partido),
          useValue: partidosRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Torneo),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Equipo),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Escenario),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PartidosService>(PartidosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicProgramados', () => {
    it('debe retornar solo partidos en estado PROGRAMADO desde la fecha actual sin incluir la relación user', async () => {
      const mockProgramados: Partial<Partido>[] = [
        {
          id: 1,
          fecha: '2026-08-10',
          hora: '15:00:00',
          estado: EstadoPartido.PROGRAMADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
          torneo: { id: 1, name: 'Torneo 1', user: { id: 99 } } as Torneo,
          equipoLocal: { id: 10, nombre: 'Equipo A' } as Equipo,
          equipoVisitante: { id: 20, nombre: 'Equipo B' } as Equipo,
        },
      ];

      partidosRepositoryMock.find.mockResolvedValue(mockProgramados);

      const result = (await service.findPublicProgramados()) as Partido[];

      expect(partidosRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          estado: EstadoPartido.PROGRAMADO,
          fecha: expect.anything(),
        },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'ASC',
          hora: 'ASC',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe(EstadoPartido.PROGRAMADO);
      expect(result[0].user).toBeUndefined();
      expect(result[0].torneo?.user).toBeUndefined();
    });

    it('debe retornar objeto paginado cuando se pasan parámetros page y limit', async () => {
      const mockProgramados: Partial<Partido>[] = [
        {
          id: 1,
          fecha: '2026-08-10',
          hora: '15:00:00',
          estado: EstadoPartido.PROGRAMADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
        },
      ];

      partidosRepositoryMock.findAndCount.mockResolvedValue([mockProgramados, 12]);

      const result = (await service.findPublicProgramados(1, 10)) as {
        data: Partido[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };

      expect(partidosRepositoryMock.findAndCount).toHaveBeenCalledWith({
        where: {
          estado: EstadoPartido.PROGRAMADO,
          fecha: expect.anything(),
        },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'ASC',
          hora: 'ASC',
        },
        skip: 0,
        take: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(12);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(result.data[0].user).toBeUndefined();
    });
  });

  describe('findPublicFinalizados', () => {
    it('debe retornar solo partidos en estado FINALIZADO limitando a 50 sin incluir user cuando no hay paginación', async () => {
      const mockFinalizados: Partial<Partido>[] = [
        {
          id: 2,
          fecha: '2026-08-01',
          hora: '18:00:00',
          local: 2,
          visitante: 1,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
        },
      ];

      partidosRepositoryMock.find.mockResolvedValue(mockFinalizados);

      const result = (await service.findPublicFinalizados()) as Partido[];

      expect(partidosRepositoryMock.find).toHaveBeenCalledWith({
        where: { estado: EstadoPartido.FINALIZADO },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'DESC',
          hora: 'DESC',
        },
        take: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe(EstadoPartido.FINALIZADO);
      expect(result[0].user).toBeUndefined();
    });

    it('debe retornar objeto paginado cuando se pasan parámetros page y limit', async () => {
      const mockFinalizados: Partial<Partido>[] = [
        {
          id: 2,
          fecha: '2026-08-01',
          hora: '18:00:00',
          local: 2,
          visitante: 1,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
        },
      ];

      partidosRepositoryMock.findAndCount.mockResolvedValue([mockFinalizados, 15]);

      const result = (await service.findPublicFinalizados(1, 10)) as {
        data: Partido[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };

      expect(partidosRepositoryMock.findAndCount).toHaveBeenCalledWith({
        where: { estado: EstadoPartido.FINALIZADO },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'DESC',
          hora: 'DESC',
        },
        skip: 0,
        take: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(result.data[0].user).toBeUndefined();
    });
  });

  describe('findPublicByTorneo', () => {
    it('debe retornar los partidos de un torneo ordenados por fecha ASC y hora ASC sin incluir datos de user', async () => {
      const mockPartidos: Partial<Partido>[] = [
        {
          id: 1,
          fecha: '2026-08-10',
          hora: '15:00:00',
          estado: EstadoPartido.PROGRAMADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
          torneo: { id: 5, name: 'Torneo 5', user: { id: 99 } } as Torneo,
          equipoLocal: { id: 10, nombre: 'Local' } as Equipo,
          equipoVisitante: { id: 20, nombre: 'Visitante' } as Equipo,
          escenario: { id: 2, nombre: 'Estadio 1' } as Escenario,
        },
        {
          id: 2,
          fecha: '2026-08-10',
          hora: '17:00:00',
          estado: EstadoPartido.FINALIZADO,
          local: 3,
          visitante: 1,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
          torneo: { id: 5, name: 'Torneo 5' } as Torneo,
          equipoLocal: { id: 30, nombre: 'Local 2' } as Equipo,
          equipoVisitante: { id: 40, nombre: 'Visitante 2' } as Equipo,
        },
      ];

      partidosRepositoryMock.find.mockResolvedValue(mockPartidos);

      const result = await service.findPublicByTorneo(5);

      expect(partidosRepositoryMock.find).toHaveBeenCalledWith({
        where: { torneo: { id: 5 } },
        relations: {
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'ASC',
          hora: 'ASC',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].user).toBeUndefined();
      expect(result[0].torneo?.user).toBeUndefined();
      expect(result[1].user).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain('admin@test.com');
    });
  });
});
