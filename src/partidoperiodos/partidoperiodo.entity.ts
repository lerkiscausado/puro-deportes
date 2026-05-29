import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Partido } from '../partidos/partido.entity';
import { User } from '../users/user.entity';
import { TipoPeriodo } from './enums/tipo-periodo.enum';

/**
 * Entidad PartidoPeriodo - Representa la tabla 'partidoperiodos' en la base de datos.
 * Almacena los marcadores y detalles de cada periodo (ej: primer tiempo, tiempo extra) de un partido.
 */
@Entity('partidoperiodos')
export class PartidoPeriodo {
  /** Identificador único del periodo, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Relación ManyToOne con la entidad Partido.
   * Representa el partido al que pertenece este periodo.
   */
  @ManyToOne(() => Partido, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'idPartido' })
  partido: Partido;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que registró o actualizó el periodo.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Nombre del periodo (ej: 'Primer Tiempo', 'Segundo Tiempo', 'Primer Cuarto') */
  @Column({ type: 'varchar', length: 100 })
  nombrePeriodo: string;

  /**
   * Tipo de periodo (Regular o Extra).
   */
  @Column({
    type: 'enum',
    enum: TipoPeriodo,
    default: TipoPeriodo.REGULAR,
  })
  tipoPeriodo: TipoPeriodo;

  /** Marcador del equipo local en este periodo */
  @Column({ type: 'int', default: 0 })
  scoreLocal: number;

  /** Marcador del equipo visitante en este periodo */
  @Column({ type: 'int', default: 0 })
  scoreVisitante: number;

  /** Fecha de creación del registro */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro */
  @UpdateDateColumn()
  updatedAt: Date;
}
