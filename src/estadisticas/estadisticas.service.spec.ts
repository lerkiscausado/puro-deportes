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
      cantidad: 1,
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

    beforeEach(() => {
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);
      partidoRepoMock.findOne.mockResolvedValue(mockPartido);
      equipoRepoMock.findOne.mockResolvedValue(mockEquipo);
      tipoEstadisticaRepoMock.findOne.mockResolvedValue(mockTipo);
    });

    it('debe crear una fila nueva al registrar', async () => {
      const nuevaEntidad = {
        id: 100,
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: userId },
        cantidad: 1,
      };

      estadisticaRepoMock.create.mockReturnValue(nuevaEntidad);
      estadisticaRepoMock.save.mockResolvedValue(nuevaEntidad);

      const result = await service.registrar(userId, dto);

      expect(estadisticaRepoMock.create).toHaveBeenCalledWith({
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: userId },
        cantidad: 1,
      });
      expect(estadisticaRepoMock.save).toHaveBeenCalled();
      expect(result.id).toBe(100);
      expect((result as any).user).toBeUndefined();
    });

    it('registrar() dos veces con el mismo jugador+partido+tipo crea DOS filas separadas (modelo de eventos)', async () => {
      const fila1 = {
        id: 100,
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: userId },
        cantidad: 1,
      };
      const fila2 = {
        id: 101,
        jugador: mockJugador,
        partido: mockPartido,
        equipo: mockEquipo,
        tipoEstadistica: mockTipo,
        user: { id: userId },
        cantidad: 1,
      };

      // Primera llamada
      estadisticaRepoMock.create.mockReturnValueOnce(fila1);
      estadisticaRepoMock.save.mockResolvedValueOnce(fila1);
      const res1 = await service.registrar(userId, dto);

      // Segunda llamada — SIEMPRE crea una nueva fila, no upsert
      estadisticaRepoMock.create.mockReturnValueOnce(fila2);
      estadisticaRepoMock.save.mockResolvedValueOnce(fila2);
      const res2 = await service.registrar(userId, dto);

      expect(estadisticaRepoMock.create).toHaveBeenCalledTimes(2);
      expect(estadisticaRepoMock.save).toHaveBeenCalledTimes(2);
      expect(res1.id).toBe(100);
      expect(res2.id).toBe(101);
      // Son filas distintas
      expect(res1.id).not.toBe(res2.id);
    });

    it('con jugador inexistente lanza NotFoundException', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(null);
      await expect(service.registrar(userId, dto)).rejects.toThrow(NotFoundException);
      expect(estadisticaRepoMock.create).not.toHaveBeenCalled();
    });

    it('con partido inexistente lanza NotFoundException', async () => {
      partidoRepoMock.findOne.mockResolvedValue(null);
      await expect(service.registrar(userId, dto)).rejects.toThrow(NotFoundException);
      expect(estadisticaRepoMock.create).not.toHaveBeenCalled();
    });

    it('con equipo inexistente lanza NotFoundException', async () => {
      equipoRepoMock.findOne.mockResolvedValue(null);
      await expect(service.registrar(userId, dto)).rejects.toThrow(NotFoundException);
      expect(estadisticaRepoMock.create).not.toHaveBeenCalled();
    });

    it('con tipoEstadistica inexistente lanza NotFoundException', async () => {
      tipoEstadisticaRepoMock.findOne.mockResolvedValue(null);
      await expect(service.registrar(userId, dto)).rejects.toThrow(NotFoundException);
      expect(estadisticaRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('debe eliminar una estadística existente por ID', async () => {
      const mockEst = { id: 10 } as EstadisticaJugadorPartido;
      estadisticaRepoMock.findOne.mockResolvedValue(mockEst);
      estadisticaRepoMock.remove.mockResolvedValue(mockEst);

      const result = await service.eliminar(10);
      expect(estadisticaRepoMock.remove).toHaveBeenCalledWith(mockEst);
      expect(result).toEqual({ message: 'Estadística eliminada correctamente' });
    });

    it('debe lanzar NotFoundException si no existe el ID', async () => {
      estadisticaRepoMock.findOne.mockResolvedValue(null);
      await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('eliminarUltimoRegistro', () => {
    it('elimina la fila más reciente cuando hay varias para la misma combinación', async () => {
      const ultimaFila = {
        id: 202,
        jugador: { id: 1 },
        partido: { id: 2 },
        tipoEstadistica: { id: 4 },
        createdAt: new Date('2026-08-15T05:00:00Z'),
      } as unknown as EstadisticaJugadorPartido;

      estadisticaRepoMock.findOne.mockResolvedValue(ultimaFila);
      estadisticaRepoMock.remove.mockResolvedValue(ultimaFila);

      const result = await service.eliminarUltimoRegistro(1, 2, 4);

      expect(estadisticaRepoMock.findOne).toHaveBeenCalledWith({
        where: {
          jugador: { id: 1 },
          partido: { id: 2 },
          tipoEstadistica: { id: 4 },
        },
        order: { createdAt: 'DESC' },
      });
      expect(estadisticaRepoMock.remove).toHaveBeenCalledWith(ultimaFila);
      expect(result).toEqual({
        message: 'Último registro de estadística eliminado correctamente',
      });
    });

    it('lanza NotFoundException si no hay ninguna fila para esa combinación', async () => {
      estadisticaRepoMock.findOne.mockResolvedValue(null);

      await expect(service.eliminarUltimoRegistro(1, 2, 99)).rejects.toThrow(
        NotFoundException,
      );
      expect(estadisticaRepoMock.remove).not.toHaveBeenCalled();
    });
  });

  describe('porPartido', () => {
    it('calcula correctamente el total de puntos sumando cantidad*puntos (modelo eventos: múltiples filas del mismo tipo)', async () => {
      // Dos eventos de Triple (2 filas separadas de cantidad=1) + 1 evento de Doble
      const filas = [
        {
          id: 1,
          jugador: { id: 1, nombre: 'Carlos', apellidos: 'Alcaraz' },
          equipo: { id: 10, nombre: 'Equipo A' },
          tipoEstadistica: { id: 1, nombre: 'Triple', puntos: 3 },
          cantidad: 1, // fila discreta
        },
        {
          id: 2,
          jugador: { id: 1, nombre: 'Carlos', apellidos: 'Alcaraz' },
          equipo: { id: 10, nombre: 'Equipo A' },
          tipoEstadistica: { id: 1, nombre: 'Triple', puntos: 3 },
          cantidad: 1, // segunda fila discreta mismo tipo
        },
        {
          id: 3,
          jugador: { id: 1, nombre: 'Carlos', apellidos: 'Alcaraz' },
          equipo: { id: 10, nombre: 'Equipo A' },
          tipoEstadistica: { id: 2, nombre: 'Doble', puntos: 2 },
          cantidad: 1,
        },
      ];

      estadisticaRepoMock.find.mockResolvedValue(filas);

      const resultado = await service.porPartido(5);

      expect(resultado).toHaveLength(1);
      const jugador1 = resultado[0];
      // 1*3 + 1*3 + 1*2 = 8
      expect(jugador1.totalPuntos).toBe(8);
      expect(jugador1.estadisticas).toHaveLength(3); // 3 filas discretas
      expect(jugador1.estadisticas).toEqual([
        { tipoEstadisticaId: 1, tipo: 'Triple', cantidad: 1, puntos: 3 },
        { tipoEstadisticaId: 1, tipo: 'Triple', cantidad: 1, puntos: 3 },
        { tipoEstadisticaId: 2, tipo: 'Doble', cantidad: 1, puntos: 2 },
      ]);
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

      expect(qbMock.where).toHaveBeenCalledWith('p.idTorneo = :torneoId', { torneoId: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('SUM(e.cantidad * te.puntos)', 'DESC');
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

      expect(qbMock.andWhere).toHaveBeenCalledWith('te.id = :tipoEstadisticaId', { tipoEstadisticaId: 3 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('SUM(e.cantidad)', 'DESC');
      expect(res[0].total).toBe(15);
    });
  });

  describe('globalPorJugador', () => {
    it('acumula correctamente múltiples filas del mismo tipo (modelo de eventos)', async () => {
      const mockJugador = { id: 7, nombre: 'Kylian', apellidos: 'Mbappé' } as Jugador;
      jugadorRepoMock.findOne.mockResolvedValue(mockJugador);

      // 3 filas discretas de 'Gol' (en vez de 1 fila con cantidad=3)
      const filas = [
        { id: 1, tipoEstadistica: { id: 1, nombre: 'Gol', puntos: 1 }, cantidad: 1 },
        { id: 2, tipoEstadistica: { id: 1, nombre: 'Gol', puntos: 1 }, cantidad: 1 },
        { id: 3, tipoEstadistica: { id: 1, nombre: 'Gol', puntos: 1 }, cantidad: 1 },
        { id: 4, tipoEstadistica: { id: 2, nombre: 'Asistencia', puntos: 1 }, cantidad: 1 },
      ];

      estadisticaRepoMock.find.mockResolvedValue(filas);

      const res = await service.globalPorJugador(7);

      expect(res.jugador.nombre).toBe('Kylian');
      // 3 goles*1 + 1 asistencia*1 = 4
      expect(res.totalPuntos).toBe(4);
      expect(res.estadisticas).toEqual([
        { tipo: 'Gol', cantidad: 3, puntos: 1 },
        { tipo: 'Asistencia', cantidad: 1, puntos: 1 },
      ]);
    });

    it('lanza NotFoundException si el jugador no existe', async () => {
      jugadorRepoMock.findOne.mockResolvedValue(null);
      await expect(service.globalPorJugador(999)).rejects.toThrow(NotFoundException);
    });
  });
});
