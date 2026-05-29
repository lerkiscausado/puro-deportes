import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from './jugador.entity';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';

/**
 * Servicio de jugadores.
 * Contiene la lógica de negocio para la gestión (CRUD) de jugadores.
 */
@Injectable()
export class JugadoresService {
  constructor(
    /** Repositorio de TypeORM para operaciones en la tabla 'jugadores' */
    @InjectRepository(Jugador)
    private readonly jugadoresRepository: Repository<Jugador>,
  ) {}

  /**
   * Crea un nuevo jugador en la base de datos.
   *
   * @param createJugadorDto - Datos para la creación del jugador
   * @returns El jugador creado y guardado
   */
  async create(createJugadorDto: CreateJugadorDto): Promise<Jugador> {
    const jugador = this.jugadoresRepository.create(createJugadorDto);
    return this.jugadoresRepository.save(jugador);
  }

  /**
   * Obtiene todos los jugadores registrados.
   *
   * @returns Lista completa de jugadores
   */
  async findAll(): Promise<Jugador[]> {
    return this.jugadoresRepository.find();
  }

  /**
   * Obtiene un jugador específico por su ID.
   *
   * @param id - ID del jugador a buscar
   * @returns El jugador encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: number): Promise<Jugador> {
    const jugador = await this.jugadoresRepository.findOne({ where: { id } });

    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }

    return jugador;
  }

  /**
   * Actualiza los datos de un jugador existente.
   *
   * @param id - ID del jugador a actualizar
   * @param updateJugadorDto - Campos a modificar
   * @returns El jugador actualizado
   */
  async update(
    id: number,
    updateJugadorDto: UpdateJugadorDto,
  ): Promise<Jugador> {
    const jugador = await this.findOne(id);

    const jugadorActualizado = this.jugadoresRepository.merge(
      jugador,
      updateJugadorDto,
    );

    return this.jugadoresRepository.save(jugadorActualizado);
  }

  /**
   * Elimina un jugador de la base de datos.
   *
   * @param id - ID del jugador a eliminar
   */
  async remove(id: number): Promise<void> {
    const jugador = await this.findOne(id);
    await this.jugadoresRepository.remove(jugador);
  }
}
