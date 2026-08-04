import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from './enums/role.enum';
import { Genero } from './enums/genero.enum';
import { Torneo } from '../torneos/torneo.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Partido } from '../partidos/partido.entity';

/**
 * Entidad User - Representa la tabla 'users' en la base de datos.
 * Almacena la información de registro de cada usuario de la plataforma.
 */
@Entity('users')
export class User {
  /** Identificador único del usuario, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Correo electrónico del usuario (debe ser único en la base de datos) */
  @Column({ unique: true })
  email: string;

  /** Número de teléfono del usuario */
  @Column()
  phone: string;

  /** Contraseña del usuario (almacenada con hash bcrypt) */
  @Column({ select: false })
  password: string;

  /** Nombre completo del usuario */
  @Column()
  name: string;

  /** Género del usuario (Hombre o Mujer) */
  @Column({ type: 'enum', enum: Genero, nullable: true })
  genero: Genero;

  /** Fecha de nacimiento del usuario */
  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date;

  /** Dirección del usuario */
  @Column({ nullable: true })
  direccion: string;

  /** Ruta o enlace de la foto de perfil del usuario (opcional) */
  @Column({ nullable: true })
  foto: string;

  /**
   * Rol del usuario en la plataforma.
   * Valores posibles: 'admin', 'manager', 'user'.
   * Por defecto se asigna 'user' al registrarse.
   */
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  /** Indica si el usuario ha verificado su correo electrónico */
  @Column({ default: false })
  emailVerified: boolean;

  /** Hash SHA-256 del token de verificación de correo (null si ya verificado o no generado) */
  @Column({ type: 'varchar', nullable: true })
  emailVerificationTokenHash: string | null;

  /** Fecha y hora de expiración del token de verificación (null si no aplica) */
  @Column({ type: 'datetime', nullable: true })
  emailVerificationTokenExpiresAt: Date | null;

  /** Hash SHA-256 del token de restablecimiento de contraseña (null si no solicitado o ya usado) */
  @Column({ type: 'varchar', nullable: true })
  passwordResetTokenHash: string | null;

  /** Fecha y hora de expiración del token de restablecimiento de contraseña (null si no aplica) */
  @Column({ type: 'datetime', nullable: true })
  passwordResetTokenExpiresAt: Date | null;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relación OneToMany con la entidad Torneo.
   * Un usuario puede crear/administrar múltiples torneos.
   */
  @OneToMany(() => Torneo, (torneo) => torneo.user)
  torneos: Torneo[];

  /**
   * Relación OneToMany con la entidad Escenario.
   * Un usuario puede crear/administrar múltiples escenarios.
   */
  @OneToMany(() => Escenario, (escenario) => escenario.user)
  escenarios: Escenario[];

  /**
   * Relación OneToMany con la entidad Equipo.
   * Un usuario puede crear/administrar múltiples equipos.
   */
  @OneToMany(() => Equipo, (equipo) => equipo.user)
  equipos: Equipo[];

  /**
   * Relación OneToMany con la entidad Partido.
   * Un usuario puede crear/administrar múltiples partidos.
   */
  @OneToMany(() => Partido, (partido) => partido.user)
  partidos: Partido[];
}
