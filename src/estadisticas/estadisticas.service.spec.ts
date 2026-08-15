import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticaJugadorPartido } from './estadistica-jugador-partido.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { Partido } from '../partidos/partido.entity';
import { Equipo } from '../equipos/equipo.entity';
import { TipoEstadistica } from '../tipos-estadistica/tipo-estadistica.entity';
import { Deporte } from '../torneos/enums/deporte.enum';

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let estadisticaRepoMock: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let jugadorRepoMock: { findOne: jest.Mock };
  let partidoRepoMock: { findOne: jest.Mock };
  let equipoRepoMock: { findOne: jest.Mock };
  let tipoEstadisticaRepoMock: { findOne: jest.Mock };

  beforeEach(async () => {
    estadisticaRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    jugadorRepoMock = { findOne: jest.fn() };
    partidoRepoMock = { findOne: jest.fn() };
    equipoRepoMock = { findOne: jest.fn() };
    tipoEstadisticaRepoMock = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasService,
        {
          provide: getRepositoryToken(EstadisticaJugadorPartido),
          useValue: estadisticaRepoMock,
        },
        {
          provide: getRepositoryToken(Jugador),
          useValue: jugadorRepoMock,
        },
        {
          provide: getRepositoryToken(Partido),
          useValue: partidoRepoMock,
        },
        {
          provide: getRepositoryToken(Equipo),
          useValue: equipoRepoMock,
        },
        {
          provide: getRepositoryToken(TipoEstadistica),
          useValue: tipoEstadisticaRepoMock,
        },
      ],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('registrar', () => {
    const userId = 10;
    const dto = {
      jugadorId: 1,
      partidoId: 2,
      equipoId: 3,
      tipoEstadisticaId: 4,
      cantidad: 3,
    };
    const mockJugador = { id: 1, nombre: 'Lionel', apellidos: 'Messi' } as Jugador;
    const mockPartido = { id: 2 } as Partido;
    const mockEquipo = { id: 3, nombre: 'Inter Miami' } as Equipo;
    const mockTipo = {
      id: 4,
      nombre: 'Gol',
      deporte: Deporte.FUTBOL,
      puntos: 1,
    } as TipoEstadistica;

    it('debe crear una fila nueva si no existe previamente', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(mockPartido);
      equipoRepoMock.findOne.mockResolvedValue(mockEquipo);
      tipoEstadisticaRepoMock.findOne.mockResolvedValue(mockTipo);

      // No existe previamente
      estadisticaRepoMock.findOne.mockResolvedValue(null);

      const nuevaEntidad = {
        id: 100,
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: userId },
        cantidad: 3,
      };

      estadisticaRepoMock.create.mockReturnValue(nuevaEntidad);
      estadisticaRepoMock.save.mockResolvedValue(nuevaEntidad);

      const result = await service.registrar(userId, dto);

      expect(jugadorRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(estadisticaRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jugador: mockJugador,
          partido: mockPartido,
          equipo: mockEquipo,
          tipoEstadistica: mockTipo,
          cantidad: 3,
        }),
      );
      expect(estadisticaRepoMock.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 100);
      expect(result).toHaveProperty('cantidad', 3);
      expect((result as any).user).toBeUndefined();
    });

    it('con la misma combinación jugador+partido+tipo ACTUALIZA en vez de duplicar', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(mockPartido);
      equipoRepoMock.findOne.mockResolvedValue(mockEquipo);
      tipoEstadisticaRepoMock.findOne.mockResolvedValue(mockTipo);

      const filaExistente = {
        id: 50,
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: 1 },
        cantidad: 1,
      };

      estadisticaRepoMock.findOne.mockResolvedValue(filaExistente);
      estadisticaRepoMock.save.mockImplementation((ent) => Promise.resolve(ent));

      const result = await service.registrar(userId, dto);

      expect(estadisticaRepoMock.create).not.toHaveBeenCalled();
      expect(filaExistente.cantidad).toBe(3);
      expect(filaExistente.user).toEqual({ id: userId });
      expect(result.id).toBe(50);
      expect(result.cantidad).toBe(3);
      expect((result as any).user).toBeUndefined();
    });

    it('con jugador inexistente lanza NotFoundException', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(null);

      await expect(service.registrar(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(partidoRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('con partido inexistente lanza NotFoundException', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(null);

      await expect(service.registrar(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(equipoRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('con equipo inexistente lanza NotFoundException', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(mockPartido);
      equipoRepoMock.findOne.mockResolvedValue(null);

      await expect(service.registrar(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(tipoEstadisticaRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('con tipoEstadistica inexistente lanza NotFoundException', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(mockPartido);
      equipoRepoMock.findOne.mockResolvedValue(mockEquipo);
      tipoEstadisticaRepoMock.findOne.mockResolvedValue(null);

      await expect(service.registrar(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('eliminar', () => {
    it('debe eliminar una estadística existente', async () => {
      const mockEst = { id: 10 } as EstadisticaJugadorPartido;
      estadisticaRepoMock.findOne.mockResolvedValue(mockEst);
      estadisticaRepoMock.remove.mockResolvedValue(mockEst);

      const result = await service.eliminar(10);
      expect(estadisticaRepoMock.remove).toHaveBeenCalledWith(mockEst);
      expect(result).toEqual({
        message: 'Estadística eliminada correctamente',
      });
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      estadisticaRepoMock.findOne.mockResolvedValue(null);
      await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('porPartido', () => {
    it('calcula correctamente el total de puntos sumando cantidad*puntos', async () => {
      const filas = [
        {
          id: 1,
          jugador: { id: 1, nombre: 'Carlos', apellidos: 'Alcaraz' },
          equipo: { id: 10, nombre: 'Equipo A' },
          tipoEstadistica: { id: 1, nombre: 'Triple', puntos: 3 },
          cantidad: 2, // 2 * 3 = 6
        },
        {
          id: 2,
          jugador: { id: 1, nombre: 'Carlos', apellidos: 'Alcaraz' },
          equipo: { id: 10, nombre: 'Equipo A' },
          tipoEstadistica: { id: 2, nombre: 'Doble', puntos: 2 },
          cantidad: 3, // 3 * 2 = 6
        },
        {
          id: 3,
          jugador: { id: 2, nombre: 'Rafael', apellidos: 'Nadal' },
          equipo: { id: 20, nombre: 'Equipo B' },
          tipoEstadistica: { id: 1, nombre: 'Triple', puntos: 3 },
          cantidad: 1, // 1 * 3 = 3
        },
      ];

      estadisticaRepoMock.find.mockResolvedValue(filas);

      const resultado = await service.porPartido(5);

      expect(resultado).toHaveLength(2);

      const jugador1 = resultado.find((r) => r.jugador.id === 1);
      expect(jugador1).toBeDefined();
      expect(jugador1?.totalPuntos).toBe(12); // 6 + 6
      expect(jugador1?.estadisticas).toEqual([
        { tipo: 'Triple', cantidad: 2, puntos: 3 },
        { tipo: 'Doble', cantidad: 3, puntos: 2 },
      ]);

      const jugador2 = resultado.find((r) => r.jugador.id === 2);
      expect(jugador2).toBeDefined();
      expect(jugador2?.totalPuntos).toBe(3);
    });
  });

  describe('lideresPorTorneo', () => {
    it('ordena correctamente por total descendente y limita a 20', async () => {
      const mockRawMany = [
        {
          jugadorId: '1',
          jugadorNombre: 'Leo',
          jugadorApellidos: 'Messi',
          equipoId: '10',
          equipoNombre: 'Miami',
          totalPuntos: '25',
          totalCantidad: '10',
        },
        {
          jugadorId: '2',
          jugadorNombre: 'Cristiano',
          jugadorApellidos: 'Ronaldo',
          equipoId: '20',
          equipoNombre: 'Nassr',
          totalPuntos: '18',
          totalCantidad: '8',
        },
      ];

      const qbMock: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawMany),
      };

      estadisticaRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const res = await service.lideresPorTorneo(1);

      expect(qbMock.where).toHaveBeenCalledWith('p.idTorneo = :torneoId', {
        torneoId: 1,
      });
      expect(qbMock.orderBy).toHaveBeenCalledWith(
        'SUM(e.cantidad * te.puntos)',
        'DESC',
      );
      expect(qbMock.limit).toHaveBeenCalledWith(20);
      expect(res).toHaveLength(2);
      expect(res[0].jugador.nombre).toBe('Leo');
      expect(res[0].totalPuntos).toBe(25);
      expect(res[1].jugador.nombre).toBe('Cristiano');
      expect(res[1].totalPuntos).toBe(18);
    });

    it('filtra por tipoEstadisticaId cuando se provee', async () => {
      const mockRawMany = [
        {
          jugadorId: '1',
          jugadorNombre: 'Erling',
          jugadorApellidos: 'Haaland',
          equipoId: '5',
          equipoNombre: 'City',
          totalPuntos: '15',
          totalCantidad: '15',
        },
      ];

      const qbMock: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawMany),
      };

      estadisticaRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const res = await service.lideresPorTorneo(1, 3);

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'te.id = :tipoEstadisticaId',
        { tipoEstadisticaId: 3 },
      );
      expect(qbMock.orderBy).toHaveBeenCalledWith('SUM(e.cantidad)', 'DESC');
      expect(res[0].total).toBe(15);
    });
  });

  describe('globalPorJugador', () => {
    it('retorna las estadísticas acumuladas históricas del jugador', async () => {
      const mockJugador = {
        id: 7,
        nombre: 'Kylian',
        apellidos: 'Mbappé',
      } as Jugador;
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);

      const filas = [
        {
          id: 1,
          tipoEstadistica: { id: 1, nombre: 'Gol', puntos: 1 },
          cantidad: 5,
        },
        {
          id: 2,
          tipoEstadistica: { id: 1, nombre: 'Gol', puntos: 1 },
          cantidad: 3,
        },
        {
          id: 3,
          tipoEstadistica: { id: 2, nombre: 'Asistencia', puntos: 1 },
          cantidad: 4,
        },
      ];

      estadisticaRepoMock.find.mockResolvedValue(filas);

      const res = await service.globalPorJugador(7);

      expect(res.jugador.nombre).toBe('Kylian');
      expect(res.totalPuntos).toBe(12); // (5+3)*1 + 4*1
      expect(res.estadisticas).toEqual([
        { tipo: 'Gol', cantidad: 8, puntos: 1 },
        { tipo: 'Asistencia', cantidad: 4, puntos: 1 },
      ]);
    });

    it('lanza NotFoundException si el jugador no existe', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(null);
      await expect(service.globalPorJugador(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
