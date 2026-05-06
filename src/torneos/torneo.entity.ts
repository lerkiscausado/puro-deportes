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
import { Deporte } from './enums/deporte.enum';
import { Rama } from './enums/rama.enum';
import { EstadoTorneo } from './enums/estado-torneo.enum';

/**
 * Entidad Torneo - Representa la tabla 'torneos' en la base de datos.
 * Almacena la información de cada torneo deportivo de la plataforma.
 * Tiene una relación ManyToOne con la entidad User (el creador del torneo).
 */
@Entity('torneos')
export class Torneo {
  /** Identificador único del torneo, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del torneo */
  @Column()
  name: string;

  /** Fecha de inicio del torneo */
  @Column({ type: 'date' })
  fechaInicio: string;

  /** Fecha de finalización del torneo */
  @Column({ type: 'date' })
  fechaFin: string;

  /**
   * Tipo de deporte del torneo.
   * Valores posibles: Baloncesto, Voleibol, Futbol, Microfutbol, Golito.
   */
  @Column({ type: 'enum', enum: Deporte })
  deporte: Deporte;

  /**
   * Rama o categoría de género del torneo.
   * Valores posibles: Masculino, Femenino, Mixto.
   */
  @Column({ type: 'enum', enum: Rama })
  rama: Rama;

  /** Ruta de la foto/imagen del torneo (almacenada en el servidor) */
  @Column({ nullable: true })
  foto: string;

  /** Ruta del archivo PDF con el reglamento del torneo */
  @Column({ nullable: true })
  reglamento: string;

  /**
   * Estado actual del torneo.
   * Valores posibles: Inscripciones, En Juego, Finalizado, Suspendido.
   * Por defecto se crea en estado 'Inscripciones'.
   */
  @Column({ type: 'enum', enum: EstadoTorneo, default: EstadoTorneo.INSCRIPCIONES })
  estado: EstadoTorneo;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que creó/administra el torneo.
   * eager: true carga automáticamente los datos del usuario al consultar el torneo.
   */
  @ManyToOne(() => User, (user) => user.torneos, { eager: true })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
