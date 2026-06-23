import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeporteNoticia } from './enums/deporte-noticia.enum';

/**
 * Entidad Noticia - Representa la tabla 'noticias' en la base de datos.
 * Almacena información sobre noticias publicadas.
 */
@Entity('noticias')
export class Noticia {
  /** Identificador único de la noticia, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Título de la noticia */
  @Column()
  titulo: string;

  /** Subtítulo de la noticia */
  @Column()
  subtitulo: string;

  /** Descripción o cuerpo de la noticia */
  @Column({ type: 'text' })
  descripcion: string;

  /** Foto asociada a la noticia - opcional (nombre del archivo en el servidor) */
  @Column({ type: 'varchar', nullable: true })
  foto: string | null;

  /** Deporte al que pertenece la noticia */
  @Column({
    type: 'enum',
    enum: DeporteNoticia,
  })
  deporte: DeporteNoticia;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
