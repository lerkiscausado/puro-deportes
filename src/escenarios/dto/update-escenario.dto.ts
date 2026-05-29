import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeporteEscenario } from '../enums/deporte.enum';
import { EstadoEscenario } from '../enums/estado.enum';

/**
 * DTO para la actualización de un escenario existente.
 * Todos los campos son opcionales y solo se modifican los que se envían.
 */
export class UpdateEscenarioDto {
  /** Nombre del escenario - opcional, no puede estar vacío si se envía */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  nombre?: string;

  /** Dirección física del escenario - opcional, no puede estar vacía si se envía */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La dirección no puede estar vacía.' })
  direccion?: string;

  /** Barrio o sector del escenario - opcional */
  @IsOptional()
  @IsString()
  barrioSector?: string;

  /** Enlace de ubicación o coordenadas - opcional */
  @IsOptional()
  @IsString()
  ubicacion?: string;

  /** Tipo de deporte - opcional, debe ser un valor válido */
  @IsOptional()
  @IsEnum(DeporteEscenario, {
    message:
      'El deporte debe ser uno de los siguientes: Multiuso, Futbol, Baloncesto, Voleibol.',
  })
  deporte?: DeporteEscenario;

  /** Estado del escenario - opcional, debe ser un valor válido */
  @IsOptional()
  @IsEnum(EstadoEscenario, {
    message:
      'El estado debe ser uno de los siguientes: Disponible, No Disponible.',
  })
  estado?: EstadoEscenario;
}
