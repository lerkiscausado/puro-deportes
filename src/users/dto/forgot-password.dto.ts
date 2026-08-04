import { IsEmail } from 'class-validator';

/**
 * DTO para solicitar el restablecimiento de contraseña.
 * Recibe la dirección de correo electrónico del usuario.
 */
export class ForgotPasswordDto {
  /** Correo electrónico registrado en la plataforma */
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;
}
