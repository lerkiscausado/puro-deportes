import { IsInt, Min } from 'class-validator';

/**
 * DTO para registrar o actualizar estadísticas de un jugador en un partido.
 */
export class RegistrarEstadisticaDto {
  /** ID del jugador */
  @IsInt()
  jugadorId: number;

  /** ID del partido */
  @IsInt()
  partidoId: number;

  /** ID del equipo */
  @IsInt()
  equipoId: number;

  /** ID del tipo de estadística (catálogo) */
  @IsInt()
  tipoEstadisticaId: number;

  /** Cantidad de eventos/estadística a registrar (mínimo 1) */
  @IsInt()
  @Min(1)
  cantidad: number;
}
