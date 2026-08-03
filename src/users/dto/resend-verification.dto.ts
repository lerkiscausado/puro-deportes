import { IsEmail } from 'class-validator';

/**
 * DTO para solicitar el reenvío del correo de verificación.
 */
export class ResendVerificationDto {
  /** Correo electrónico registrado */
  @IsEmail()
  email: string;
}
