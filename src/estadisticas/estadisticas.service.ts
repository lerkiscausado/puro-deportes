import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadisticaJugadorPartido } from './estadistica-jugador-partido.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { Partido } from '../partidos/partido.entity';
import { Equipo } from '../equipos/equipo.entity';
import { TipoEstadistica } from '../tipos-estadistica/tipo-estadistica.entity';
import { User } from '../users/user.entity';
import { Planilla } from '../planillas/planilla.entity';
import { RegistrarEstadisticaDto } from './dto/registrar-estadistica.dto';

/**
 * Servicio para gestión y cálculo de estadísticas de jugadores por partido y torneo.
 *
 * Modelo de datos: cada fila es un EVENTO DISCRETO (ej. cada gol, cada tiro libre).
 * Se permiten múltiples filas con la misma combinación jugador+partido+tipo.
 */
@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(EstadisticaJugadorPartido)
    private readonly estadisticaRepository: Repository<EstadisticaJugadorPartido>,
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(TipoEstadistica)
    private readonly tipoEstadisticaRepository: Repository<TipoEstadistica>,
    @InjectRepository(Planilla)
    private readonly planillaRepository: Repository<Planilla>,
  ) {}

  /**
   * Registra UN NUEVO evento estadístico discreto de un jugador en un partido.
   * Siempre crea una fila nueva — no realiza upsert.
   * Se permiten múltiples registros del mismo tipo para el mismo jugador/partido.
   *
   * @param userId - ID del usuario administrador o manager que realiza el registro
   * @param dto - Datos de la estadística (jugadorId, partidoId, equipoId, tipoEstadisticaId, cantidad)
   * @returns Registro estadístico creado (sin exponer el objeto user completo)
   */
  async registrar(
    userId: number,
    dto: RegistrarEstadisticaDto,
  ): Promise<Omit<EstadisticaJugadorPartido, 'user'>> {
    const jugador = await this.jugadorRepository.findOne({
      where: { id: dto.jugadorId },
    });
    if (!jugador) {
      throw new NotFoundException(
        `Jugador con ID ${dto.jugadorId} no encontrado`,
      );
    }

    const partido = await this.partidoRepository.findOne({
      where: { id: dto.partidoId },
    });
    if (!partido) {
      throw new NotFoundException(
        `Partido con ID ${dto.partidoId} no encontrado`,
      );
    }

    const equipo = await this.equipoRepository.findOne({
      where: { id: dto.equipoId },
    });
    if (!equipo) {
      throw new NotFoundException(
        `Equipo con ID ${dto.equipoId} no encontrado`,
      );
    }

    const tipoEstadistica = await this.tipoEstadisticaRepository.findOne({
      where: { id: dto.tipoEstadisticaId },
    });
    if (!tipoEstadistica) {
      throw new NotFoundException(
        `Tipo de estadística con ID ${dto.tipoEstadisticaId} no encontrado`,
      );
    }

    // Siempre crea una nueva fila — modelo de eventos discretos
    const estadistica = this.estadisticaRepository.create({
      jugador,
      partido,
      equipo,
      tipoEstadistica,
      user: { id: userId } as User,
      cantidad: dto.cantidad,
    });

    const guardado = await this.estadisticaRepository.save(estadistica);

    // Omitir objeto user completo para seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...resultado } = guardado;
    return resultado;
  }

  /**
   * Elimina un registro de estadística por su ID.
   *
   * @param id - ID de la estadística a eliminar
   */
  async eliminar(id: number): Promise<{ message: string }> {
    const estadistica = await this.estadisticaRepository.findOne({
      where: { id },
    });
    if (!estadistica) {
      throw new NotFoundException(`Estadística con ID ${id} no encontrada`);
    }

    await this.estadisticaRepository.remove(estadistica);
    return { message: 'Estadística eliminada correctamente' };
  }

  /**
   * Elimina el evento estadístico MÁS RECIENTE que coincida con la combinación
   * jugador + partido + tipoEstadistica. Útil para deshacer el último registro
   * capturado en tiempo real durante un partido.
   *
   * @param jugadorId - ID del jugador
   * @param partidoId - ID del partido
   * @param tipoEstadisticaId - ID del tipo de estadística
   * @returns Mensaje de confirmación
   * @throws NotFoundException si no existe ninguna fila para esa combinación
   */
  async eliminarUltimoRegistro(
    jugadorId: number,
    partidoId: number,
    tipoEstadisticaId: number,
  ): Promise<{ message: string }> {
    const ultimo = await this.estadisticaRepository.findOne({
      where: {
        jugador: { id: jugadorId },
        partido: { id: partidoId },
        tipoEstadistica: { id: tipoEstadisticaId },
      },
      order: { createdAt: 'DESC' },
    });

    if (!ultimo) {
      throw new NotFoundException(
        `No se encontró ningún registro para jugador ${jugadorId}, partido ${partidoId} y tipo ${tipoEstadisticaId}`,
      );
    }

    await this.estadisticaRepository.remove(ultimo);
    return {
      message: 'Último registro de estadística eliminado correctamente',
    };
  }

  /**
   * Retorna las estadísticas de un partido específico agrupadas por jugador,
   * incluyendo el total de puntos sumando (cantidad * tipoEstadistica.puntos)
   * y el número de camiseta obtenido desde la planilla.
   * Funciona correctamente tanto con el modelo acumulado como con el de eventos
   * discretos, ya que suma cantidad*puntos de todas las filas del jugador.
   *
   * @param partidoId - ID del partido
   * @returns Array de jugadores con sus estadísticas, total de puntos y número de camiseta
   */
  async porPartido(partidoId: number) {
    const filas = await this.estadisticaRepository.find({
      where: { partido: { id: partidoId } },
      relations: ['jugador', 'equipo', 'tipoEstadistica'],
    });

    const mapa = new Map<
      number,
      {
        jugador: { id: number; nombre: string; apellidos: string };
        equipo: { id: number; nombre: string };
        numeroCamiseta: number | null;
        estadisticas: Array<{
          tipoEstadisticaId: number;
          tipo: string;
          cantidad: number;
          puntos: number;
        }>;
        totalPuntos: number;
      }
    >();

    for (const fila of filas) {
      const jugadorId = fila.jugador.id;
      if (!mapa.has(jugadorId)) {
        mapa.set(jugadorId, {
          jugador: {
            id: fila.jugador.id,
            nombre: fila.jugador.nombre,
            apellidos: fila.jugador.apellidos,
          },
          equipo: {
            id: fila.equipo.id,
            nombre: fila.equipo.nombre,
          },
          numeroCamiseta: null,
          estadisticas: [],
          totalPuntos: 0,
        });
      }

      const entrada = mapa.get(jugadorId)!;
      const puntosTipo = fila.tipoEstadistica?.puntos ?? 0;
      entrada.estadisticas.push({
        tipoEstadisticaId: fila.tipoEstadistica?.id,
        tipo: fila.tipoEstadistica?.nombre,
        cantidad: fila.cantidad,
        puntos: puntosTipo,
      });
      entrada.totalPuntos += fila.cantidad * puntosTipo;
    }

    if (mapa.size === 0) {
      return [];
    }

    const partido = await this.partidoRepository.findOne({
      where: { id: partidoId },
      relations: ['torneo'],
    });
    const torneoId = partido?.torneo?.id;

    await Promise.all(
      Array.from(mapa.values()).map(async (entrada) => {
        const whereCondition: {
          jugador: { id: number };
          equipo: { id: number };
          torneo?: { id: number };
        } = {
          jugador: { id: entrada.jugador.id },
          equipo: { id: entrada.equipo.id },
        };
        if (torneoId) {
          whereCondition.torneo = { id: torneoId };
        }
        const planilla = await this.planillaRepository.findOne({
          where: whereCondition,
        });
        entrada.numeroCamiseta = planilla?.numeroCamiseta ?? null;
      }),
    );

    return Array.from(mapa.values());
  }

  /**
   * Retorna los líderes de un torneo ordenados DESC por total de puntos o por tipo de estadística específica.
   * Limita a los primeros 20.
   * Funciona correctamente con el modelo de eventos discretos ya que usa SUM() en SQL.
   *
   * @param torneoId - ID del torneo
   * @param tipoEstadisticaId - ID opcional de tipo de estadística para filtrar (ej. solo goles)
   * @returns Lista de los 20 mejores jugadores
   */
  async lideresPorTorneo(torneoId: number, tipoEstadisticaId?: number) {
    const qb = this.estadisticaRepository
      .createQueryBuilder('e')
      .innerJoin('e.partido', 'p')
      .innerJoin('e.jugador', 'j')
      .innerJoin('e.equipo', 'eq')
      .innerJoin('e.tipoEstadistica', 'te')
      .where('p.idTorneo = :torneoId', { torneoId })
      .select([
        'j.id AS jugadorId',
        'j.nombre AS jugadorNombre',
        'j.apellidos AS jugadorApellidos',
        'eq.id AS equipoId',
        'eq.nombre AS equipoNombre',
        'SUM(e.cantidad * te.puntos) AS totalPuntos',
        'SUM(e.cantidad) AS totalCantidad',
      ])
      .groupBy('j.id')
      .addGroupBy('j.nombre')
      .addGroupBy('j.apellidos')
      .addGroupBy('eq.id')
      .addGroupBy('eq.nombre');

    if (tipoEstadisticaId) {
      qb.andWhere('te.id = :tipoEstadisticaId', { tipoEstadisticaId });
      qb.orderBy('SUM(e.cantidad)', 'DESC');
    } else {
      qb.orderBy('SUM(e.cantidad * te.puntos)', 'DESC');
    }

    qb.limit(20);

    const filas = await qb.getRawMany();

    return filas.map((fila) => ({
      jugador: {
        id: Number(fila.jugadorId),
        nombre: fila.jugadorNombre,
        apellidos: fila.jugadorApellidos,
      },
      equipo: {
        id: Number(fila.equipoId),
        nombre: fila.equipoNombre,
      },
      totalPuntos: Number(fila.totalPuntos ?? 0),
      totalCantidad: Number(fila.totalCantidad ?? 0),
      total: tipoEstadisticaId
        ? Number(fila.totalCantidad ?? 0)
        : Number(fila.totalPuntos ?? 0),
    }));
  }

  /**
   * Retorna las estadísticas globales acumuladas de un jugador a lo largo de toda su carrera.
   * Funciona correctamente con el modelo de eventos discretos ya que acumula
   * la cantidad de todas las filas del jugador por tipo.
   *
   * @param jugadorId - ID del jugador
   * @returns Estadísticas acumuladas por tipo y total de puntos
   */
  async globalPorJugador(jugadorId: number) {
    const jugador = await this.jugadorRepository.findOne({
      where: { id: jugadorId },
    });
    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${jugadorId} no encontrado`);
    }

    const filas = await this.estadisticaRepository.find({
      where: { jugador: { id: jugadorId } },
      relations: ['tipoEstadistica'],
    });

    const mapaTipos = new Map<
      number,
      { tipo: string; cantidad: number; puntos: number }
    >();
    let totalPuntos = 0;

    for (const fila of filas) {
      const tipoId = fila.tipoEstadistica.id;
      const puntosTipo = fila.tipoEstadistica?.puntos ?? 0;

      if (!mapaTipos.has(tipoId)) {
        mapaTipos.set(tipoId, {
          tipo: fila.tipoEstadistica.nombre,
          cantidad: 0,
          puntos: puntosTipo,
        });
      }

      const entrada = mapaTipos.get(tipoId)!;
      entrada.cantidad += fila.cantidad;
      totalPuntos += fila.cantidad * puntosTipo;
    }

    return {
      jugador: {
        id: jugador.id,
        nombre: jugador.nombre,
        apellidos: jugador.apellidos,
      },
      estadisticas: Array.from(mapaTipos.values()),
      totalPuntos,
    };
  }
}
