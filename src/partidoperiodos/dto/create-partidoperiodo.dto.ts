import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsIn,
} from 'class-validator';
import { TipoPeriodo } from '../enums/tipo-periodo.enum';

export const PERIODOS_POR_DEPORTE = {
  FUTBOL: [
    'Primer Tiempo',
    'Segundo Tiempo',
    'Tiempo Extra 1',
    'Tiempo Extra 2',
    'Penales',
  ],
  BALONCESTO: [
    'Cuarto 1',
    'Cuarto 2',
    'Cuarto 3',
    'Cuarto 4',
    'Prórroga 1',
    'Prórroga 2',
  ],
  VOLEY: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'],
};

export const PERIODOS_VALIDOS = Object.values(PERIODOS_POR_DEPORTE).flat();

export class CreatePartidoPeriodoDto {
  @IsNotEmpty({ message: 'El ID del partido es obligatorio' })
  @IsInt({ message: 'El ID del partido debe ser un número entero' })
  idPartido: number;

  @IsNotEmpty({ message: 'El nombre del periodo es obligatorio' })
  @IsString({ message: 'El nombre del periodo debe ser una cadena de texto' })
  @IsIn(PERIODOS_VALIDOS, {
    message: `El nombre del periodo debe ser uno de los permitidos: ${PERIODOS_VALIDOS.join(', ')}`,
  })
  nombrePeriodo: string;

  @IsNotEmpty({ message: 'El tipo de periodo es obligatorio' })
  @IsEnum(TipoPeriodo, {
    message: 'El tipo de periodo debe ser Regular o Extra',
  })
  tipoPeriodo: TipoPeriodo;

  @IsOptional()
  @IsInt({ message: 'El score local debe ser un número entero' })
  @Min(0, { message: 'El score local no puede ser negativo' })
  scoreLocal?: number;

  @IsOptional()
  @IsInt({ message: 'El score visitante debe ser un número entero' })
  @Min(0, { message: 'El score visitante no puede ser negativo' })
  scoreVisitante?: number;
}
