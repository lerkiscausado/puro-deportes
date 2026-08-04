import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO para restablecer la contraseña usando un token recibido por correo.
 */
export class ResetPasswordDto {
  /** Token de restablecimiento enviado por correo electrónico */
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  /** Nueva contraseña - mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial */
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
}
