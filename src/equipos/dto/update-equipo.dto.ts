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
 * DTO para la actualización de un equipo existente.
 * Todos los campos son opcionales y solo se modifican los que se envían.
 */
export class UpdateEquipoDto {
  /** Nombre del equipo - opcional, no puede estar vacío si se envía */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  nombre?: string;

  /** Representante del equipo - opcional, no puede estar vacío si se envía */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El representante no puede estar vacío.' })
  representante?: string;

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

  /** Tipo de deporte - opcional, debe ser un valor válido */
  @IsOptional()
  @IsEnum(DeporteEquipo, {
    message:
      'El deporte debe ser uno de los siguientes: Futbol, Baloncesto, Voleibol.',
  })
  deporte?: DeporteEquipo;

  /** Ruta de la foto del equipo - opcional */
  @IsOptional()
  @IsString()
  foto?: string;

  /** Estado del equipo - opcional, debe ser un valor válido */
  @IsOptional()
  @IsEnum(EstadoEquipo, {
    message: 'El estado debe ser uno de los siguientes: Activo, Suspendido.',
  })
  estado?: EstadoEquipo;
}
