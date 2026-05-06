import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from './enums/role.enum';
import { Torneo } from '../torneos/torneo.entity';

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
  @Column()
  password: string;

  /** Nombre completo del usuario */
  @Column()
  name: string;

  /**
   * Rol del usuario en la plataforma.
   * Valores posibles: 'admin', 'manager', 'user'.
   * Por defecto se asigna 'user' al registrarse.
   */
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

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
}
