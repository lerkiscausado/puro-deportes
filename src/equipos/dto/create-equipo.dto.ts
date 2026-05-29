import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DeporteEquipo } from '../enums/deporte.enum';
import { EstadoEquipo } from '../enums/estado.enum';

/**
 * DTO para la creación de un nuevo equipo.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body de la petición HTTP.
 */
export class CreateEquipoDto {
  /** Nombre del equipo - no puede estar vacío */
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  nombre: string;

  /** Representante del equipo - no puede estar vacío */
  @IsString()
  @IsNotEmpty({
    message: 'El representante es obligatorio y no puede estar vacío.',
  })
  representante: string;

  /** Teléfono de contacto del equipo - opcional */
  @IsOptional()
  @IsString()
  telefono?: string;

  /** Correo electrónico de contacto del equipo - opcional */
  @IsOptional()
  @IsEmail(
    {},
    { message: 'El correo electrónico debe tener un formato válido.' },
  )
  correo?: string;

  /** Tipo de deporte - debe ser uno de los valores del enum DeporteEquipo */
  @IsEnum(DeporteEquipo, {
    message:
      'El deporte debe ser uno de los siguientes: Futbol, Baloncesto, Voleibol.',
  })
  deporte: DeporteEquipo;

  /** Ruta de la foto del equipo - opcional */
  @IsOptional()
  @IsString()
  foto?: string;

  /** Estado del equipo - opcional, por defecto se asigna 'Activo' */
  @IsOptional()
  @IsEnum(EstadoEquipo, {
    message: 'El estado debe ser uno de los siguientes: Activo, Suspendido.',
  })
  estado?: EstadoEquipo;
}
