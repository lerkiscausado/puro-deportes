import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entidad Visita - Representa la tabla 'visitas' en la base de datos.
 * Registra cada carga de una página pública, almacenando la ruta visitada
 * y la fecha/hora de la visita.
 *
 * La tabla fue creada manualmente en la BD con índices nombrados:
 *   KEY `IDX_visita_ruta` (`ruta`)
 *   KEY `IDX_visita_createdAt` (`createdAt`)
 *
 * Los @Index con nombre explícito hacen que TypeORM los reconozca durante
 * synchronize y no intente crear/eliminar los índices innecesariamente.
 * NO se generan migraciones para esta entidad; la tabla ya existe en producción.
 */
@Index('IDX_visita_ruta', ['ruta'])
@Index('IDX_visita_createdAt', ['createdAt'])
@Entity('visitas')
export class Visita {
  /** Identificador único de la visita, generado automáticamente */
  @PrimaryGeneratedColumn()
  id: number;

  /** Ruta de la página visitada (ej: "/torneos", "/noticias/5") */
  @Column({ type: 'varchar', length: 255 })
  ruta: string;

  /** Fecha y hora en que se registró la visita (generada automáticamente) */
  @CreateDateColumn()
  createdAt: Date;
}
