import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { TipoPeriodo } from '../enums/tipo-periodo.enum';
import { PERIODOS_VALIDOS } from './create-partidoperiodo.dto';

export class UpdatePartidoPeriodoDto {
  @IsOptional()
  @IsInt({ message: 'El ID del partido debe ser un número entero' })
  idPartido?: number;

  @IsOptional()
  @IsString({ message: 'El nombre del periodo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del periodo no puede estar vacío' })
  @IsIn(PERIODOS_VALIDOS, {
    message: `El nombre del periodo debe ser uno de los permitidos: ${PERIODOS_VALIDOS.join(', ')}`,
  })
  nombrePeriodo?: string;

  @IsOptional()
  @IsEnum(TipoPeriodo, {
    message: 'El tipo de periodo debe ser Regular o Extra',
  })
  tipoPeriodo?: TipoPeriodo;

  @IsOptional()
  @IsInt({ message: 'El score local debe ser un número entero' })
  @Min(0, { message: 'El score local no puede ser negativo' })
  scoreLocal?: number;

  @IsOptional()
  @IsInt({ message: 'El score visitante debe ser un número entero' })
  @Min(0, { message: 'El score visitante no puede ser negativo' })
  scoreVisitante?: number;
}
