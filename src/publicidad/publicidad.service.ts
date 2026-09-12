import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';
import { Publicidad } from './publicidad.entity';
import { CreatePublicidadDto } from './dto/create-publicidad.dto';
import { UpdatePublicidadDto } from './dto/update-publicidad.dto';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Servicio de publicidad.
 * Contiene la lógica de negocio para la gestión (CRUD) de anuncios publicitarios.
 */
@Injectable()
export class PublicidadService {
  constructor(
    @InjectRepository(Publicidad)
    private readonly publicidadRepository: Repository<Publicidad>,
  ) {}

  /**
   * Valida que la fecha de fin sea posterior o igual a la fecha de inicio.
   *
   * @param fechaInicio - Fecha de inicio en formato YYYY-MM-DD
   * @param fechaFin - Fecha de fin en formato YYYY-MM-DD
   * @throws BadRequestException si fechaFin es anterior a fechaInicio
   */
  private validarRangoFechas(fechaInicio: string, fechaFin: string): void {
    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior o igual a la fecha de inicio.',
      );
    }
  }

  /**
   * Crea un nuevo anuncio publicitario.
   * La imagen es obligatoria; un anuncio sin imagen no tiene sentido.
   *
   * @param createPublicidadDto - Datos del anuncio (link, fechaInicio, fechaFin)
   * @param file - Archivo de imagen subido (obligatorio)
   * @param userId - ID del usuario administrador que lo crea
   * @returns El anuncio creado
   * @throws BadRequestException si no se sube imagen o las fechas son inválidas
   */
  async create(
    createPublicidadDto: CreatePublicidadDto,
    file: Express.Multer.File | undefined,
    userId: number,
  ): Promise<Publicidad> {
    if (!file) {
      throw new BadRequestException(
        'Debes cargar una imagen para la publicidad',
      );
    }

    this.validarRangoFechas(
      createPublicidadDto.fechaInicio,
      createPublicidadDto.fechaFin,
    );

    const publicidad = this.publicidadRepository.create({
      ...createPublicidadDto,
      imagen: file.filename,
      user: { id: userId },
    });

    return this.publicidadRepository.save(publicidad);
  }

  /**
   * Obtiene todos los anuncios registrados, ordenados por fecha de inicio descendente.
   * No incluye la relación completa con el usuario (eager: false).
   *
   * @returns Lista completa de anuncios publicitarios
   */
  async findAll(): Promise<Publicidad[]> {
    return this.publicidadRepository.find({
      order: {
        fechaInicio: 'DESC',
      },
    });
  }

  /**
   * Obtiene un anuncio específico por su ID.
   *
   * @param id - ID del anuncio a buscar
   * @returns El anuncio encontrado
   * @throws NotFoundException si el anuncio no existe
   */
  async findOne(id: number): Promise<Publicidad> {
    const publicidad = await this.publicidadRepository.findOne({
      where: { id },
    });

    if (!publicidad) {
      throw new NotFoundException(`Publicidad con ID ${id} no encontrada`);
    }

    return publicidad;
  }

  /**
   * Actualiza un anuncio publicitario existente.
   * Si se sube una imagen nueva, la anterior se elimina del disco.
   * Si no se sube nueva imagen, se conserva la imagen actual.
   *
   * @param id - ID del anuncio a actualizar
   * @param updatePublicidadDto - Campos a modificar
   * @param file - Nuevo archivo de imagen (opcional)
   * @returns El anuncio actualizado
   * @throws NotFoundException si el anuncio no existe
   * @throws BadRequestException si las fechas son inválidas
   */
  async update(
    id: number,
    updatePublicidadDto: UpdatePublicidadDto,
    file: Express.Multer.File | undefined,
  ): Promise<Publicidad> {
    const publicidad = await this.findOne(id);

    // Determinar las fechas resultantes para validar el rango
    const fechaInicio =
      updatePublicidadDto.fechaInicio ?? publicidad.fechaInicio;
    const fechaFin = updatePublicidadDto.fechaFin ?? publicidad.fechaFin;
    this.validarRangoFechas(fechaInicio, fechaFin);

    let imagenActualizada = publicidad.imagen;

    if (file?.filename) {
      // Eliminar la imagen anterior del disco si existe
      if (publicidad.imagen) {
        const oldPath = join(getUploadsPath('publicidad'), publicidad.imagen);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch {
          // Ignorar silenciosamente si no se pudo eliminar la imagen previa
        }
      }
      imagenActualizada = file.filename;
    }

    const publicidadActualizada = this.publicidadRepository.merge(
      publicidad,
      updatePublicidadDto,
    );
    publicidadActualizada.imagen = imagenActualizada;

    return this.publicidadRepository.save(publicidadActualizada);
  }

  /**
   * Elimina un anuncio publicitario y su imagen del disco.
   *
   * @param id - ID del anuncio a eliminar
   * @throws NotFoundException si el anuncio no existe
   */
  async remove(id: number): Promise<void> {
    const publicidad = await this.findOne(id);

    // Eliminar la imagen del disco si existe
    if (publicidad.imagen) {
      const imagePath = join(getUploadsPath('publicidad'), publicidad.imagen);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch {
        // Ignorar silenciosamente si no se pudo eliminar la imagen
      }
    }

    await this.publicidadRepository.remove(publicidad);
  }

  /**
   * Obtiene los anuncios vigentes (cuyo rango de fechas cubre la fecha actual).
   * Retorna únicamente los campos públicos: id, imagen y link.
   * No expone fechas ni información de usuario.
   *
   * @returns Lista de anuncios vigentes con solo { id, imagen, link }
   */
  async findVigentesPublic(): Promise<{ id: number; imagen: string; link: string }[]> {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const vigentes = await this.publicidadRepository.find({
      where: {
        fechaInicio: LessThanOrEqual(today),
        fechaFin: MoreThanOrEqual(today),
      },
      select: {
        id: true,
        imagen: true,
        link: true,
      },
    });

    return vigentes;
  }
}
