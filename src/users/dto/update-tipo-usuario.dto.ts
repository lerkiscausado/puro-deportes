import { IsIn } from 'class-validator';

/**
 * DTO para actualizar el tipo de usuario (rol público) de un usuario autenticado.
 * Mapea el valor público al rol interno:
 *   - 'organizador' → Role.MANAGER
 *   - 'seguidor'    → Role.USER
 */
export class UpdateTipoUsuarioDto {
  @IsIn(['organizador', 'seguidor'], {
    message: 'El tipo de usuario debe ser "organizador" o "seguidor".',
  })
  tipoUsuario: 'organizador' | 'seguidor';
}
