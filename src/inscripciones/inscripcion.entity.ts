import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { EstadoInscripcion } from './enums/estado-inscripcion.enum';

/**
 * Entidad Inscripcion - Representa la tabla 'inscripciones' en la base de datos.
 * Registra la participación de un equipo en un torneo, y lleva el control
 * de las estadísticas de dicho equipo en el torneo.
 */
@Entity('inscripciones')
export class Inscripcion {
  /** Identificador único de la inscripción, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que realizó la inscripción.
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /**
   * Relación ManyToOne con la entidad Torneo.
   * Representa el torneo al cual se inscribe el equipo.
   */
  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idTorneo' })
  torneo: Torneo;

  /**
   * Relación ManyToOne con la entidad Equipo.
   * Representa al equipo inscrito en el torneo.
   */
  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEquipo' })
  equipo: Equipo;

  /** Cantidad de partidos jugados (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  partidosJugados: number;

  /** Cantidad de partidos ganados (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  partidosGanados: number;

  /** Cantidad de partidos empatados (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  partidosEmpatados: number;

  /** Cantidad de partidos perdidos (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  partidosPerdidos: number;

  /** Puntos a favor acumulados (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  puntosFavor: number;

  /** Puntos en contra acumulados (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  puntosContra: number;

  /** Diferencia de goles o puntos (puntosFavor - puntosContra) (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  diferencia: number;

  /** Puntos totales de la clasificación (por defecto 0) */
  @Column({ type: 'int', default: 0 })
  puntos: number;

  /**
   * Estado de la inscripción.
   * Valores posibles: 'Activo', 'Eliminado'.
   * Por defecto es 'Activo'.
   */
  @Column({
    type: 'enum',
    enum: EstadoInscripcion,
    default: EstadoInscripcion.ACTIVO,
  })
  estado: EstadoInscripcion;

  /** Fecha de creación de la inscripción (generada automáticamente) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización de la inscripción (actualizada automáticamente) */
  @UpdateDateColumn()
  updatedAt: Date;
}
