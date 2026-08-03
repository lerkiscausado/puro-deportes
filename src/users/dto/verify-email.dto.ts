import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para verificar el correo electrónico con un token.
 */
export class VerifyEmailDto {
  /** Token de verificación recibido por correo electrónico */
  @IsString()
  @IsNotEmpty()
  token: string;
}
