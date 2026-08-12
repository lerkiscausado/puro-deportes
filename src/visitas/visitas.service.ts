import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visita } from './visita.entity';
import { TipoDispositivo } from './enums/tipo-dispositivo.enum';

/**
 * Resultado de una ruta en el ranking de más visitadas.
 */
export interface RutaVisitada {
  ruta: string;
  cantidad: number;
}

/**
 * Estructura retornada por obtenerEstadisticas().
 */
export interface EstadisticasVisitas {
  totalVisitas: number;
  visitasHoy: number;
  visitasUltimos7Dias: number;
  visitasUltimos30Dias: number;
  rutasMasVisitadas: RutaVisitada[];
  dispositivos: {
    movil: number;
    escritorio: number;
  };
}

/**
 * Servicio de visitas.
 * Proporciona dos operaciones:
 *  - registrar(): inserta una fila nueva por cada carga de página pública.
 *  - obtenerEstadisticas(): agrega contadores e histograma de rutas para admins.
 */
@Injectable()
export class VisitasService {
  constructor(
    /** Repositorio de visitas */
    @InjectRepository(Visita)
    private readonly visitasRepository: Repository<Visita>,
  ) {}

  /**
   * Detecta si el User-Agent recibido corresponde a un dispositivo móvil o de escritorio.
   *
   * @param userAgent - Header User-Agent de la petición HTTP
   * @returns TipoDispositivo (MOVIL o ESCRITORIO)
   */
  private detectarDispositivo(userAgent?: string): TipoDispositivo {
    if (!userAgent) {
      return TipoDispositivo.ESCRITORIO;
    }
    const regexMovil = /Mobile|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry/i;
    return regexMovil.test(userAgent)
      ? TipoDispositivo.MOVIL
      : TipoDispositivo.ESCRITORIO;
  }

  /**
   * Registra una nueva visita para la ruta indicada.
   * La operación es fire-and-forget desde el punto de vista del cliente:
   * el controlador no espera el resultado para responder.
   *
   * @param ruta - Ruta pública visitada (ej: "/torneos")
   * @param userAgent - Header User-Agent opcional para detectar dispositivo
   */
  async registrar(ruta: string, userAgent?: string): Promise<void> {
    const dispositivo = this.detectarDispositivo(userAgent);
    const visita = this.visitasRepository.create({ ruta, dispositivo });
    await this.visitasRepository.save(visita);
  }

  /**
   * Retorna estadísticas agregadas de visitas para uso exclusivo de administradores.
   *
   * Incluye:
   * - totalVisitas: total histórico de visitas.
   * - visitasHoy: visitas desde el inicio del día local del servidor.
   * - visitasUltimos7Dias: visitas de los últimos 7 días.
   * - visitasUltimos30Dias: visitas de los últimos 30 días.
   * - rutasMasVisitadas: top 10 rutas por cantidad de visitas en los últimos 30 días.
   * - dispositivos: conteo de visitas por tipo (móvil vs escritorio) en los últimos 30 días.
   */
  async obtenerEstadisticas(): Promise<EstadisticasVisitas> {
    const ahora = new Date();

    // Inicio del día actual (00:00:00.000)
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);

    // Hace 7 días
    const hace7Dias = new Date(ahora);
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    // Hace 30 días
    const hace30Dias = new Date(ahora);
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    // ── Contadores ────────────────────────────────────────────────────────────

    const [totalVisitas, visitasHoy, visitasUltimos7Dias, visitasUltimos30Dias] =
      await Promise.all([
        // Total histórico
        this.visitasRepository
          .createQueryBuilder('v')
          .select('COUNT(*)', 'total')
          .getRawOne<{ total: string }>()
          .then((r) => parseInt(r?.total ?? '0', 10)),

        // Hoy
        this.visitasRepository
          .createQueryBuilder('v')
          .select('COUNT(*)', 'total')
          .where('v.createdAt >= :fecha', { fecha: inicioHoy })
          .getRawOne<{ total: string }>()
          .then((r) => parseInt(r?.total ?? '0', 10)),

        // Últimos 7 días
        this.visitasRepository
          .createQueryBuilder('v')
          .select('COUNT(*)', 'total')
          .where('v.createdAt >= :fecha', { fecha: hace7Dias })
          .getRawOne<{ total: string }>()
          .then((r) => parseInt(r?.total ?? '0', 10)),

        // Últimos 30 días
        this.visitasRepository
          .createQueryBuilder('v')
          .select('COUNT(*)', 'total')
          .where('v.createdAt >= :fecha', { fecha: hace30Dias })
          .getRawOne<{ total: string }>()
          .then((r) => parseInt(r?.total ?? '0', 10)),
      ]);

    // ── Top 10 rutas más visitadas (últimos 30 días) ──────────────────────────

    const rutasRaw = await this.visitasRepository
      .createQueryBuilder('v')
      .select('v.ruta', 'ruta')
      .addSelect('COUNT(*)', 'cantidad')
      .where('v.createdAt >= :fecha', { fecha: hace30Dias })
      .groupBy('v.ruta')
      .orderBy('cantidad', 'DESC')
      .limit(10)
      .getRawMany<{ ruta: string; cantidad: string }>();

    const rutasMasVisitadas: RutaVisitada[] = rutasRaw.map((row) => ({
      ruta: row.ruta,
      cantidad: parseInt(row.cantidad, 10),
    }));

    // ── Conteo por dispositivo (últimos 30 días) ──────────────────────────────

    const dispositivosRaw = await this.visitasRepository
      .createQueryBuilder('v')
      .select('v.dispositivo', 'dispositivo')
      .addSelect('COUNT(*)', 'cantidad')
      .where('v.createdAt >= :fecha', { fecha: hace30Dias })
      .groupBy('v.dispositivo')
      .getRawMany<{ dispositivo: string; cantidad: string }>();

    const dispositivos = {
      movil: 0,
      escritorio: 0,
    };

    for (const row of dispositivosRaw) {
      const cantidad = parseInt(row.cantidad, 10);
      if (row.dispositivo === TipoDispositivo.MOVIL) {
        dispositivos.movil = cantidad;
      } else if (row.dispositivo === TipoDispositivo.ESCRITORIO) {
        dispositivos.escritorio = cantidad;
      }
    }

    return {
      totalVisitas,
      visitasHoy,
      visitasUltimos7Dias,
      visitasUltimos30Dias,
      rutasMasVisitadas,
      dispositivos,
    };
  }
}
