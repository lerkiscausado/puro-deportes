import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para la creación de una nueva inscripción.
 * Valida los datos requeridos que se envían en el body del request.
 */
export class CreateInscripcionDto {
  /** ID del torneo al cual se inscribe el equipo */
  @Type(() => Number)
  @IsInt({ message: 'El ID del torneo debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del torneo es requerido.' })
  idTorneo: number;

  /** ID del equipo que se va a inscribir */
  @Type(() => Number)
  @IsInt({ message: 'El ID del equipo debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del equipo es requerido.' })
  idEquipo: number;
}
