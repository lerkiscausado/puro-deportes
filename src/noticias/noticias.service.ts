import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Noticia } from './noticia.entity';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';

/**
 * Servicio de noticias.
 * Contiene la lógica de negocio para la gestión (CRUD) de noticias.
 */
@Injectable()
export class NoticiasService {
  constructor(
    @InjectRepository(Noticia)
    private readonly noticiasRepository: Repository<Noticia>,
  ) {}

  /**
   * Genera un slug URL-friendly a partir del título suministrado.
   *
   * @param titulo - Título de la noticia
   * @returns Slug formateado
   */
  private generarSlug(titulo: string): string {
    let slug = titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (slug.length > 100) {
      let truncated = slug.substring(0, 100);
      const lastDash = truncated.lastIndexOf('-');
      if (lastDash > 0) {
        truncated = truncated.substring(0, lastDash);
      }
      slug = truncated.replace(/^-+|-+$/g, '');
    }

    return slug || 'noticia';
  }

  /**
   * Genera un slug único asegurando que no colisione con registros existentes en BD.
   * Si ya existe un slug idéntico, le agrega un sufijo incremental (-2, -3, etc.).
   *
   * @param titulo - Título de la noticia
   * @returns Slug único para la base de datos
   */
  private async generarSlugUnico(titulo: string): Promise<string> {
    const baseSlug = this.generarSlug(titulo);
    let slug = baseSlug;
    let contador = 1;

    while (true) {
      const existing = await this.noticiasRepository.findOne({
        where: { slug },
      });
      if (!existing) {
        return slug;
      }
      contador++;
      slug = `${baseSlug}-${contador}`;
    }
  }

  /**
   * Crea una nueva noticia en la base de datos.
   *
   * @param createNoticiaDto - Datos para la creación de la noticia
   * @param fotoFilename - Nombre del archivo de imagen subido (opcional)
   * @returns La noticia creada y guardada
   */
  async create(
    createNoticiaDto: CreateNoticiaDto,
    fotoFilename?: string,
  ): Promise<Noticia> {
    const slug = await this.generarSlugUnico(createNoticiaDto.titulo);
    const noticia = this.noticiasRepository.create({
      ...createNoticiaDto,
      slug,
      foto: fotoFilename || null,
    });
    return this.noticiasRepository.save(noticia);
  }

  /**
   * Obtiene todas las noticias registradas, ordenadas por fecha de creación (de más reciente a más antigua).
   *
   * @returns Lista completa de noticias
   */
  async findAll(): Promise<Noticia[]> {
    return this.noticiasRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Obtiene las noticias públicas más recientes (máximo 30).
   *
   * @returns Lista de noticias ordenadas por fecha de creación descendente
   */
  async findPublicAll(): Promise<Noticia[]> {
    return this.noticiasRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 30,
    });
  }

  /**
   * Obtiene una noticia pública por su slug único.
   *
   * @param slug - Slug de la noticia a buscar
   * @returns La noticia correspondiente
   * @throws NotFoundException si la noticia no existe
   */
  async findPublicBySlug(slug: string): Promise<Noticia> {
    const noticia = await this.noticiasRepository.findOne({
      where: { slug },
    });

    if (!noticia) {
      throw new NotFoundException('Noticia no encontrada');
    }

    return noticia;
  }

  /**
   * Obtiene una noticia específica por su ID.
   *
   * @param id - ID de la noticia a buscar
   * @returns La noticia encontrada
   * @throws NotFoundException si no existe
   */
  async findOne(id: number): Promise<Noticia> {
    const noticia = await this.noticiasRepository.findOne({ where: { id } });

    if (!noticia) {
      throw new NotFoundException(`Noticia con ID ${id} no encontrada`);
    }

    return noticia;
  }

  /**
   * Actualiza los datos de una noticia existente.
   *
   * @param id - ID de la noticia a actualizar
   * @param updateNoticiaDto - Campos a modificar
   * @param fotoFilename - Nuevo archivo de foto si se suministra (opcional)
   * @returns La noticia actualizada
   */
  async update(
    id: number,
    updateNoticiaDto: UpdateNoticiaDto,
    fotoFilename?: string,
  ): Promise<Noticia> {
    const noticia = await this.findOne(id);

    const updateData: Partial<Noticia> = {
      ...updateNoticiaDto,
    };

    if (fotoFilename) {
      updateData.foto = fotoFilename;
    }

    const noticiaActualizada = this.noticiasRepository.merge(
      noticia,
      updateData,
    );

    return this.noticiasRepository.save(noticiaActualizada);
  }

  /**
   * Elimina una noticia de la base de datos.
   *
   * @param id - ID de la noticia a eliminar
   */
  async remove(id: number): Promise<void> {
    const noticia = await this.findOne(id);
    await this.noticiasRepository.remove(noticia);
  }
}
