import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PartidosService } from './partidos.service';
import { Partido } from './partido.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { Inscripcion } from '../inscripciones/inscripcion.entity';
import { PartidoPeriodo } from '../partidoperiodos/partidoperiodo.entity';
import { EstadoPartido } from './enums/estado-partido.enum';
import { TipoJuego } from './enums/tipo-juego.enum';
import { EstadoInscripcion } from '../inscripciones/enums/estado-inscripcion.enum';

describe('PartidosService', () => {
  let service: PartidosService;
  let partidosRepositoryMock: {
    find: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let inscripcionesRepositoryMock: {
    find: jest.Mock;
    save: jest.Mock;
  };
  let torneosRepositoryMock: { findOne: jest.Mock };
  let partidoperiodosRepositoryMock: { find: jest.Mock };

  beforeEach(async () => {
    partidosRepositoryMock = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    inscripcionesRepositoryMock = {
      find: jest.fn(),
      save: jest.fn(),
    };
    torneosRepositoryMock = { findOne: jest.fn() };
    partidoperiodosRepositoryMock = { find: jest.fn() };

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
          useValue: torneosRepositoryMock,
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
          useValue: inscripcionesRepositoryMock,
        },
        {
          provide: getRepositoryToken(PartidoPeriodo),
          useValue: partidoperiodosRepositoryMock,
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

      partidosRepositoryMock.findAndCount.mockResolvedValue([
        mockProgramados,
        12,
      ]);

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

      partidosRepositoryMock.findAndCount.mockResolvedValue([
        mockFinalizados,
        15,
      ]);

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

  // ---------------------------------------------------------------------------
  // recalculateTournamentStandings – puntosAnotados / puntosRecibidos
  // ---------------------------------------------------------------------------

  describe('recalculateTournamentStandings', () => {
    /** Crea una inscripción fake con todos los contadores en 0 */
    const makeInscripcion = (equipoId: number): Partial<Inscripcion> => ({
      id: equipoId * 10,
      equipo: { id: equipoId } as Equipo,
      partidosJugados: 0,
      partidosGanados: 0,
      partidosEmpatados: 0,
      partidosPerdidos: 0,
      puntosFavor: 0,
      puntosContra: 0,
      puntosAnotados: 0,
      puntosRecibidos: 0,
      diferencia: 0,
      puntos: 0,
      estado: EstadoInscripcion.ACTIVO,
    });

    it('vóley: debe acumular puntosAnotados y puntosRecibidos sumando los sets de PartidoPeriodo', async () => {
      const inscLocal = makeInscripcion(1);
      const inscVisitante = makeInscripcion(2);

      // Torneo de voleibol
      torneosRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        deporte: 'Voleibol',
      });

      // Inscripciones activas
      inscripcionesRepositoryMock.find.mockResolvedValue([
        inscLocal,
        inscVisitante,
      ]);

      // Partido finalizado: local ganó 3-1 (sets)
      partidosRepositoryMock.find.mockResolvedValue([
        {
          id: 100,
          local: 3,
          visitante: 1,
          equipoLocal: { id: 1 } as Equipo,
          equipoVisitante: { id: 2 } as Equipo,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
        } as Partido,
      ]);

      // 4 sets: 25-20, 25-18, 20-25, 25-22  →  local 95, visitante 85
      partidoperiodosRepositoryMock.find.mockResolvedValue([
        { scoreLocal: 25, scoreVisitante: 20 },
        { scoreLocal: 25, scoreVisitante: 18 },
        { scoreLocal: 20, scoreVisitante: 25 },
        { scoreLocal: 25, scoreVisitante: 22 },
      ] as Partial<PartidoPeriodo>[]);

      inscripcionesRepositoryMock.save.mockResolvedValue(undefined);

      await service.recalculateTournamentStandings(1);

      // puntosAnotados del local = suma scoreLocal de los sets
      expect(inscLocal.puntosAnotados).toBe(95);
      // puntosRecibidos del local = suma scoreVisitante de los sets
      expect(inscLocal.puntosRecibidos).toBe(85);

      // Visitante: simétricamente invertido
      expect(inscVisitante.puntosAnotados).toBe(85);
      expect(inscVisitante.puntosRecibidos).toBe(95);

      // También verifica los sets (puntosFavor/puntosContra)
      expect(inscLocal.puntosFavor).toBe(3);
      expect(inscLocal.puntosContra).toBe(1);
      expect(inscVisitante.puntosFavor).toBe(1);
      expect(inscVisitante.puntosContra).toBe(3);
    });

    it('vóley: múltiples partidos acumulan sets de todos los partidos', async () => {
      const inscA = makeInscripcion(1);
      const inscB = makeInscripcion(2);
      const inscC = makeInscripcion(3);

      torneosRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        deporte: 'voley',
      });
      inscripcionesRepositoryMock.find.mockResolvedValue([inscA, inscB, inscC]);

      // Partido 1: A(1) vs B(2), A gana 3-0
      // Partido 2: B(2) vs C(3), B gana 3-2
      partidosRepositoryMock.find.mockResolvedValue([
        {
          id: 201,
          local: 3,
          visitante: 0,
          equipoLocal: { id: 1 } as Equipo,
          equipoVisitante: { id: 2 } as Equipo,
        } as Partido,
        {
          id: 202,
          local: 3,
          visitante: 2,
          equipoLocal: { id: 2 } as Equipo,
          equipoVisitante: { id: 3 } as Equipo,
        } as Partido,
      ]);

      // Sets del partido 1 (3 sets)
      const setsPartido1 = [
        { scoreLocal: 25, scoreVisitante: 15 },
        { scoreLocal: 25, scoreVisitante: 18 },
        { scoreLocal: 25, scoreVisitante: 20 },
      ] as Partial<PartidoPeriodo>[];

      // Sets del partido 2 (5 sets)
      const setsPartido2 = [
        { scoreLocal: 25, scoreVisitante: 20 },
        { scoreLocal: 18, scoreVisitante: 25 },
        { scoreLocal: 25, scoreVisitante: 23 },
        { scoreLocal: 20, scoreVisitante: 25 },
        { scoreLocal: 15, scoreVisitante: 13 },
      ] as Partial<PartidoPeriodo>[];

      partidoperiodosRepositoryMock.find
        .mockResolvedValueOnce(setsPartido1)
        .mockResolvedValueOnce(setsPartido2);

      inscripcionesRepositoryMock.save.mockResolvedValue(undefined);

      await service.recalculateTournamentStandings(2);

      // Equipo A (local en p1): anota 75, recibe 53
      expect(inscA.puntosAnotados).toBe(75);
      expect(inscA.puntosRecibidos).toBe(53);

      // Equipo B (visitante p1 + local p2):
      // p1-visitante: anota 53, recibe 75
      // p2-local: anota 103, recibe 106
      expect(inscB.puntosAnotados).toBe(53 + 103);
      expect(inscB.puntosRecibidos).toBe(75 + 106);

      // Equipo C (visitante p2): anota 106, recibe 103
      expect(inscC.puntosAnotados).toBe(106);
      expect(inscC.puntosRecibidos).toBe(103);
    });

    it('fútbol: puntosAnotados y puntosRecibidos permanecen en 0 tras el recálculo', async () => {
      const inscLocal = makeInscripcion(5);
      const inscVisitante = makeInscripcion(6);

      torneosRepositoryMock.findOne.mockResolvedValue({
        id: 3,
        deporte: 'Fútbol',
      });
      inscripcionesRepositoryMock.find.mockResolvedValue([
        inscLocal,
        inscVisitante,
      ]);

      // Partido finalizado: local 2 - visitante 1
      partidosRepositoryMock.find.mockResolvedValue([
        {
          id: 300,
          local: 2,
          visitante: 1,
          equipoLocal: { id: 5 } as Equipo,
          equipoVisitante: { id: 6 } as Equipo,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
        } as Partido,
      ]);

      inscripcionesRepositoryMock.save.mockResolvedValue(undefined);

      await service.recalculateTournamentStandings(3);

      // Para fútbol NO se tocan estos campos
      expect(inscLocal.puntosAnotados).toBe(0);
      expect(inscLocal.puntosRecibidos).toBe(0);
      expect(inscVisitante.puntosAnotados).toBe(0);
      expect(inscVisitante.puntosRecibidos).toBe(0);

      // Pero sí se calculan los normales
      expect(inscLocal.puntosFavor).toBe(2);
      expect(inscLocal.puntosContra).toBe(1);
      expect(inscLocal.partidosGanados).toBe(1);
      expect(inscVisitante.partidosPerdidos).toBe(1);

      // No se llama a PartidoPeriodo para deportes que no son vóley
      expect(partidoperiodosRepositoryMock.find).not.toHaveBeenCalled();
    });

    it('baloncesto: puntosAnotados y puntosRecibidos permanecen en 0 tras el recálculo', async () => {
      const inscLocal = makeInscripcion(7);
      const inscVisitante = makeInscripcion(8);

      torneosRepositoryMock.findOne.mockResolvedValue({
        id: 4,
        deporte: 'Baloncesto',
      });
      inscripcionesRepositoryMock.find.mockResolvedValue([
        inscLocal,
        inscVisitante,
      ]);

      partidosRepositoryMock.find.mockResolvedValue([
        {
          id: 400,
          local: 85,
          visitante: 70,
          equipoLocal: { id: 7 } as Equipo,
          equipoVisitante: { id: 8 } as Equipo,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
        } as Partido,
      ]);

      inscripcionesRepositoryMock.save.mockResolvedValue(undefined);

      await service.recalculateTournamentStandings(4);

      expect(inscLocal.puntosAnotados).toBe(0);
      expect(inscLocal.puntosRecibidos).toBe(0);
      expect(inscVisitante.puntosAnotados).toBe(0);
      expect(inscVisitante.puntosRecibidos).toBe(0);
      expect(partidoperiodosRepositoryMock.find).not.toHaveBeenCalled();
    });
  });
});
