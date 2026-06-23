import { SetMetadata } from '@nestjs/common';

/**
 * Key utilizada para identificar si una ruta es pública.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador personalizado @Public().
 * Permite omitir la verificación de autenticación JWT y roles en rutas específicas.
 *
 * Ejemplo de uso:
 *   @Public()
 *   @Get('public-data')
 *   getPublicData() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
