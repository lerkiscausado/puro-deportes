import { join } from 'path';
import * as fs from 'fs';

/**
 * Devuelve la ruta absoluta al subdirectorio de uploads correspondiente,
 * garantizando que el directorio exista en el sistema de archivos (creándolo
 * de forma recursiva si aún no ha sido creado).
 *
 * En desarrollo local usa `./uploads` (relativo al cwd) como fallback.
 * En producción (Docker) debe configurarse UPLOADS_PATH con la ruta interna
 * del volumen montado (ej: /app/uploads), de modo que los archivos persistan
 * fuera del filesystem efímero del contenedor.
 *
 * @param subdir - Subdirectorio dentro de uploads (ej: 'logos', 'torneos', 'noticias', 'equipos')
 * @returns Ruta absoluta al subdirectorio (ej: /app/uploads/logos)
 */
export function getUploadsPath(subdir: string): string {
  const base = process.env.UPLOADS_PATH ?? join(process.cwd(), 'uploads');
  const fullPath = join(base, subdir);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
}
