import { IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { EstadoPlanilla } from '../enums/estado-planilla.enum';

/**
 * DTO para el registro de un jugador en la planilla.
 * Define y valida las reglas del cuerpo del request.
 */
export class CreatePlanillaDto {
  @IsNotEmpty({ message: 'El idTorneo es requerido' })
  @IsNumber({}, { message: 'El idTorneo debe ser un número' })
  idTorneo: number;

  @IsNotEmpty({ message: 'El idEquipo es requerido' })
  @IsNumber({}, { message: 'El idEquipo debe ser un número' })
  idEquipo: number;

  @IsNotEmpty({ message: 'El idJugador es requerido' })
  @IsNumber({}, { message: 'El idJugador debe ser un número' })
  idJugador: number;

  @IsNotEmpty({ message: 'El número de camiseta es requerido' })
  @IsNumber({}, { message: 'El número de camiseta debe ser un número' })
  @Min(0, { message: 'El número de camiseta debe ser un valor no negativo' })
  numeroCamiseta: number;

  @IsOptional()
  @IsEnum(EstadoPlanilla, { message: 'El estado debe ser Activo o Suspendido' })
  estado?: EstadoPlanilla;
}
