import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Genero } from '../enums/genero.enum';

/**
 * DTO para la actualización del perfil del usuario.
 * Todos los campos son opcionales: solo se actualizan los que se envíen.
 * No permite modificar email ni role por seguridad.
 */
export class UpdateProfileDto {
  /** Número de teléfono */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  /** Nombre completo del usuario */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /** Género - valores permitidos: Hombre, Mujer */
  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero;

  /** Fecha de nacimiento en formato ISO (ej: 1990-05-15) */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  /** Dirección del usuario */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  direccion?: string;

  /** Nueva contraseña (mínimo 6 caracteres) */
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
