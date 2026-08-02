import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';
import { Equipo } from './equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { User } from '../users/user.entity';
import { Role } from '../users/enums/role.enum';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Servicio de equipos.
 * Contiene la lógica de negocio para la gestión (CRUD) de equipos deportivos.
 */
@Injectable()
export class EquiposService {
  constructor(
    /** Repositorio de TypeORM para operaciones en la tabla 'equipos' */
    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,

    /** Repositorio de TypeORM para consultar la relación con la entidad User */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Columnas seleccionadas para el equipo y su relación con el usuario.
   * Filtra campos sensibles del usuario como contraseña.
   */
  private readonly equipoSelectOptions = {
    id: true,
    nombre: true,
    representante: true,
    telefono: true,
    correo: true,
    deporte: true,
    foto: true,
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
   * Crea un nuevo equipo deportivo.
   *
   * @param createEquipoDto - Datos para la creación del equipo
   * @param userId - ID del usuario autenticado que lo registra
   * @param file - Archivo de imagen subido para el escudo/foto (opcional)
   * @returns El equipo creado con la relación al usuario
   */
  async create(
    createEquipoDto: CreateEquipoDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<Equipo> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const equipo = this.equiposRepository.create({
      ...createEquipoDto,
      foto: file?.filename ?? createEquipoDto.foto,
      user,
    });

    const guardado = await this.equiposRepository.save(equipo);
    return this.findOne(guardado.id);
  }

  /**
   * Obtiene todos los equipos registrados.
   *
   * @returns Lista completa de equipos
   */
  async findAll(): Promise<Equipo[]> {
    return this.equiposRepository.find({
      relations: { user: true },
      select: this.equipoSelectOptions,
    });
  }

  /**
   * Obtiene un equipo específico por su ID.
   *
   * @param id - ID del equipo a buscar
   * @returns El equipo encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: number): Promise<Equipo> {
    const equipo = await this.equiposRepository.findOne({
      where: { id },
      relations: { user: true },
      select: this.equipoSelectOptions,
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    }

    return equipo;
  }

  /**
   * Obtiene todos los equipos creados por un usuario específico.
   *
   * @param userId - ID del usuario creador
   * @returns Lista de equipos correspondientes al usuario
   */
  async findByUser(userId: number): Promise<Equipo[]> {
    return this.equiposRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
      select: this.equipoSelectOptions,
    });
  }

  /**
   * Actualiza un equipo existente.
   * Permite la actualización al creador del equipo o a un administrador.
   *
   * @param id - ID del equipo a actualizar
   * @param updateEquipoDto - Campos a modificar
   * @param userId - ID del usuario que solicita la actualización
   * @param userRole - Rol del usuario solicitante
   * @param file - Archivo de imagen subido si se reemplaza la foto (opcional)
   * @returns El equipo actualizado
   */
  async update(
    id: number,
    updateEquipoDto: UpdateEquipoDto,
    userId: number,
    userRole: Role,
    file?: Express.Multer.File,
  ): Promise<Equipo> {
    const equipo = await this.findOne(id);

    // Permite la edición si es el dueño (creador) del equipo o si es Administrador
    if (equipo.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este equipo.',
      );
    }

    const { foto: dtoFoto, ...restDto } = updateEquipoDto;

    let fotoActualizada = equipo.foto;

    if (file?.filename) {
      // Si el equipo ya tenía una foto previa guardada, elimina la foto anterior del disco
      if (equipo.foto) {
        const oldPath = join(getUploadsPath('equipos'), equipo.foto);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch {
          // Ignorar silenciosamente si no se pudo eliminar la imagen previa
        }
      }
      fotoActualizada = file.filename;
    } else if (dtoFoto !== undefined && dtoFoto !== null && dtoFoto !== '') {
      fotoActualizada = dtoFoto;
    }

    // Mezcla las propiedades actualizadas
    const equipoActualizado = this.equiposRepository.merge(
      equipo,
      restDto,
    );
    equipoActualizado.foto = fotoActualizada;

    await this.equiposRepository.save(equipoActualizado);
    return this.findOne(id);
  }

  /**
   * Elimina un equipo.
   * Permite la eliminación al creador del equipo o a un administrador.
   *
   * @param id - ID del equipo a eliminar
   * @param userId - ID del usuario que solicita la eliminación
   * @param userRole - Rol del usuario solicitante
   */
  async remove(id: number, userId: number, userRole: Role): Promise<void> {
    const equipo = await this.findOne(id);

    // Permite la eliminación si es el dueño (creador) del equipo o si es Administrador
    if (equipo.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este equipo.',
      );
    }

    await this.equiposRepository.remove(equipo);
  }
}
