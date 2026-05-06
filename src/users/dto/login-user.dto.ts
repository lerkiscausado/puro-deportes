import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO para el inicio de sesión.
 * Valida que el email tenga formato correcto y que la contraseña
 * cumpla con la longitud mínima antes de procesar el login.
 */
export class LoginUserDto {
  /** Correo electrónico - debe tener formato válido de email */
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  /** Contraseña - debe tener mínimo 6 caracteres */
  @IsString()
  @MinLength(6)
  password: string;
}
