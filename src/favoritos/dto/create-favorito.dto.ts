import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para agregar un torneo a la lista de favoritos del usuario autenticado.
 */
export class CreateFavoritoDto {
  /** ID del torneo a marcar como favorito */
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  torneoId: number;
}
