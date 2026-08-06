import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PartidosService } from './partidos.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Public } from '../users/decorators/public.decorator';

/**
 * Controlador de partidos.
 * Define los endpoints HTTP bajo la ruta /partidos.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partidos')
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  /**
   * Endpoint para registrar un nuevo partido.
   * Ruta: POST /partidos
   *
   * @param createPartidoDto - Datos del partido a crear
   * @param req - Objeto request con el payload del JWT
   * @returns El partido creado con todas sus relaciones
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(
    @Body() createPartidoDto: CreatePartidoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.partidosService.create(createPartidoDto, req.user.sub);
  }

  /**
   * Endpoint para obtener todos los partidos registrados.
   * Ruta: GET /partidos
   *
   * @returns Lista completa de partidos
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.partidosService.findAll();
  }

  /**
   * Endpoint para obtener los partidos del usuario autenticado.
   * Ruta: GET /partidos/mis-partidos
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Lista de partidos creados por el usuario autenticado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('mis-partidos')
  async findMyPartidos(@Req() req: RequestWithUser) {
    return this.partidosService.findByUser(req.user.sub);
  }

  /**
   * Endpoint público para obtener todos los partidos pertenecientes a un torneo específico.
   * Ruta: GET /partidos/torneo/:torneoId/public
   *
   * @param torneoId - ID del torneo
   * @returns Lista de partidos del torneo
   */
  @Public()
  @Get('torneo/:torneoId/public')
  async findPublicByTorneo(@Param('torneoId', ParseIntPipe) torneoId: number) {
    return this.partidosService.findPublicByTorneo(torneoId);
  }

  /**
   * Endpoint para obtener todos los partidos pertenecientes a un torneo específico.
   * Ruta: GET /partidos/torneo/:torneoId
   *
   * @param torneoId - ID del torneo
   * @returns Lista de partidos del torneo
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('torneo/:torneoId')
  async findByTorneo(@Param('torneoId', ParseIntPipe) torneoId: number) {
    return this.partidosService.findByTorneo(torneoId);
  }

  /**
   * Endpoint público para obtener la programación de partidos desde la fecha actual hacia adelante.
   * Ruta: GET /partidos/programacion
   *
   * @param page - Número de página opcional (ej: ?page=1)
   * @param limit - Límite de elementos por página opcional (ej: ?limit=10)
   */
  @Public()
  @Get('programacion')
  async findPublicProgramados(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.partidosService.findPublicProgramados(
      isNaN(pageNum as number) ? undefined : pageNum,
      isNaN(limitNum as number) ? undefined : limitNum,
    );
  }

  /**
   * Endpoint público para obtener los resultados de partidos finalizados.
   * Ruta: GET /partidos/resultados
   *
   * @param page - Número de página opcional (ej: ?page=1)
   * @param limit - Límite de elementos por página opcional (ej: ?limit=10)
   */
  @Public()
  @Get('resultados')
  async findPublicFinalizados(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.partidosService.findPublicFinalizados(
      isNaN(pageNum as number) ? undefined : pageNum,
      isNaN(limitNum as number) ? undefined : limitNum,
    );
  }

  /**
   * Endpoint para obtener un partido específico por su ID.
   * Ruta: GET /partidos/:id
   *
   * @param id - ID del partido
   * @returns El partido encontrado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partidosService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente un partido por su ID.
   * Ruta: PATCH /partidos/:id
   *
   * @param id - ID del partido a actualizar
   * @param updatePartidoDto - Nuevos datos del partido
   * @param req - Objeto request con el payload del JWT
   * @returns El partido modificado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartidoDto: UpdatePartidoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.partidosService.update(
      id,
      updatePartidoDto,
      req.user.sub,
      req.user.role,
    );
  }

  /**
   * Endpoint para eliminar un partido por su ID.
   * Ruta: DELETE /partidos/:id
   *
   * @param id - ID del partido a eliminar
   * @param req - Objeto request con el payload del JWT
   * @returns Mensaje de confirmación del partido eliminado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    await this.partidosService.remove(id, req.user.sub, req.user.role);
    return { message: 'Partido eliminado correctamente' };
  }
}
