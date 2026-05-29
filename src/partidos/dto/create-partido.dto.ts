import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { EstadoPartido } from '../enums/estado-partido.enum';
import { TipoJuego } from '../enums/tipo-juego.enum';

/**
 * DTO para la creación de un nuevo partido.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body de la petición HTTP.
 */
export class CreatePartidoDto {
  /** Fecha del partido (ej: '2026-05-21') */
  @IsDateString(
    {},
    { message: 'La fecha debe estar en formato ISO (YYYY-MM-DD) válido.' },
  )
  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  fecha: string;

  /** Hora del partido (ej: '14:30:00') */
  @IsNotEmpty({ message: 'La hora es obligatoria.' })
  @IsString({ message: 'La hora debe ser una cadena de texto válida.' })
  hora: string;

  /** ID del torneo al que pertenece el partido */
  @IsInt({ message: 'El ID del torneo debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del torneo es obligatorio.' })
  idTorneo: number;

  /** ID del equipo local */
  @IsInt({ message: 'El ID del equipo local debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del equipo local es obligatorio.' })
  idEquipoLocal: number;

  /** ID del equipo visitante */
  @IsInt({ message: 'El ID del equipo visitante debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del equipo visitante es obligatorio.' })
  idEquipoVisitante: number;

  /** Marcador/goles del equipo local - opcional */
  @IsOptional()
  @IsInt({ message: 'El marcador local debe ser un número entero.' })
  local?: number;

  /** Marcador/goles del equipo visitante - opcional */
  @IsOptional()
  @IsInt({ message: 'El marcador visitante debe ser un número entero.' })
  visitante?: number;

  /** Descripción o detalles adicionales sobre el partido - opcional */
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto válida.' })
  descripcion?: string;

  /** Estado actual del partido - opcional, por defecto 'Programado' */
  @IsOptional()
  @IsEnum(EstadoPartido, {
    message:
      'El estado debe ser uno de los siguientes: Programado, Finalizado, Cancelado, Suspendido.',
  })
  estado?: EstadoPartido;

  /** Tipo de juego del partido - opcional, por defecto 'OFICIAL' */
  @IsOptional()
  @IsEnum(TipoJuego, {
    message:
      'El tipo de juego debe ser uno de los siguientes: OFICIAL, AMISTOSO, LIGUILLA.',
  })
  tipoJuego?: TipoJuego;

  /** ID del escenario deportivo donde se jugará el partido - opcional */
  @IsOptional()
  @IsInt({ message: 'El ID del escenario debe ser un número entero.' })
  idEscenario?: number;
}
