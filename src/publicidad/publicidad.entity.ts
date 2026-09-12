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

/**
 * Entidad Publicidad - Representa la tabla 'publicidad' en la base de datos.
 * Almacena la información de los anuncios publicitarios con imágenes y fechas de vigencia.
 * Tiene una relación ManyToOne con la entidad User (el administrador que la creó).
 */
@Entity('publicidad')
export class Publicidad {
  /** Identificador único del anuncio, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del archivo de imagen almacenado en el servidor */
  @Column({ type: 'varchar' })
  imagen: string;

  /** URL de destino del anuncio (incluyendo http:// o https://) */
  @Column({ type: 'varchar', length: 500 })
  link: string;

  /** Fecha de inicio de vigencia del anuncio (YYYY-MM-DD) */
  @Column({ type: 'date' })
  fechaInicio: string;

  /** Fecha de fin de vigencia del anuncio (YYYY-MM-DD) */
  @Column({ type: 'date' })
  fechaFin: string;

  /**
   * Relación ManyToOne con la entidad User.
   * Representa al administrador que creó el anuncio.
   * Si el usuario se elimina, el anuncio se elimina en cascada.
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
