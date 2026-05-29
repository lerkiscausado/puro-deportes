import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partido } from './partido.entity';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Role } from '../users/enums/role.enum';
import { Escenario } from '../escenarios/escenario.entity';

/**
 * Servicio de partidos.
 * Contiene la lógica de negocio para la gestión (CRUD) de partidos de torneos.
 */
@Injectable()
export class PartidosService {
  constructor(
    /** Repositorio de TypeORM para operaciones en la tabla 'partidos' */
    @InjectRepository(Partido)
    private readonly partidosRepository: Repository<Partido>,

    /** Repositorio de TypeORM para consultar la relación con la entidad User */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    /** Repositorio de TypeORM para consultar la relación con la entidad Torneo */
    @InjectRepository(Torneo)
    private readonly torneosRepository: Repository<Torneo>,

    /** Repositorio de TypeORM para consultar la relación con la entidad Equipo */
    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,

    /** Repositorio de TypeORM para consultar la relación con la entidad Escenario */
    @InjectRepository(Escenario)
    private readonly escenariosRepository: Repository<Escenario>,
  ) {}

  /**
   * Sanea un partido eliminando campos sensibles de las relaciones de usuario
   * para evitar exponer contraseñas.
   */
  private sanitizePartido(partido: Partido): Partido {
    if (!partido) return partido;

    if (partido.user) {
      delete (partido.user as any).password;
    }

    if (partido.torneo && partido.torneo.user) {
      delete (partido.torneo.user as any).password;
    }

    if (partido.equipoLocal && partido.equipoLocal.user) {
      delete (partido.equipoLocal.user as any).password;
    }

    if (partido.equipoVisitante && partido.equipoVisitante.user) {
      delete (partido.equipoVisitante.user as any).password;
    }

    if (partido.escenario && partido.escenario.user) {
      delete (partido.escenario.user as any).password;
    }

    return partido;
  }

  /**
   * Verifica que ni el equipo local ni el equipo visitante tengan otro partido programado
   * en el mismo torneo en la misma fecha y hora.
   */
  private async checkConflicts(
    idTorneo: number,
    fecha: string,
    hora: string,
    idLocal: number,
    idVisitante: number,
    excludePartidoId?: number,
  ): Promise<void> {
    const query = this.partidosRepository
      .createQueryBuilder('partido')
      .leftJoin('partido.torneo', 'torneo')
      .leftJoin('partido.equipoLocal', 'equipoLocal')
      .leftJoin('partido.equipoVisitante', 'equipoVisitante')
      .where('torneo.id = :idTorneo', { idTorneo })
      .andWhere('partido.fecha = :fecha', { fecha })
      .andWhere('partido.hora = :hora', { hora })
      .andWhere(
        '(equipoLocal.id = :idLocal OR equipoVisitante.id = :idLocal OR equipoLocal.id = :idVisitante OR equipoVisitante.id = :idVisitante)',
        { idLocal, idVisitante },
      );

    if (excludePartidoId !== undefined) {
      query.andWhere('partido.id != :excludePartidoId', { excludePartidoId });
    }

    const conflicto = await query.getOne();

    if (conflicto) {
      throw new BadRequestException(
        'Uno de los equipos ya tiene programado un partido en este torneo a la misma fecha y hora.',
      );
    }
  }

