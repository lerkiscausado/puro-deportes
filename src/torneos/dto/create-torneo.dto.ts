import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Deporte } from '../enums/deporte.enum';
import { Rama } from '../enums/rama.enum';
import { EstadoTorneo } from '../enums/estado-torneo.enum';

/**
 * DTO para la creación de un nuevo torneo.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body del request.
 *
 * Nota: Los campos 'foto' y 'reglamento' se manejan como archivos
 * subidos vía multipart/form-data y no se incluyen en el DTO.
 */
export class CreateTorneoDto {
  /** Nombre del torneo - no puede estar vacío */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Fecha de inicio del torneo en formato ISO (YYYY-MM-DD) */
  @IsDateString()
  fechaInicio: string;

  /** Fecha de finalización del torneo en formato ISO (YYYY-MM-DD) */
  @IsDateString()
  fechaFin: string;

  /** Tipo de deporte - debe ser uno de los valores del enum Deporte */
  @IsEnum(Deporte, {
    message: 'El deporte debe ser: Baloncesto, Voleibol, Futbol, Microfutbol o Golito',
  })
  deporte: Deporte;

  /** Rama del torneo - debe ser uno de los valores del enum Rama */
  @IsEnum(Rama, {
    message: 'La rama debe ser: Masculino, Femenino o Mixto',
  })
  rama: Rama;

  /** Estado del torneo - debe ser uno de los valores del enum EstadoTorneo (opcional, por defecto: Inscripciones) */
  @IsEnum(EstadoTorneo, {
    message: 'El estado debe ser: Inscripciones, En Juego, Finalizado o Suspendido',
  })
  estado?: EstadoTorneo;
}
