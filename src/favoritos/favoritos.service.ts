import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Favorito } from './favorito.entity';
import { Torneo } from '../torneos/torneo.entity';

/**
 * Servicio de favoritos.
 * Gestiona la lista de torneos favoritos de cada usuario autenticado.
 */
@Injectable()
export class FavoritosService {
  constructor(
    /** Repositorio de favoritos */
    @InjectRepository(Favorito)
    private readonly favoritosRepository: Repository<Favorito>,

    /** Repositorio de torneos para verificar existencia antes de agregar */
    @InjectRepository(Torneo)
    private readonly torneosRepository: Repository<Torneo>,
  ) {}

  /**
   * Agrega un torneo a la lista de favoritos del usuario autenticado.
   *
   * Proceso:
   * 1. Verifica que el torneo exista.
   * 2. Verifica que el favorito no exista ya (evita duplicados con un check previo
   *    y además captura posibles condiciones de carrera con ER_DUP_ENTRY).
   * 3. Crea y persiste el favorito.
   * 4. Retorna solo el id creado y un mensaje (sin exponer el objeto `user`).
   *
   * @param userId - ID del usuario extraído del token JWT
   * @param torneoId - ID del torneo a marcar como favorito
   * @returns Confirmación con id del favorito creado
   * @throws NotFoundException si el torneo no existe
   * @throws ConflictException si el torneo ya está en favoritos del usuario
   */
  async agregar(
    userId: number,
    torneoId: number,
  ): Promise<{ message: string; id: number }> {
    // Verifica que el torneo exista
    const torneo = await this.torneosRepository.findOne({
      where: { id: torneoId },
    });

    if (!torneo) {
      throw new NotFoundException('Torneo no encontrado');
    }

    // Verifica si el favorito ya existe (check optimista antes del INSERT)
    const existing = await this.favoritosRepository.findOne({
      where: {
        user: { id: userId },
        torneo: { id: torneoId },
      },
    });

    if (existing) {
      throw new ConflictException('Este torneo ya está en tus favoritos');
    }

    // Crea el favorito usando referencias de FK (evita cargar objetos completos)
    const favorito = this.favoritosRepository.create({
      user: { id: userId } as any,
      torneo: { id: torneoId } as any,
    });

    try {
      const saved = await this.favoritosRepository.save(favorito);
      return {
        message: 'Torneo agregado a favoritos exitosamente',
        id: saved.id,
      };
    } catch (error) {
      // Condición de carrera: dos requests simultáneos con el mismo userId+torneoId
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Este torneo ya está en tus favoritos');
      }
      throw error;
    }
  }

  /**
   * Elimina un torneo de la lista de favoritos del usuario autenticado.
   *
   * @param userId - ID del usuario extraído del token JWT
   * @param torneoId - ID del torneo a eliminar de favoritos
   * @throws NotFoundException si el favorito no existe
   */
  async eliminar(userId: number, torneoId: number): Promise<void> {
    const favorito = await this.favoritosRepository.findOne({
      where: {
        user: { id: userId },
        torneo: { id: torneoId },
      },
    });

    if (!favorito) {
      throw new NotFoundException('Este torneo no está en tus favoritos');
    }

    await this.favoritosRepository.remove(favorito);
  }

  /**
   * Retorna todos los torneos marcados como favoritos por el usuario autenticado.
   *
   * Carga la relación `torneo` (que a su vez carga su `escenario` con eager:true),
   * ordena por `createdAt` DESC (más recientes primero) y aplana la respuesta
   * para que el frontend reciba directamente un array de torneos enriquecidos
   * con el campo `favoritoDesde` (fecha en que se marcó como favorito).
   *
   * @param userId - ID del usuario extraído del token JWT
   * @returns Array de torneos con campo adicional `favoritoDesde`
   */
  async misFavoritos(userId: number) {
    const favoritos = await this.favoritosRepository.find({
      where: {
        user: { id: userId },
      },
      relations: {
        torneo: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Aplana la respuesta: el frontend recibe un array de torneos directamente,
    // cada uno con un campo adicional `favoritoDesde` para saber cuándo fue marcado.
    return favoritos.map((fav) => ({
      ...fav.torneo,
      favoritoDesde: fav.createdAt,
    }));
  }
}