  /**
   * Crea un nuevo partido de torneo.
   *
   * @param createPartidoDto - Datos para la creación del partido
   * @param userId - ID del usuario autenticado que lo registra
   * @returns El partido creado con todas sus relaciones
   */
  async create(
    createPartidoDto: CreatePartidoDto,
    userId: number,
  ): Promise<Partido> {
    const {
      idTorneo,
      idEquipoLocal,
      idEquipoVisitante,
      fecha,
      hora,
      idEscenario,
      ...rest
    } = createPartidoDto;

    // El equipo local y el equipo visitante no pueden ser el mismo
    if (idEquipoLocal === idEquipoVisitante) {
      throw new BadRequestException(
        'El equipo local y el equipo visitante no pueden ser el mismo en la misma programación.',
      );
    }

    // Validar que ninguno de los equipos ya esté ocupado en ese torneo, fecha y hora
    await this.checkConflicts(
      idTorneo,
      fecha,
      hora,
      idEquipoLocal,
      idEquipoVisitante,
    );

    // Verificar si el usuario existe
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si el torneo existe
    const torneo = await this.torneosRepository.findOne({
      where: { id: idTorneo },
    });
    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${idTorneo} no encontrado`);
    }

    // Verificar si el equipo local existe
    const equipoLocal = await this.equiposRepository.findOne({
      where: { id: idEquipoLocal },
    });
    if (!equipoLocal) {
      throw new NotFoundException(
        `Equipo local con ID ${idEquipoLocal} no encontrado`,
      );
    }

    // Verificar si el equipo visitante existe
    const equipoVisitante = await this.equiposRepository.findOne({
      where: { id: idEquipoVisitante },
    });
    if (!equipoVisitante) {
      throw new NotFoundException(
        `Equipo visitante con ID ${idEquipoVisitante} no encontrado`,
      );
    }

    // Verificar si el escenario existe (si se provee)
    let escenario: Escenario | null = null;
    if (idEscenario !== undefined && idEscenario !== null) {
      const foundEscenario = await this.escenariosRepository.findOne({
        where: { id: idEscenario },
      });
      if (!foundEscenario) {
        throw new NotFoundException(
          `Escenario con ID ${idEscenario} no encontrado`,
        );
      }
      escenario = foundEscenario;
    }

    // Crear el partido asociándole las entidades encontradas
    const partido = this.partidosRepository.create({
      ...rest,
      fecha,
      hora,
      torneo,
      equipoLocal,
      equipoVisitante,
      user,
      escenario,
    });

    const guardado = await this.partidosRepository.save(partido);
    return this.findOne(guardado.id);
  }

  /**
   * Obtiene todos los partidos registrados.
   *
   * @returns Lista completa de partidos
   */
  async findAll(): Promise<Partido[]> {
    const partidos = await this.partidosRepository.find({
      relations: {
        torneo: true,
        equipoLocal: true,
        equipoVisitante: true,
        user: true,
      },
    });
    return partidos.map((p) => this.sanitizePartido(p));
  }

  /**
   * Obtiene un partido específico por su ID.
   *
   * @param id - ID del partido a buscar
   * @returns El partido encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: number): Promise<Partido> {
    const partido = await this.partidosRepository.findOne({
      where: { id },
      relations: {
        torneo: true,
        equipoLocal: true,
        equipoVisitante: true,
        user: true,
      },
    });

    if (!partido) {
      throw new NotFoundException(`Partido con ID ${id} no encontrado`);
    }

    return this.sanitizePartido(partido);
  }

  /**
   * Obtiene todos los partidos creados por un usuario específico.
   *
   * @param userId - ID del usuario creador
   * @returns Lista de partidos correspondientes al usuario
   */
  async findByUser(userId: number): Promise<Partido[]> {
    const partidos = await this.partidosRepository.find({
      where: { user: { id: userId } },
      relations: {
        torneo: true,
        equipoLocal: true,
        equipoVisitante: true,
        user: true,
      },
    });
    return partidos.map((p) => this.sanitizePartido(p));
  }

  /**
   * Obtiene todos los partidos asociados a un torneo específico.
   *
   * @param torneoId - ID del torneo
   * @returns Lista de partidos pertenecientes al torneo
   */
  async findByTorneo(torneoId: number): Promise<Partido[]> {
    const partidos = await this.partidosRepository.find({
      where: { torneo: { id: torneoId } },
      relations: {
        torneo: true,
        equipoLocal: true,
        equipoVisitante: true,
        user: true,
      },
    });
    return partidos.map((p) => this.sanitizePartido(p));
  }

  /**
   * Actualiza un partido existente.
   * Permite la actualización al creador del partido o a un administrador.
   *
   * @param id - ID del partido a actualizar
   * @param updatePartidoDto - Campos a modificar
   * @param userId - ID del usuario que solicita la actualización
   * @param userRole - Rol del usuario solicitante
   * @returns El partido actualizado
   */
  async update(
    id: number,
    updatePartidoDto: UpdatePartidoDto,
    userId: number,
    userRole: Role,
  ): Promise<Partido> {
    const partido = await this.findOne(id);

    // Permite la edición si es el dueño (creador) del partido o si es Administrador
    if (partido.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este partido.',
      );
    }

    const {
      idTorneo,
      idEquipoLocal,
      idEquipoVisitante,
      fecha,
      hora,
      idEscenario,
      ...rest
    } = updatePartidoDto;

    // Obtener los valores resultantes (nuevos o actuales)
    const finalTorneoId = idTorneo !== undefined ? idTorneo : partido.torneo.id;
    const finalFecha = fecha !== undefined ? fecha : partido.fecha;
    const finalHora = hora !== undefined ? hora : partido.hora;
    const finalLocalId =
      idEquipoLocal !== undefined ? idEquipoLocal : partido.equipoLocal.id;
    const finalVisitanteId =
      idEquipoVisitante !== undefined
        ? idEquipoVisitante
        : partido.equipoVisitante.id;

    // El equipo local y el equipo visitante no pueden ser el mismo
    if (finalLocalId === finalVisitanteId) {
      throw new BadRequestException(
        'El equipo local y el equipo visitante no pueden ser el mismo en la misma programación.',
      );
    }

    // Validar conflictos de fecha y hora para los equipos en el mismo torneo
    await this.checkConflicts(
      finalTorneoId,
      finalFecha,
      finalHora,
      finalLocalId,
      finalVisitanteId,
      id, // Excluir este partido
    );

    // Si se envía un nuevo escenario, verificar que exista
    if (idEscenario !== undefined) {
      if (idEscenario === null) {
        partido.escenario = null;
      } else {
        const escenario = await this.escenariosRepository.findOne({
          where: { id: idEscenario },
        });
        if (!escenario) {
          throw new NotFoundException(
            `Escenario con ID ${idEscenario} no encontrado`,
          );
        }
        partido.escenario = escenario;
      }
    }

    // Si se envía un nuevo torneo, verificar que exista
    if (idTorneo !== undefined) {
      const torneo = await this.torneosRepository.findOne({
        where: { id: idTorneo },
      });
      if (!torneo) {
        throw new NotFoundException(`Torneo con ID ${idTorneo} no encontrado`);
      }
      partido.torneo = torneo;
    }

    // Si se envía un nuevo equipo local, verificar que exista
    if (idEquipoLocal !== undefined) {
      const equipoLocal = await this.equiposRepository.findOne({
        where: { id: idEquipoLocal },
      });
      if (!equipoLocal) {
        throw new NotFoundException(
          `Equipo local con ID ${idEquipoLocal} no encontrado`,
        );
      }
      partido.equipoLocal = equipoLocal;
    }

    // Si se envía un nuevo equipo visitante, verificar que exista
    if (idEquipoVisitante !== undefined) {
      const equipoVisitante = await this.equiposRepository.findOne({
        where: { id: idEquipoVisitante },
      });
      if (!equipoVisitante) {
        throw new NotFoundException(
          `Equipo visitante con ID ${idEquipoVisitante} no encontrado`,
        );
      }
      partido.equipoVisitante = equipoVisitante;
    }

    // Mezclar el resto de las propiedades actualizadas
    const partidoActualizado = this.partidosRepository.merge(partido, rest);

    // Si se envían nuevas fecha u hora, asignarlas
    if (fecha !== undefined) {
      partidoActualizado.fecha = fecha;
    }
    if (hora !== undefined) {
      partidoActualizado.hora = hora;
    }

    await this.partidosRepository.save(partidoActualizado);
    return this.findOne(id);
  }

  /**
   * Elimina un partido.
   * Permite la eliminación al creador del partido o a un administrador.
   *
   * @param id - ID del partido a eliminar
   * @param userId - ID del usuario que solicita la eliminación
   * @param userRole - Rol del usuario solicitante
   */
  async remove(id: number, userId: number, userRole: Role): Promise<void> {
    const partido = await this.findOne(id);

    // Permite la eliminación si es el dueño (creador) del partido o si es Administrador
    if (partido.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este partido.',
      );
    }

    await this.partidosRepository.remove(partido);
  }
}
