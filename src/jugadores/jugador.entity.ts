import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Genero } from '../users/enums/genero.enum';
import { EstadoJugador } from './enums/estado-jugador.enum';

/**
 * Entidad Jugador - Representa la tabla 'jugadores' en la base de datos.
 * Almacena los datos personales y físicos de los jugadores registrados en la plataforma.
 */
@Entity('jugadores')
export class Jugador {
  /** Identificador único del jugador, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del jugador */
  @Column()
  nombre: string;

  /** Apellidos del jugador */
  @Column()
  apellidos: string;

  /**
   * Género del jugador.
   * Valores posibles: Hombre, Mujer.
   */
  @Column({ type: 'enum', enum: Genero })
  genero: Genero;

  /** Fecha de nacimiento del jugador */
  @Column({ type: 'date' })
  fechaNacimiento: string;

  /** Estatura del jugador (en metros, ejemplo: 1.82, o centímetros si se prefiere) */
  @Column({ type: 'float' })
  estatura: number;

  /** Identificación del jugador (cédula, pasaporte, etc.) */
  @Column({ unique: true })
  identificacion: string;

  /**
   * Estado del jugador.
   * Valores posibles: Activo, Suspendido.
   * Por defecto se crea en estado 'Activo'.
   */
  @Column({
    type: 'enum',
    enum: EstadoJugador,
    default: EstadoJugador.ACTIVO,
  })
  estado: EstadoJugador;

  /** Fecha de creación del registro (generada automáticamente por TypeORM) */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro (actualizada automáticamente por TypeORM) */
  @UpdateDateColumn()
  updatedAt: Date;
}
