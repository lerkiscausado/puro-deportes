import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Public } from '../users/decorators/public.decorator';

/**
 * Controlador de inscripciones.
 * Define los endpoints HTTP bajo la ruta /inscripciones.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  /**
   * Endpoint para registrar la participación de un equipo en un torneo.
   * Ruta: POST /inscripciones
   *
   * @param createInscripcionDto - Datos de la inscripción a crear
   * @param req - Objeto request con el payload del JWT
   * @returns La inscripción creada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Post()
  async create(
    @Body() createInscripcionDto: CreateInscripcionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.inscripcionesService.create(createInscripcionDto, req.user.sub);
  }

  /**
   * Endpoint para obtener todas las inscripciones registradas.
   * Ruta: GET /inscripciones
   *
   * @returns Lista de todas las inscripciones
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.inscripcionesService.findAll();
  }

  /**
   * Endpoint para obtener las inscripciones del usuario autenticado.
   * Ruta: GET /inscripciones/mis-inscripciones
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Lista de inscripciones creadas por el usuario autenticado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('mis-inscripciones')
  async findMyInscripciones(@Req() req: RequestWithUser) {
    return this.inscripcionesService.findByUser(req.user.sub);
  }

  /**
   * Endpoint público para obtener las inscripciones y tabla de posiciones de un torneo.
   * Ruta: GET /inscripciones/torneo/:torneoId/public
   *
   * @param torneoId - ID del torneo
   * @returns Lista de inscripciones ordenadas por puntos y diferencia sin datos de contacto
   */
  @Public()
  @Get('torneo/:torneoId/public')
  async findPublicByTorneo(@Param('torneoId', ParseIntPipe) torneoId: number) {
    return this.inscripcionesService.findPublicByTorneo(torneoId);
  }

  /**
   * Endpoint para obtener todas las inscripciones activas de un torneo específico.
   * Ruta: GET /inscripciones/torneo/:torneoId
   *
   * @param torneoId - ID del torneo
   * @returns Lista de inscripciones de equipos activos en el torneo
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('torneo/:torneoId')
  async findByTorneo(@Param('torneoId', ParseIntPipe) torneoId: number) {
    return this.inscripcionesService.findByTorneo(torneoId);
  }

  /**
   * Endpoint para obtener una inscripción específica por su ID.
   * Ruta: GET /inscripciones/:id
   *
   * @param id - ID de la inscripción
   * @returns La inscripción encontrada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.findOne(id);
  }

  /**
   * Endpoint para actualizar las estadísticas o el estado de una inscripción por su ID.
   * Ruta: PATCH /inscripciones/:id
   *
   * @param id - ID de la inscripción a actualizar
   * @param updateInscripcionDto - Nuevos datos o estadísticas de la inscripción
   * @param req - Objeto request con el payload del JWT
   * @returns La inscripción modificada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscripcionDto: UpdateInscripcionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.inscripcionesService.update(
      id,
      updateInscripcionDto,
      req.user.sub,
      req.user.role,
    );
  }

  /**
   * Endpoint para eliminar de forma lógica una inscripción por su ID (marca su estado como 'Eliminado').
   * Ruta: DELETE /inscripciones/:id
   *
   * @param id - ID de la inscripción a eliminar
   * @param req - Objeto request con el payload del JWT
   * @returns Mensaje de confirmación de la eliminación
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    await this.inscripcionesService.remove(id, req.user.sub, req.user.role);
    return { message: 'Inscripción eliminada correctamente' };
  }
}
