import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guard de autenticación JWT.
 * Protege las rutas que requieren que el usuario esté autenticado.
 *
 * Proceso:
 * 1. Extrae el token del header Authorization (formato: "Bearer <token>").
 * 2. Verifica y decodifica el token usando JwtService.
 * 3. Si es válido, adjunta el payload del token al objeto request.
 * 4. Si no es válido o no existe, lanza excepción 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extrae el token del header Authorization
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    try {
      // Verifica y decodifica el token JWT
      const payload = await this.jwtService.verifyAsync(token);

      // Adjunta el payload al request para que esté disponible en el controlador
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException(
        'Token de autenticación inválido o expirado',
      );
    }

    return true;
  }

  /**
   * Extrae el token Bearer del header Authorization.
   *
   * @param request - Objeto request de Express
   * @returns El token JWT o undefined si no existe o el formato es incorrecto
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
