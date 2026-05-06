import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Torneo } from './torneo.entity';
import { CreateTorneoDto } from './dto/create-torneo.dto';
import { User } from '../users/user.entity';

/**
 * Servicio de torneos.
 * Contiene la lógica de negocio para la creación, consulta y gestión de torneos.
 */
@Injectable()
export class TorneosService {
  constructor(
    /** Repositorio de TypeORM para ejecutar operaciones sobre la tabla 'torneos' */
    @InjectRepository(Torneo)
    private readonly torneosRepository: Repository<Torneo>,

    /** Repositorio de TypeORM para buscar usuarios relacionados */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo torneo en la base de datos.
   *
   * Proceso:
   * 1. Busca al usuario creador por su ID.
   * 2. Si no existe, lanza excepción 404.
   * 3. Crea el torneo con los datos proporcionados y los archivos subidos.
   * 4. Guarda y retorna el torneo creado.
   *
   * @param createTorneoDto - Datos del torneo a crear
   * @param userId - ID del usuario autenticado que crea el torneo
   * @param files - Archivos subidos (foto e imagen del reglamento)
   * @returns El torneo creado con la relación al usuario
   * @throws NotFoundException si el usuario no existe
   */
  async create(
    createTorneoDto: CreateTorneoDto,
    userId: number,
    files: { foto?: Express.Multer.File[]; reglamento?: Express.Multer.File[] },
  ): Promise<Torneo> {
    // Busca al usuario creador del torneo
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crea la instancia del torneo con los datos y archivos
    const torneo = this.torneosRepository.create({
      ...createTorneoDto,
      foto: files?.foto?.[0]?.filename,
      reglamento: files?.reglamento?.[0]?.filename,
      user,
    } as Partial<Torneo>);

    // Guarda el torneo en la base de datos
    return this.torneosRepository.save(torneo);
  }

  /**
   * Obtiene todos los torneos registrados.
   *
   * @returns Lista de torneos con los datos del usuario creador
   */
  async findAll(): Promise<Torneo[]> {
    return this.torneosRepository.find();
  }

  /**
   * Obtiene un torneo específico por su ID.
   *
   * @param id - ID del torneo a buscar
   * @returns El torneo encontrado con los datos del usuario creador
   * @throws NotFoundException si el torneo no existe
   */
  async findOne(id: number): Promise<Torneo> {
    const torneo = await this.torneosRepository.findOne({ where: { id } });

    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${id} no encontrado`);
    }

    return torneo;
  }

  /**
   * Obtiene todos los torneos creados por un usuario específico.
   *
   * @param userId - ID del usuario cuyos torneos se desean consultar
   * @returns Lista de torneos del usuario
   */
  async findByUser(userId: number): Promise<Torneo[]> {
    return this.torneosRepository.find({
      where: { user: { id: userId } },
    });
  }
}
