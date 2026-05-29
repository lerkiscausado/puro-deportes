import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Genero } from '../../users/enums/genero.enum';
import { EstadoJugador } from '../enums/estado-jugador.enum';

/**
 * DTO para la actualización de un jugador existente.
 * Todos los campos son opcionales y solo se modifican los que se envían.
 */
export class UpdateJugadorDto {
  /** Nombre del jugador - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío si se envía.' })
  nombre?: string;

  /** Apellidos del jugador - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos no pueden estar vacíos si se envían.' })
  apellidos?: string;

  /** Género del jugador - opcional */
  @IsOptional()
  @IsEnum(Genero, {
    message: 'El género debe ser uno de los siguientes: Hombre o Mujer.',
  })
  genero?: Genero;

  /** Fecha de nacimiento en formato ISO (YYYY-MM-DD) - opcional */
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha de nacimiento debe estar en formato ISO (YYYY-MM-DD).',
    },
  )
  fechaNacimiento?: string;

  /** Estatura del jugador - opcional */
  @IsOptional()
  @IsNumber({}, { message: 'La estatura debe ser un valor numérico.' })
  estatura?: number;

  /** Identificación del jugador - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({
    message: 'La identificación no puede estar vacía si se envía.',
  })
  identificacion?: string;

  /** Estado del jugador - opcional */
  @IsOptional()
  @IsEnum(EstadoJugador, {
    message: 'El estado debe ser uno de los siguientes: Activo o Suspendido.',
  })
  estado?: EstadoJugador;
}
