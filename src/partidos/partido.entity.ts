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
import { EstadoPartido } from './enums/estado-partido.enum';
import { TipoJuego } from './enums/tipo-juego.enum';
import { Escenario } from '../escenarios/escenario.entity';

/**
 * Entidad Partido - Representa la tabla 'partidos' en la base de datos.
 * Almacena los encuentros o partidos programados de los torneos.
 */
@Entity('partidos')
export class Partido {
  /** Identificador único del partido, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Fecha en que se jugará el partido (ej: '2026-05-21') */
  @Column({ type: 'date' })
  fecha: string;

  /** Hora en que se jugará el partido (ej: '14:30:00') */
  @Column({ type: 'time' })
  hora: string;

  /** Marcador del equipo local (goles o puntos anotados) */
  @Column({ type: 'int', nullable: true })
  local: number;

  /** Marcador del equipo visitante (goles o puntos anotados) */
  @Column({ type: 'int', nullable: true })
  visitante: number;

  /** Descripción o detalles adicionales sobre el partido (ej: cancha, clima, notas) */
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  /**
   * Estado actual del partido.
   * Valores posibles: Programado, Finalizado, Cancelado, Suspendido.
   * Por defecto se crea en estado 'Programado'.
   */
  @Column({
    type: 'enum',
    enum: EstadoPartido,
    default: EstadoPartido.PROGRAMADO,
  })
  estado: EstadoPartido;

  /**
   * Tipo de juego del partido.
   * Valores posibles: OFICIAL, AMISTOSO, LIGUILLA.
   * Por defecto se crea como 'OFICIAL'.
   */
  @Column({
    type: 'enum',
    enum: TipoJuego,
    default: TipoJuego.OFICIAL,
  })
  tipoJuego: TipoJuego;

  /**
   * Relación ManyToOne con la entidad Torneo.
   * Representa el torneo al cual pertenece este partido.
   */
  @ManyToOne(() => Torneo, (torneo) => torneo.partidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idTorneo' })
  torneo: Torneo;

  /**
   * Relación ManyToOne con la entidad Equipo (Local).
   * Representa al equipo que juega de local.
   */
  @ManyToOne(() => Equipo, (equipo) => equipo.partidosLocal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idEquipoLocal' })
  equipoLocal: Equipo;

  /**
   * Relación ManyToOne con la entidad Equipo (Visitante).
   * Representa al equipo que juega de visitante.
   */
  @ManyToOne(() => Equipo, (equipo) => equipo.partidosVisitante, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idEquipoVisitante' })
  equipoVisitante: Equipo;

  /**
   * Relación ManyToOne con la entidad Escenario.
   * Representa el escenario donde se jugará el partido.
   * eager: true carga automáticamente los datos del escenario al consultar el partido.
   */
  @ManyToOne(() => Escenario, {
    nullable: true,
    onDelete: 'SET NULL',
    //eager: true,
  })
  @JoinColumn({ name: 'idEscenario' })
  escenario: Escenario | null;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que creó o administra el partido.
   */
  @ManyToOne(() => User, (user) => user.partidos)
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
