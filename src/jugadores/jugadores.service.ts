import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (createJugadorDto.identificacion) {
      const existing = await this.jugadoresRepository.findOne({
        where: { identificacion: createJugadorDto.identificacion },
      });
      if (existing) {
        throw new BadRequestException(
          `Ya existe un jugador registrado con la identificación: ${createJugadorDto.identificacion}`,
        );
      }
    }

    const jugador = this.jugadoresRepository.create(createJugadorDto);
    return this.jugadoresRepository.save(jugador);
  }

  /**
   * Obtiene todos los jugadores registrados con soporte para paginación y filtros.
   *
   * @param query - Parámetros opcionales de búsqueda, género y paginación.
   * @returns Lista completa de jugadores o datos paginados.
   */
  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
  }): Promise<Jugador[] | { data: Jugador[]; total: number; page: number; limit: number }> {
    const { page, limit = 15, search, gender } = query || {};

    const queryBuilder = this.jugadoresRepository.createQueryBuilder('jugador');

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(jugador.nombre) LIKE :search OR LOWER(jugador.apellidos) LIKE :search OR jugador.identificacion LIKE :search)',
        { search: searchLower },
      );
    }

    if (gender && gender !== 'all') {
      queryBuilder.andWhere('jugador.genero = :gender', { gender });
    }

    if (page) {
      const skip = (page - 1) * limit;
      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
      };
    }

    return queryBuilder.getMany();
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

    if (
      updateJugadorDto.identificacion &&
      updateJugadorDto.identificacion !== jugador.identificacion
    ) {
      const existing = await this.jugadoresRepository.findOne({
        where: { identificacion: updateJugadorDto.identificacion },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Ya existe un jugador registrado con la identificación: ${updateJugadorDto.identificacion}`,
        );
      }
    }

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
