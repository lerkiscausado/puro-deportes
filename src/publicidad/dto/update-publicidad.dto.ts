import { IsDateString, IsOptional, IsUrl } from 'class-validator';

/**
 * DTO para la actualización parcial de un anuncio publicitario.
 * Todos los campos son opcionales; solo se actualizan los que se envían.
 * La imagen se maneja por separado mediante @UploadedFile() en el controlador.
 */
export class UpdatePublicidadDto {
  /**
   * URL de destino del anuncio - opcional.
   * Debe incluir el protocolo (http:// o https://).
   */
  @IsOptional()
  @IsUrl({}, { message: 'El link debe ser una URL válida (debe incluir http:// o https://).' })
  link?: string;

  /** Fecha de inicio de la vigencia del anuncio (formato YYYY-MM-DD) - opcional */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).' })
  fechaInicio?: string;

  /** Fecha de fin de la vigencia del anuncio (formato YYYY-MM-DD) - opcional */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD).' })
  fechaFin?: string;
}
