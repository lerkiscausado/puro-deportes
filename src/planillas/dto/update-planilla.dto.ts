import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { EstadoPlanilla } from '../enums/estado-planilla.enum';

/**
 * DTO para la actualización de un registro de planilla.
 * Todos los campos son opcionales y solo se modifican los que se envían.
 */
export class UpdatePlanillaDto {
  @IsOptional()
  @IsNumber({}, { message: 'El idTorneo debe ser un número' })
  idTorneo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El idEquipo debe ser un número' })
  idEquipo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El idJugador debe ser un número' })
  idJugador?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El número de camiseta debe ser un número' })
  @Min(0, { message: 'El número de camiseta debe ser un valor no negativo' })
  numeroCamiseta?: number;

  @IsOptional()
  @IsEnum(EstadoPlanilla, { message: 'El estado debe ser Activo o Suspendido' })
  estado?: EstadoPlanilla;
}
