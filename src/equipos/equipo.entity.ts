import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { DeporteEquipo } from './enums/deporte.enum';
import { EstadoEquipo } from './enums/estado.enum';
import { Partido } from '../partidos/partido.entity';

/**
 * Entidad Equipo - Representa la tabla 'equipos' en la base de datos.
 * Almacena la información de los equipos deportivos registrados.
 * Tiene una relación ManyToOne con la entidad User (el usuario administrador o creador).
 */
@Entity('equipos')
export class Equipo {
  /** Identificador único del equipo, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del equipo */
  @Column()
  nombre: string;

  /** Representante o delegado del equipo */
  @Column()
  representante: string;

  /** Teléfono de contacto del equipo */
  @Column({ nullable: true })
  telefono: string;

  /** Correo electrónico de contacto del equipo */
  @Column({ nullable: true })
  correo: string;

  /**
   * Tipo de deporte del equipo.
   * Valores posibles: Futbol, Baloncesto, Voleibol.
   */
  @Column({ type: 'enum', enum: DeporteEquipo })
  deporte: DeporteEquipo;

  /** Ruta o enlace de la foto del equipo - opcional */
  @Column({ nullable: true })
  foto: string;

  /**
   * Estado actual del equipo.
   * Valores posibles: Activo, Suspendido.
   * Por defecto se crea en estado 'Activo'.
   */
  @Column({
    type: 'enum',
    enum: EstadoEquipo,
    default: EstadoEquipo.ACTIVO,
  })
  estado: EstadoEquipo;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que administra/creó el equipo.
   */
  @ManyToOne(() => User, (user) => user.equipos)
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relación OneToMany con la entidad Partido (como local).
   */
  @OneToMany(() => Partido, (partido) => partido.equipoLocal)
  partidosLocal: Partido[];

  /**
   * Relación OneToMany con la entidad Partido (como visitante).
   */
  @OneToMany(() => Partido, (partido) => partido.equipoVisitante)
  partidosVisitante: Partido[];
}
