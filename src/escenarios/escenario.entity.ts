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
import { DeporteEscenario } from './enums/deporte.enum';
import { EstadoEscenario } from './enums/estado.enum';

/**
 * Entidad Escenario - Representa la tabla 'escenarios' en la base de datos.
 * Almacena los espacios o escenarios deportivos disponibles para eventos o reservas.
 * Tiene una relación ManyToOne con la entidad User (el usuario administrador creador).
 */
@Entity('escenarios')
export class Escenario {
  /** Identificador único del escenario, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del escenario deportivo */
  @Column()
  nombre: string;

  /** Dirección física del escenario */
  @Column()
  direccion: string;

  /** Barrio o sector del escenario */
  @Column({ nullable: true })
  barrioSector: string;

  /** Enlace de ubicación o coordenadas en mapa */
  @Column({ nullable: true })
  ubicacion: string;

  /**
   * Tipo de deporte del escenario.
   * Valores posibles: Multiuso, Futbol, Baloncesto, Voleibol.
   */
  @Column({ type: 'enum', enum: DeporteEscenario })
  deporte: DeporteEscenario;

  /**
   * Estado actual de disponibilidad del escenario.
   * Valores posibles: Disponible, No Disponible.
   * Por defecto se crea en estado 'Disponible'.
   */
  @Column({
    type: 'enum',
    enum: EstadoEscenario,
    default: EstadoEscenario.DISPONIBLE,
  })
  estado: EstadoEscenario;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al usuario que administra/creó el escenario.
   */
  @ManyToOne(() => User, (user) => user.escenarios)
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
