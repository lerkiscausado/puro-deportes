import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';

/**
 * Entidad Favorito - Representa la tabla 'favoritos' en la base de datos.
 * Registra los torneos marcados como favoritos por cada usuario autenticado.
 *
 * Restricción única: un usuario no puede marcar el mismo torneo dos veces
 * (UNIQUE KEY `IDX_favorito_user_torneo` (`idUser`, `idTorneo`)).
 *
 * Las FK tienen ON DELETE CASCADE: si se elimina el usuario o el torneo,
 * sus registros de favoritos se eliminan automáticamente.
 */
@Entity('favoritos')
export class Favorito {
  /** Identificador único del favorito, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Relación ManyToOne con la entidad User.
   * Sin eager para evitar filtración de datos sensibles (email, password, etc.)
   * al consultar los favoritos.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idUser' })
  user: User;

  /**
   * Relación ManyToOne con la entidad Torneo.
   * Sin eager — la relación se carga explícitamente en los métodos del servicio
   * que la necesiten, usando `relations`.
   */
  @ManyToOne(() => Torneo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idTorneo' })
  torneo: Torneo;

  /** Fecha en que el usuario marcó el torneo como favorito (generada automáticamente) */
  @CreateDateColumn()
  createdAt: Date;
}
