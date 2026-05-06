import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}
