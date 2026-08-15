import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, QueryFailedError } from 'typeorm';
import { Planilla } from './planilla.entity';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { EstadoPlanilla } from './enums/estado-planilla.enum';

/**
 * Servicio de planillas.
 * Gestiona el CRUD y las validaciones de negocio asociadas a los rosters de los equipos en torneos.
 */
@Injectable()
export class PlanillasService {
  constructor(
    @InjectRepository(Planilla)
    private readonly planillasRepository: Repository<Planilla>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Torneo)
    private readonly torneosRepository: Repository<Torneo>,

    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,

    @InjectRepository(Jugador)
    private readonly jugadoresRepository: Repository<Jugador>,
  ) {}

  /**
   * Elimina datos confidenciales de los objetos de relación.
   */
  private sanitizePlanilla(planilla: Planilla): Planilla {
    if (!planilla) return planilla;

    if (planilla.user) {
      delete (planilla.user as { password?: string }).password;
    }

    if (planilla.torneo && planilla.torneo.user) {
      delete (planilla.torneo.user as { password?: string }).password;
    }

    if (planilla.equipo && planilla.equipo.user) {
      delete (planilla.equipo.user as { password?: string }).password;
    }

    return planilla;
  }

  /**
   * Crea un nuevo registro en la planilla.
   *
   * @param createPlanillaDto - Datos del DTO
   * @param userId - ID del usuario creador
   */
  async create(
    createPlanillaDto: CreatePlanillaDto,
    userId: number,
  ): Promise<Planilla> {
    const { idTorneo, idEquipo, idJugador, numeroCamiseta, estado } =
      createPlanillaDto;

    // 1. Validar existencia de Usuario
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Validar existencia de Torneo
    const torneo = await this.torneosRepository.findOne({
      where: { id: idTorneo },
    });
    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${idTorneo} no encontrado`);
    }

    // 3. Validar existencia de Equipo
    const equipo = await this.equiposRepository.findOne({
      where: { id: idEquipo },
    });
    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${idEquipo} no encontrado`);
    }

    // 4. Validar existencia de Jugador
    const jugador = await this.jugadoresRepository.findOne({
      where: { id: idJugador },
    });
    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${idJugador} no encontrado`);
    }

    // 5. Evitar duplicar al mismo jugador en cualquier equipo de este torneo de forma activa
    const existenteEnTorneo = await this.planillasRepository.findOne({
      where: {
        torneo: { id: idTorneo },
        jugador: { id: idJugador },
        estado: EstadoPlanilla.ACTIVO,
      },
      relations: {
        equipo: true,
      },
    });

    if (existenteEnTorneo) {
      throw new BadRequestException(
        `El jugador "${jugador.nombre} ${jugador.apellidos}" ya está registrado y activo en el torneo bajo el equipo "${existenteEnTorneo.equipo.nombre}".`,
      );
    }

    // 6. Validar que el número de camiseta no esté ya asignado en este equipo y torneo
    const existenteCamiseta = await this.planillasRepository.findOne({
      where: {
        torneo: { id: idTorneo },
        equipo: { id: idEquipo },
        numeroCamiseta,
      },
      relations: {
        jugador: true,
      },
    });

    if (existenteCamiseta) {
      throw new BadRequestException(
        `El número de camiseta ${numeroCamiseta} ya está asignado a "${existenteCamiseta.jugador.nombre} ${existenteCamiseta.jugador.apellidos}" en el equipo "${equipo.nombre}".`,
      );
    }

    // 7. Crear y guardar planilla
    const planilla = this.planillasRepository.create({
      user,
      torneo,
      equipo,
      jugador,
      numeroCamiseta,
      estado: estado || EstadoPlanilla.ACTIVO,
    });

    try {
      const guardada = await this.planillasRepository.save(planilla);
      return this.findOne(guardada.id);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new BadRequestException(
          'Ese número de camiseta ya fue asignado a otro jugador de este equipo, intenta con otro número.',
        );
      }
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de planillas.
   */
  async findAll(): Promise<Planilla[]> {
    const planillas = await this.planillasRepository.find({
      relations: {
        user: true,
        torneo: true,
        equipo: true,
        jugador: true,
      },
    });
    return planillas.map((p) => this.sanitizePlanilla(p));
  }

  /**
   * Busca un registro de planilla por su ID.
   */
  async findOne(id: number): Promise<Planilla> {
    const planilla = await this.planillasRepository.findOne({
      where: { id },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
        jugador: true,
      },
    });

    if (!planilla) {
      throw new NotFoundException(`Planilla con ID ${id} no encontrada`);
    }

    return this.sanitizePlanilla(planilla);
  }

  /**
   * Obtiene los registros de planilla para un torneo específico.
   */
  async findByTorneo(torneoId: number): Promise<Planilla[]> {
    const planillas = await this.planillasRepository.find({
      where: { torneo: { id: torneoId } },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
        jugador: true,
      },
    });
    return planillas.map((p) => this.sanitizePlanilla(p));
  }

  /**
   * Obtiene los registros de planilla para un equipo específico.
   */
  async findByEquipo(equipoId: number): Promise<Planilla[]> {
    const planillas = await this.planillasRepository.find({
      where: { equipo: { id: equipoId } },
      relations: {
        user: true,
        torneo: true,
        equipo: true,
        jugador: true,
      },
    });
    return planillas.map((p) => this.sanitizePlanilla(p));
  }

  /**
   * Actualiza los datos de un registro de planilla.
   */
  async update(
    id: number,
    updatePlanillaDto: UpdatePlanillaDto,
  ): Promise<Planilla> {
    const planilla = await this.findOne(id);

    const { idTorneo, idEquipo, idJugador, numeroCamiseta, ...resto } =
      updatePlanillaDto;

    // Si se pasa un nuevo idTorneo
    if (idTorneo !== undefined) {
      const torneo = await this.torneosRepository.findOne({
        where: { id: idTorneo },
      });
      if (!torneo) {
        throw new NotFoundException(`Torneo con ID ${idTorneo} no encontrado`);
      }
      planilla.torneo = torneo;
    }

    // Si se pasa un nuevo idEquipo
    if (idEquipo !== undefined) {
      const equipo = await this.equiposRepository.findOne({
        where: { id: idEquipo },
      });
      if (!equipo) {
        throw new NotFoundException(`Equipo con ID ${idEquipo} no encontrado`);
      }
      planilla.equipo = equipo;
    }

    // Si se pasa un nuevo idJugador
    if (idJugador !== undefined) {
      const jugador = await this.jugadoresRepository.findOne({
        where: { id: idJugador },
      });
      if (!jugador) {
        throw new NotFoundException(
          `Jugador con ID ${idJugador} no encontrado`,
        );
      }
      planilla.jugador = jugador;
    }

    const checkTorneoId =
      idTorneo !== undefined ? idTorneo : planilla.torneo.id;
    const checkEquipoId =
      idEquipo !== undefined ? idEquipo : planilla.equipo.id;
    const checkJugadorId =
      idJugador !== undefined ? idJugador : planilla.jugador.id;
    const checkNumeroCamiseta =
      numeroCamiseta !== undefined ? numeroCamiseta : planilla.numeroCamiseta;

    // Verificar si el jugador ya está registrado de forma activa en cualquier otro equipo para este torneo
    const existenteEnTorneo = await this.planillasRepository.findOne({
      where: {
        torneo: { id: checkTorneoId },
        jugador: { id: checkJugadorId },
        estado: EstadoPlanilla.ACTIVO,
        id: Not(id),
      },
      relations: {
        equipo: true,
      },
    });

    if (existenteEnTorneo) {
      const jugadorNombre =
        idJugador !== undefined
          ? (
              await this.jugadoresRepository.findOne({
                where: { id: idJugador },
              })
            )?.nombre
          : planilla.jugador.nombre;
      const jugadorApellidos =
        idJugador !== undefined
          ? (
              await this.jugadoresRepository.findOne({
                where: { id: idJugador },
              })
            )?.apellidos
          : planilla.jugador.apellidos;
      throw new BadRequestException(
        `El jugador "${jugadorNombre} ${jugadorApellidos}" ya está registrado y activo en el torneo bajo el equipo "${existenteEnTorneo.equipo.nombre}".`,
      );
    }

    // Validar si el número de camiseta ya está ocupado en el equipo y torneo por otra planilla
    if (
      numeroCamiseta !== undefined ||
      idEquipo !== undefined ||
      idTorneo !== undefined
    ) {
      const existenteCamiseta = await this.planillasRepository.findOne({
        where: {
          torneo: { id: checkTorneoId },
          equipo: { id: checkEquipoId },
          numeroCamiseta: checkNumeroCamiseta,
          id: Not(id),
        },
        relations: {
          jugador: true,
        },
      });

      if (existenteCamiseta) {
        throw new BadRequestException(
          `El número de camiseta ${checkNumeroCamiseta} ya está asignado a "${existenteCamiseta.jugador.nombre} ${existenteCamiseta.jugador.apellidos}" en el equipo "${planilla.equipo.nombre}".`,
        );
      }
    }

    const planillaActualizada = this.planillasRepository.merge(planilla, {
      ...resto,
      ...(numeroCamiseta !== undefined ? { numeroCamiseta } : {}),
    });

    try {
      await this.planillasRepository.save(planillaActualizada);
      return this.findOne(id);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new BadRequestException(
          'Ese número de camiseta ya fue asignado a otro jugador de este equipo, intenta con otro número.',
        );
      }
      throw error;
    }
  }

  /**
   * Elimina físicamente un registro de planilla.
   */
  async remove(id: number): Promise<void> {
    const planilla = await this.findOne(id);
    await this.planillasRepository.remove(planilla);
  }
}
