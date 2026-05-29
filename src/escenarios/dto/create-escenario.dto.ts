import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeporteEscenario } from '../enums/deporte.enum';
import { EstadoEscenario } from '../enums/estado.enum';

/**
 * DTO para la creación de un nuevo escenario.
 * Define las validaciones que se aplican automáticamente
 * al recibir el body de la petición HTTP.
 */
export class CreateEscenarioDto {
  /** Nombre del escenario - no puede estar vacío */
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  nombre: string;

  /** Dirección física del escenario - no puede estar vacía */
  @IsString()
  @IsNotEmpty({
    message: 'La dirección es obligatoria y no puede estar vacía.',
  })
  direccion: string;

  /** Barrio o sector del escenario - opcional */
  @IsOptional()
  @IsString()
  barrioSector?: string;

  /** Enlace de ubicación o coordenadas - opcional */
  @IsOptional()
  @IsString()
  ubicacion?: string;

  /** Tipo de deporte - debe ser uno de los valores del enum DeporteEscenario */
  @IsEnum(DeporteEscenario, {
    message:
      'El deporte debe ser uno de los siguientes: Multiuso, Futbol, Baloncesto, Voleibol.',
  })
  deporte: DeporteEscenario;

  /** Estado del escenario - opcional, por defecto se asigna 'Disponible' */
  @IsOptional()
  @IsEnum(EstadoEscenario, {
    message:
      'El estado debe ser uno de los siguientes: Disponible, No Disponible.',
  })
  estado?: EstadoEscenario;
}
