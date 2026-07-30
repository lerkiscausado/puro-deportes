import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * Guard de rate limiting personalizado.
 * Extiende ThrottlerGuard para devolver un mensaje de error en español
 * cuando se supera el límite de peticiones configurado.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Demasiados intentos, por favor espera un momento antes de volver a intentarlo.',
    );
  }
}
