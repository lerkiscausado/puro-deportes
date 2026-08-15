import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Deporte } from '../torneos/enums/deporte.enum';

/**
 * Entidad TipoEstadistica - Representa la tabla 'tipos_estadistica' en la base de datos.
 * Almacena el catálogo de tipos de estadísticas disponibles por deporte.
 */
@Entity('tipos_estadistica')
export class TipoEstadistica {
  /** Identificador único del tipo de estadística */
  @PrimaryGeneratedColumn()
  id: number;

  /** Deporte al que pertenece la estadística */
  @Column({
    type: 'enum',
    enum: Deporte,
  })
  deporte: Deporte;

  /** Nombre de la estadística (ej: 'Gol', 'Asistencia', 'Triple', 'Falta') */
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  /** Puntos asignados a esta estadística (default 0) */
  @Column({ type: 'int', default: 0 })
  puntos: number;

  /** Fecha de creación del registro */
  @CreateDateColumn()
  createdAt: Date;
}
