import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeporteNoticia } from '../enums/deporte-noticia.enum';

/**
 * DTO para la creación de una noticia.
 * Valida los datos recibidos al registrar una noticia.
 */
export class CreateNoticiaDto {
  /** Título de la noticia - obligatorio */
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio y no puede estar vacío.' })
  titulo: string;

  /** Subtítulo de la noticia - obligatorio */
  @IsString()
  @IsNotEmpty({ message: 'El subtítulo es obligatorio y no puede estar vacío.' })
  subtitulo: string;

  /** Descripción o contenido de la noticia - obligatorio */
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria y no puede estar vacía.' })
  descripcion: string;

  /** Deporte al que pertenece la noticia - obligatorio */
  @IsEnum(DeporteNoticia, {
    message: 'El deporte debe ser uno de los siguientes: Futbol, Baloncesto o Voleibol.',
  })
  deporte: DeporteNoticia;
}
