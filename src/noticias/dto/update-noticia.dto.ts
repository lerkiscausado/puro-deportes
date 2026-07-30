import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeporteNoticia } from '../enums/deporte-noticia.enum';

/**
 * DTO para la actualización de una noticia existente.
 * Todos los campos son opcionales y solo se modifican los que se envían.
 */
export class UpdateNoticiaDto {
  /** Título de la noticia - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío si se envía.' })
  titulo?: string;

  /** Subtítulo de la noticia - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El subtítulo no puede estar vacío si se envía.' })
  subtitulo?: string;

  /** Descripción de la noticia - opcional */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La descripción no puede estar vacía si se envía.' })
  descripcion?: string;

  /** Deporte de la noticia - opcional */
  @IsOptional()
  @IsEnum(DeporteNoticia, {
    message:
      'El deporte debe ser uno de los siguientes: Futbol, Baloncesto o Voleibol.',
  })
  deporte?: DeporteNoticia;
}
