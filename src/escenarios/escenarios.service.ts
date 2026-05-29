import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escenario } from './escenario.entity';
import { CreateEscenarioDto } from './dto/create-escenario.dto';
import { UpdateEscenarioDto } from './dto/update-escenario.dto';
import { User } from '../users/user.entity';
import { Role } from '../users/enums/role.enum';

/**
 * Servicio de escenarios.
 * Contiene la lógica de negocio para la gestión (CRUD) de escenarios deportivos.
 */
@Injectable()
export class EscenariosService {
  constructor(
    /** Repositorio de TypeORM para operaciones en la tabla 'escenarios' */
    @InjectRepository(Escenario)
    private readonly escenariosRepository: Repository<Escenario>,

    /** Repositorio de TypeORM para consultar la relación con la entidad User */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Columnas seleccionadas para el escenario y su relación con el usuario.
   * Filtra campos sensibles del usuario como contraseña, teléfono o dirección.
   */
  private readonly escenarioSelectOptions = {
    id: true,
    nombre: true,
    direccion: true,
    barrioSector: true,
    ubicacion: true,
    deporte: true,
    estado: true,
    createdAt: true,
    updatedAt: true,
    user: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
    },
  };

  /**
   * Crea un nuevo escenario deportivo.
   *
   * @param createEscenarioDto - Datos para la creación del escenario
   * @param userId - ID del usuario autenticado que lo registra
   * @returns El escenario creado con la relación al usuario
   */
  async create(
    createEscenarioDto: CreateEscenarioDto,
    userId: number,
  ): Promise<Escenario> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const escenario = this.escenariosRepository.create({
      ...createEscenarioDto,
      user,
    });

    const guardado = await this.escenariosRepository.save(escenario);
    return this.findOne(guardado.id);
  }

  /**
   * Obtiene todos los escenarios registrados.
   *
   * @returns Lista completa de escenarios
   */
  async findAll(): Promise<Escenario[]> {
    return this.escenariosRepository.find({
      relations: { user: true },
      select: this.escenarioSelectOptions,
    });
  }

  /**
   * Obtiene un escenario específico por su ID.
   *
   * @param id - ID del escenario a buscar
   * @returns El escenario encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: number): Promise<Escenario> {
    const escenario = await this.escenariosRepository.findOne({
      where: { id },
      relations: { user: true },
      select: this.escenarioSelectOptions,
    });

    if (!escenario) {
      throw new NotFoundException(`Escenario con ID ${id} no encontrado`);
    }

    return escenario;
  }

  /**
   * Obtiene todos los escenarios creados por un usuario específico.
   *
   * @param userId - ID del usuario creador
   * @returns Lista de escenarios correspondientes al usuario
   */
  async findByUser(userId: number): Promise<Escenario[]> {
    return this.escenariosRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
      select: this.escenarioSelectOptions,
    });
  }

  /**
   * Actualiza un escenario existente.
   * Permite la actualización al creador del escenario o a un administrador.
   *
   * @param id - ID del escenario a actualizar
   * @param updateEscenarioDto - Campos a modificar
   * @param userId - ID del usuario que solicita la actualización
   * @param userRole - Rol del usuario solicitante
   * @returns El escenario actualizado
   */
  async update(
    id: number,
    updateEscenarioDto: UpdateEscenarioDto,
    userId: number,
    userRole: Role,
  ): Promise<Escenario> {
    const escenario = await this.findOne(id);

    // Permite la edición si es el dueño (creador) del escenario o si es Administrador
    if (escenario.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este escenario.',
      );
    }

    // Mezcla las propiedades actualizadas
    const escenarioActualizado = this.escenariosRepository.merge(
      escenario,
      updateEscenarioDto,
    );

    await this.escenariosRepository.save(escenarioActualizado);
    return this.findOne(id);
  }

  /**
   * Elimina un escenario.
   * Permite la eliminación al creador del escenario o a un administrador.
   *
   * @param id - ID del escenario a eliminar
   * @param userId - ID del usuario que solicita la eliminación
   * @param userRole - Rol del usuario solicitante
   */
  async remove(id: number, userId: number, userRole: Role): Promise<void> {
    const escenario = await this.findOne(id);

    // Permite la eliminación si es el dueño (creador) del escenario o si es Administrador
    if (escenario.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este escenario.',
      );
    }

    await this.escenariosRepository.remove(escenario);
  }
}
