import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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

  /** Número de teléfono - formato válido internacional o colombiano */
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  phone: string;

  /** Contraseña - mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial */
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[a-z])/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  @Matches(/(?=.*\d)/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  })
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

  /**
   * Tipo de usuario visible al público.
   * - 'organizador' → role MANAGER (puede crear/editar/eliminar recursos)
   * - 'seguidor'    → role USER    (solo lectura)
   * Si no se envía, se aplica role USER por defecto.
   * Este campo NUNCA se persiste directamente en la base de datos.
   */
  @IsOptional()
  @IsIn(['organizador', 'seguidor'], {
    message: 'El tipo de usuario debe ser "organizador" o "seguidor".',
  })
  tipoUsuario?: 'organizador' | 'seguidor';
}
