import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Torneo } from './torneo.entity';
import { CreateTorneoDto } from './dto/create-torneo.dto';
import { UpdateTorneoDto } from './dto/update-torneo.dto';
import { User } from '../users/user.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { EstadoTorneo } from './enums/estado-torneo.enum';
import { Role } from '../users/enums/role.enum';

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

    /** Repositorio de TypeORM para buscar escenarios relacionados */
    @InjectRepository(Escenario)
    private readonly escenariosRepository: Repository<Escenario>,
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

    const { idEscenario, ...torneoData } = createTorneoDto;

    // Buscar y validar el escenario si se provee
    let escenario: Escenario | undefined = undefined;
    if (idEscenario) {
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

    // Crea la instancia del torneo con los datos y archivos
    const torneo = this.torneosRepository.create({
      ...torneoData,
      estado: EstadoTorneo.INSCRIPCIONES,
      foto: files?.foto?.[0]?.filename,
      reglamento: files?.reglamento?.[0]?.filename,
      user,
      escenario,
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

  /**
   * Actualiza un torneo existente.
   * Permite actualizar únicamente el nombre y el estado, siempre y cuando
   * el estado actual del torneo sea diferente a 'Finalizado'.
   *
   * @param id - ID del torneo a actualizar
   * @param updateTorneoDto - Campos a modificar (name y/o estado)
   * @param userId - ID del usuario solicitante
   * @param userRole - Rol del usuario solicitante
   * @returns El torneo actualizado
   */
  async update(
    id: number,
    updateTorneoDto: UpdateTorneoDto,
    userId: number,
    userRole: Role,
  ): Promise<Torneo> {
    const torneo = await this.findOne(id);

    // Permite la edición si es el dueño (creador) del torneo o si es Administrador
    if (torneo.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este torneo.',
      );
    }

    // Valida que el estado actual no sea 'Finalizado'
    if (torneo.estado === EstadoTorneo.FINALIZADO) {
      throw new BadRequestException(
        'No se puede actualizar un torneo que ya está Finalizado.',
      );
    }

    // Mezcla las propiedades actualizadas
    const torneoActualizado = this.torneosRepository.merge(
      torneo,
      updateTorneoDto,
    );

    return this.torneosRepository.save(torneoActualizado);
  }

  /**
   * Obtiene todos los torneos que no estén finalizados agrupados por deporte y rama.
   * Estructura de retorno requerida:
   * deportes:
   *   baloncesto:
   *     masculino: [...]
   *     femenino: [...]
   *   futbol:
   *     masculino: [...]
   *     femenino: [...]
   *   volibol:
   *     masculino: [...]
   *     femenino: [...]
   *     mixto: [...]
   */
  async findPublicGrouped(): Promise<any> {
    const torneos = await this.torneosRepository.find({
      where: {
        estado: Not(EstadoTorneo.FINALIZADO),
      },
    });

    // Estructura base requerida pre-inicializada
    const result: any = {
      deportes: {
        baloncesto: {
          masculino: [],
          femenino: [],
        },
        futbol: {
          masculino: [],
          femenino: [],
        },
        volibol: {
          masculino: [],
          femenino: [],
          mixto: [],
        },
      },
    };

    // Mapeo de enums a las claves correspondientes en la respuesta
    const sportKeyMap: Record<string, string> = {
      'Baloncesto': 'baloncesto',
      'Futbol': 'futbol',
      'Voleibol': 'volibol',
      'Microfutbol': 'microfutbol',
      'Golito': 'golito',
    };

    const ramaKeyMap: Record<string, string> = {
      'Masculino': 'masculino',
      'Femenino': 'femenino',
      'Mixto': 'mixto',
    };

    for (const torneo of torneos) {
      const sportKey = sportKeyMap[torneo.deporte];
      const ramaKey = ramaKeyMap[torneo.rama];

      if (sportKey && ramaKey) {
        // Inicializar dinámicamente si no existe la clave del deporte (ej. microfutbol/golito)
        if (!result.deportes[sportKey]) {
          result.deportes[sportKey] = {};
        }
        // Inicializar dinámicamente si no existe la categoría del género
        if (!result.deportes[sportKey][ramaKey]) {
          result.deportes[sportKey][ramaKey] = [];
        }

        result.deportes[sportKey][ramaKey].push(torneo);
      }
    }

    return result;
  }
}
