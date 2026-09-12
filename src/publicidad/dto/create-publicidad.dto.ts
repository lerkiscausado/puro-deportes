import { IsDateString, IsUrl } from 'class-validator';

/**
 * DTO para la creación de un anuncio publicitario.
 * La imagen se maneja por separado mediante @UploadedFile() en el controlador.
 */
export class CreatePublicidadDto {
  /**
   * URL de destino del anuncio.
   * Debe incluir el protocolo (http:// o https://).
   */
  @IsUrl({}, { message: 'El link debe ser una URL válida (debe incluir http:// o https://).' })
  link: string;

  /** Fecha de inicio de la vigencia del anuncio (formato YYYY-MM-DD) */
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).' })
  fechaInicio: string;

  /** Fecha de fin de la vigencia del anuncio (formato YYYY-MM-DD) */
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD).' })
  fechaFin: string;
}
