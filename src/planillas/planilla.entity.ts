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
import { Jugador } from '../jugadores/jugador.entity';
import { EstadoPlanilla } from './enums/estado-planilla.enum';

/**
 * Entidad Planilla - Representa la tabla 'planillas' en la base de datos.
 * Registra a un jugador en una planilla (roster) para un torneo y equipo específicos,
 * incluyendo el número de camiseta y el estado del registro.
 */
@Entity('planillas')
export class Planilla {
  /** Identificador único de la planilla, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que registró esta planilla.
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /**
   * Relación ManyToOne con la entidad Torneo.
   * Representa el torneo correspondiente.
   */
  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idTorneo' })
  torneo: Torneo;

  /**
   * Relación ManyToOne con la entidad Equipo.
   * Representa el equipo en el que jugará el jugador.
   */
  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEquipo' })
  equipo: Equipo;

  /**
   * Relación ManyToOne con la entidad Jugador.
   * Representa al jugador registrado.
   */
  @ManyToOne(() => Jugador, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idJugador' })
  jugador: Jugador;

  /** Número de la camiseta del jugador */
  @Column({ type: 'int' })
  numeroCamiseta: number;

  /**
   * Estado de la planilla.
   * Valores posibles: 'Activo', 'Suspendido'.
   * Por defecto es 'Activo'.
   */
  @Column({
    type: 'enum',
    enum: EstadoPlanilla,
    default: EstadoPlanilla.ACTIVO,
  })
  estado: EstadoPlanilla;

  /** Fecha de creación de la planilla (generada automáticamente) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización de la planilla (actualizada automáticamente) */
  @UpdateDateColumn()
  updatedAt: Date;
}
