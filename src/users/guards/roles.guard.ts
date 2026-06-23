import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard de autorización por roles.
 * Verifica que el usuario autenticado tenga uno de los roles
 * requeridos para acceder a la ruta.
 *
 * Debe usarse en conjunto con JwtAuthGuard (primero autenticar, luego autorizar).
 *
 * Proceso:
 * 1. Lee los roles requeridos desde los metadatos del endpoint (definidos con @Roles()).
 * 2. Si no hay roles definidos, permite el acceso (ruta sin restricción de rol).
 * 3. Extrae el rol del usuario desde el payload JWT adjuntado al request.
 * 4. Verifica si el rol del usuario está incluido en los roles permitidos.
 * 5. Si no tiene permiso, lanza excepción 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Lee los roles requeridos definidos con el decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se definieron roles, la ruta es accesible para cualquier usuario autenticado
    if (!requiredRoles) {
      return true;
    }

    // Obtiene el usuario del request (adjuntado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verifica si el rol del usuario está en la lista de roles permitidos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }

    return true;
  }
}
