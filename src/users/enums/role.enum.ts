/**
 * Enum de roles disponibles en la plataforma.
 * Define los niveles de acceso que un usuario puede tener.
 *
 * - ADMIN: Acceso total al sistema (gestión de usuarios, configuración, etc.)
 * - MANAGER: Acceso a gestión de contenido y operaciones (torneos, equipos, etc.)
 * - USER: Acceso básico como usuario registrado de la plataforma
 */
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}
