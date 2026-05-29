import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from './inscripcion.entity';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Role } from '../users/enums/role.enum';
import { EstadoInscripcion } from './enums/estado-inscripcion.enum';

/**
 * Servicio de inscripciones.
 * Contiene la lógica de negocio para la inscripción de equipos en torneos y actualización de estadísticas.
 */
@Injectable()
export class InscripcionesService {
  constructor(
    /** Repositorio para la tabla 'inscripciones' */
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepository: Repository<Inscripcion>,

    /** Repositorio para consultar y verificar la entidad User */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    /** Repositorio para consultar y verificar la entidad Torneo */
    @InjectRepository(Torneo)
    private readonly torneosRepository: Repository<Torneo>,

    /** Repositorio para consultar y verificar la entidad Equipo */
    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,
  ) {}

  /**
   * Sanea los objetos relacionados de una inscripción removiendo contraseñas por seguridad.
   */
  private sanitizeInscripcion(inscripcion: Inscripcion): Inscripcion {
    if (!inscripcion) return inscripcion;

    if (inscripcion.user) {
      delete (inscripcion.user as any).password;
    }

    if (inscripcion.torneo && inscripcion.torneo.user) {
      delete (inscripcion.torneo.user as any).password;
    }

    if (inscripcion.equipo && inscripcion.equipo.user) {
      delete (inscripcion.equipo.user as any).password;
    }

    return inscripcion;
  }

  /**
   * Crea una nueva inscripción de un equipo en un torneo.
   *
   * @param createInscripcionDto - Datos de la inscripción (idTorneo, idEquipo)
   * @param userId - ID del usuario que registra la inscripción
   * @returns La inscripción creada
   * @throws NotFoundException si no existe el usuario, torneo o equipo
   * @throws BadRequestException si el equipo ya se encuentra inscrito y activo en el torneo
   */
  async create(
    createInscripcionDto: CreateInscripcionDto,
    userId: number,
  ): Promise<Inscripcion> {
    const { idTorneo, idEquipo } = createInscripcionDto;

    // 1. Verificar si el usuario existe
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Verificar si el torneo existe
    const torneo = await this.torneosRepository.findOne({
      where: { id: idTorneo },
    });
    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${idTorneo} no encontrado`);
    }

    // 3. Verificar si el equipo existe
    const equipo = await this.equiposRepository.findOne({
      where: { id: idEquipo },
    });
    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${idEquipo} no encontrado`);
    }

    // 4. Validar que el equipo no esté inscrito previamente de forma activa en el mismo torneo
    const inscripcionExistente = await this.inscripcionesRepository.findOne({
      where: {
        torneo: { id: idTorneo },
        equipo: { id: idEquipo },
        estado: EstadoInscripcion.ACTIVO,
      },
    });

    if (inscripcionExistente) {
      throw new BadRequestException(
        `El equipo "${equipo.nombre}" ya está inscrito de forma activa en este torneo.`,
      );
    }

    // 5. Crear la inscripción
    const inscripcion = this.inscripcionesRepository.create({
      user,
      torneo,
      equipo,
      estado: EstadoInscripcion.ACTIVO,
    });

    const guardada = await this.inscripcionesRepository.save(inscripcion);
    return this.findOne(guardada.id);
  }

  /**
   * Obtiene todas las inscripciones registradas.
   */
  async findAll(): Promise<Inscripcion[]> {
    const inscripciones = await this.inscripcionesRepository.find({
      relations: {
        user: true,
        torneo: true,
        equipo: true,
      },
    });
    return inscripciones.map((insc) => this.sanitizeInscripcion(insc));
  }

  /**
   * Obtiene una inscripción por su ID.
   *
   * @param id - ID de la inscripción a buscar
   * @throws NotFoundException si la inscripción no existe
   */
  async findOne(id: number): Promise<Inscripcion> {
    const inscripcion = await this.inscripcionesRepository.findOne({
      where: { id },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
      },
    });

    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return this.sanitizeInscripcion(inscripcion);
  }

  /**
   * Obtiene todas las inscripciones activas creadas por un usuario.
   */
  async findByUser(userId: number): Promise<Inscripcion[]> {
    const inscripciones = await this.inscripcionesRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
      },
    });
    return inscripciones.map((insc) => this.sanitizeInscripcion(insc));
  }

  /**
   * Obtiene todas las inscripciones activas registradas en un torneo específico.
   */
  async findByTorneo(torneoId: number): Promise<Inscripcion[]> {
    const inscripciones = await this.inscripcionesRepository.find({
      where: {
        torneo: { id: torneoId },
        estado: EstadoInscripcion.ACTIVO,
      },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
      },
    });
    return inscripciones.map((insc) => this.sanitizeInscripcion(insc));
  }

  /**
   * Actualiza los datos de una inscripción (estadísticas o estado).
   *
   * @param id - ID de la inscripción
   * @param updateInscripcionDto - Datos actualizados
   * @param userId - ID del usuario solicitante
   * @param userRole - Rol del usuario solicitante
   */
  async update(
    id: number,
    updateInscripcionDto: UpdateInscripcionDto,
    userId: number,
    userRole: Role,
  ): Promise<Inscripcion> {
    const inscripcion = await this.findOne(id);

    // Permite la edición si es el dueño de la inscripción o un Administrador
    if (inscripcion.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta inscripción.',
      );
    }

    const { estado, ...stats } = updateInscripcionDto;

    // Actualizar estadísticas si se proveen
    const inscripcionActualizada = this.inscripcionesRepository.merge(
      inscripcion,
      stats,
    );

    // Si se provee un cambio de estado
    if (estado !== undefined) {
      inscripcionActualizada.estado = estado;
    }

    await this.inscripcionesRepository.save(inscripcionActualizada);
    return this.findOne(id);
  }

  /**
   * Elimina de forma lógica una inscripción marcándola como 'Eliminado'.
   *
   * @param id - ID de la inscripción a eliminar
   * @param userId - ID del usuario solicitante
   * @param userRole - Rol del usuario solicitante
   */
  async remove(id: number, userId: number, userRole: Role): Promise<void> {
    const inscripcion = await this.findOne(id);

    // Permite la eliminación si es el dueño de la inscripción o un Administrador
    if (inscripcion.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta inscripción.',
      );
    }

    inscripcion.estado = EstadoInscripcion.ELIMINADO;
    await this.inscripcionesRepository.save(inscripcion);
  }
}
