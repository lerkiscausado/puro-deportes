import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoInscripcion } from '../enums/estado-inscripcion.enum';

/**
 * DTO para la actualización de una inscripción.
 * Permite modificar de forma opcional las estadísticas y el estado de la inscripción.
 */
export class UpdateInscripcionDto {
  /** Cantidad de partidos jugados */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'partidosJugados debe ser un número entero' })
  partidosJugados?: number;

  /** Cantidad de partidos ganados */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'partidosGanados debe ser un número entero' })
  partidosGanados?: number;

  /** Cantidad de partidos empatados */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'partidosEmpatados debe ser un número entero' })
  partidosEmpatados?: number;

  /** Cantidad de partidos perdidos */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'partidosPerdidos debe ser un número entero' })
  partidosPerdidos?: number;

  /** Puntos a favor anotados */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'puntosFavor debe ser un número entero' })
  puntosFavor?: number;

  /** Puntos en contra recibidos */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'puntosContra debe ser un número entero' })
  puntosContra?: number;

  /** Diferencia de goles o puntos */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diferencia debe ser un número entero' })
  diferencia?: number;

  /** Puntos en la clasificación del torneo */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'puntos debe ser un número entero' })
  puntos?: number;

  /** Estado actual de la inscripción (Activo o Eliminado) */
  @IsOptional()
  @IsEnum(EstadoInscripcion, {
    message: 'El estado debe ser Activo o Eliminado',
  })
  estado?: EstadoInscripcion;
}
