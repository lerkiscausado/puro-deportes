import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Jugador } from '../jugadores/jugador.entity';
import { Partido } from '../partidos/partido.entity';
import { Equipo } from '../equipos/equipo.entity';
import { TipoEstadistica } from '../tipos-estadistica/tipo-estadistica.entity';
import { User } from '../users/user.entity';

/**
 * Entidad EstadisticaJugadorPartido - Representa la tabla 'estadisticas_jugador_partido' en la BD.
 * Cada fila representa un evento/acción discreta (ej. cada tiro libre, cada gol) de un jugador en un partido.
 * Se permiten múltiples filas con la misma combinación jugador+partido+tipo (modelo de eventos, no acumulado).
 */
@Entity('estadisticas_jugador_partido')
export class EstadisticaJugadorPartido {
  /** Identificador único del registro estadístico */
  @PrimaryGeneratedColumn()
  id: number;

  /** Jugador al que se le atribuye la estadística */
  @ManyToOne(() => Jugador, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idJugador' })
  jugador: Jugador;

  /** Partido en el que ocurrió la estadística */
  @ManyToOne(() => Partido, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idPartido' })
  partido: Partido;

  /** Equipo con el que jugó el jugador en este partido */
  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEquipo' })
  equipo: Equipo;

  /** Tipo de estadística registrada (del catálogo tipos_estadistica) */
  @ManyToOne(() => TipoEstadistica, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idTipoEstadistica' })
  tipoEstadistica: TipoEstadistica;

  /** Usuario administrador o manager que registró o actualizó la estadística */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /** Cantidad acumulada de esta estadística en el partido (ej: 2 goles, 3 triples) */
  @Column({ type: 'int', default: 1 })
  cantidad: number;

  /** Fecha de creación del registro */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización del registro */
  @UpdateDateColumn()
  updatedAt: Date;
}
