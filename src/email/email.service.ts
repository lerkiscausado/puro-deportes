import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Servicio de envío de correos electrónicos mediante la plataforma Resend.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  /**
   * Envía un correo electrónico con el enlace de verificación de cuenta al usuario registrado.
   *
   * @param to - Dirección de correo de destino
   * @param name - Nombre del usuario
   * @param verificationUrl - URL completa con el token de verificación
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ): Promise<void> {
    const from =
      this.configService.get<string>('EMAIL_FROM') ||
      'Puro Deporte <noreply@purodeporte.co>';

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">Puro Deporte</h1>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">¡Hola, ${name}!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Gracias por registrarte en <strong>Puro Deporte</strong>. Para completar el registro y poder iniciar sesión en tu cuenta, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background-color: #f97316; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(249,115,22,0.3);">Verificar Correo Electrónico</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">
            <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Este enlace expira en 24 horas. Si no creaste una cuenta en Puro Deporte, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      </div>
    `;

    try {
      await this.resend.emails.send({
        from,
        to,
        subject: 'Confirma tu correo electrónico - Puro Deporte',
        html,
      });
      this.logger.log(`Correo de verificación enviado exitosamente a ${to}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar correo de verificación a ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Envía un correo electrónico con el enlace para restablecer la contraseña del usuario.
   *
   * @param to - Dirección de correo de destino
   * @param name - Nombre del usuario
   * @param resetUrl - URL completa con el token de restablecimiento de contraseña
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const from =
      this.configService.get<string>('EMAIL_FROM') ||
      'Puro Deporte <noreply@purodeporte.co>';

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">Puro Deporte</h1>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">¡Hola, ${name}!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Puro Deporte</strong>. Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #f97316; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(249,115,22,0.3);">Restablecer Contraseña</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">
            <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      </div>
    `;

    try {
      await this.resend.emails.send({
        from,
        to,
        subject: 'Restablece tu contraseña - Puro Deporte',
        html,
      });
      this.logger.log(
        `Correo de restablecimiento de contraseña enviado exitosamente a ${to}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar correo de restablecimiento de contraseña a ${to}: ${error.message}`,
        error.stack,
      );
    }
  }
}
