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
 * DTO para la creación de un nuevo jugador.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body del request.
 */
export class CreateJugadorDto {
  /** Nombre del jugador - no puede estar vacío */
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  nombre: string;

  /** Apellidos del jugador - no puede estar vacío */
  @IsString()
  @IsNotEmpty({
    message: 'Los apellidos son obligatorios y no pueden estar vacíos.',
  })
  apellidos: string;

  /** Género del jugador - debe ser Hombre o Mujer */
  @IsEnum(Genero, {
    message: 'El género debe ser uno de los siguientes: Hombre o Mujer.',
  })
  genero: Genero;

  /** Fecha de nacimiento en formato ISO (YYYY-MM-DD) */
  @IsDateString(
    {},
    {
      message: 'La fecha de nacimiento debe estar en formato ISO (YYYY-MM-DD).',
    },
  )
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria.' })
  fechaNacimiento: string;

  /** Estatura del jugador (número, ejemplo: 1.80 o 180) */
  @IsNumber({}, { message: 'La estatura debe ser un valor numérico.' })
  @IsNotEmpty({ message: 'La estatura es obligatoria.' })
  estatura: number;

  /** Identificación del jugador (cédula, pasaporte, etc.) */
  @IsString()
  @IsNotEmpty({
    message: 'La identificación es obligatoria y no puede estar vacía.',
  })
  identificacion: string;

  /** Estado del jugador - opcional, por defecto 'Activo' */
  @IsOptional()
  @IsEnum(EstadoJugador, {
    message: 'El estado debe ser uno de los siguientes: Activo o Suspendido.',
  })
  estado?: EstadoJugador;
}
