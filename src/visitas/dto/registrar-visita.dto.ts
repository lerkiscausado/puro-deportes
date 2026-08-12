import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO para registrar una visita a una página pública.
 */
export class RegistrarVisitaDto {
  /**
   * Ruta de la página visitada.
   * Ejemplo: "/torneos", "/noticias/5"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ruta: string;
}
