import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Genero } from '../enums/genero.enum';

/**
 * DTO para la creación de un nuevo usuario.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body del request en el endpoint de registro.
 */
export class CreateUserDto {
  /** Correo electrónico - debe tener formato válido de email */
  @IsEmail()
  email: string;

  /** Número de teléfono - no puede estar vacío */
  @IsString()
  @IsNotEmpty()
  phone: string;

  /** Contraseña - debe tener mínimo 6 caracteres */
  @IsString()
  @MinLength(6)
  password: string;

  /** Nombre completo del usuario - no puede estar vacío */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Género - valores permitidos: Hombre, Mujer (opcional) */
  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero;

  /** Fecha de nacimiento en formato ISO (ej: 1990-05-15) (opcional) */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  /** Dirección del usuario (opcional) */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  direccion?: string;
}
