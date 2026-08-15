import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEstadistica } from './tipo-estadistica.entity';
import { Deporte } from '../torneos/enums/deporte.enum';

/**
 * Servicio de tipos de estadística.
 * Gestiona la lectura del catálogo de estadísticas por deporte.
 */
@Injectable()
export class TiposEstadisticaService {
  constructor(
    @InjectRepository(TipoEstadistica)
    private readonly tipoEstadisticaRepository: Repository<TipoEstadistica>,
  ) {}

  /**
   * Retorna todos los tipos de estadística asociados a un deporte, ordenados por id ascendente.
   *
   * @param deporte - Nombre del deporte según el enum Deporte
   * @returns Lista de tipos de estadística del deporte indicado
   */
  async findByDeporte(deporte: Deporte): Promise<TipoEstadistica[]> {
    return this.tipoEstadisticaRepository.find({
      where: { deporte },
      order: { id: 'ASC' },
    });
  }
}
