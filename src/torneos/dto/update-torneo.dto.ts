import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { EstadoTorneo } from '../enums/estado-torneo.enum';

/**
 * DTO para la actualización de un torneo existente.
 * Permite modificar únicamente el nombre y el estado del torneo.
 */
export class UpdateTorneoDto {
  /** Nombre del torneo - opcional, no puede estar vacío si se envía */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  /** Estado actual del torneo - opcional, debe ser un valor válido del enum EstadoTorneo */
  @IsEnum(EstadoTorneo, {
    message:
      'El estado debe ser uno de los siguientes: Inscripciones, En Juego, Finalizado o Suspendido',
  })
  @IsOptional()
  estado?: EstadoTorneo;
}
