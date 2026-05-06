import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Key utilizada para almacenar los roles requeridos en los metadatos de la ruta.
 * Es usada internamente por el RolesGuard para leer qué roles son permitidos.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador personalizado @Roles().
 * Se usa en los endpoints del controlador para definir qué roles
 * tienen acceso a una ruta específica.
 *
 * Ejemplo de uso:
 *   @Roles(Role.ADMIN, Role.MANAGER)
 *   @Get('dashboard')
 *   getDashboard() { ... }
 *
 * @param roles - Lista de roles que tienen permiso de acceso
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
