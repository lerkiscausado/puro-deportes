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
import { PlanillasService } from './planillas.service';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

/**
 * Controlador de planillas.
 * Define los endpoints HTTP bajo la ruta /planillas.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planillas')
export class PlanillasController {
  constructor(private readonly planillasService: PlanillasService) {}

  /**
   * Endpoint para registrar un jugador en la planilla.
   * Ruta: POST /planillas
   *
   * @param createPlanillaDto - Datos de la planilla a registrar
   * @param req - Objeto request con el payload del JWT
   * @returns La planilla creada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Post()
  async create(
    @Body() createPlanillaDto: CreatePlanillaDto,
    @Req() req: RequestWithUser,
  ) {
    return this.planillasService.create(createPlanillaDto, req.user.sub);
  }

  /**
   * Endpoint para obtener todos los registros de planillas.
   * Ruta: GET /planillas
   *
   * @returns Lista de todas las planillas
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.planillasService.findAll();
  }

  /**
   * Endpoint para obtener un registro de planilla específico por su ID.
   * Ruta: GET /planillas/:id
   *
   * @param id - ID de la planilla
   * @returns La planilla encontrada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planillasService.findOne(id);
  }

  /**
   * Endpoint para obtener todos los registros de planilla de un torneo específico.
   * Ruta: GET /planillas/torneo/:torneoId
   *
   * @param torneoId - ID del torneo
   * @returns Lista de planillas del torneo
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('torneo/:torneoId')
  async findByTorneo(@Param('torneoId', ParseIntPipe) torneoId: number) {
    return this.planillasService.findByTorneo(torneoId);
  }

  /**
   * Endpoint para obtener todos los registros de planilla de un equipo específico.
   * Ruta: GET /planillas/equipo/:equipoId
   *
   * @param equipoId - ID del equipo
   * @returns Lista de planillas del equipo
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('equipo/:equipoId')
  async findByEquipo(@Param('equipoId', ParseIntPipe) equipoId: number) {
    return this.planillasService.findByEquipo(equipoId);
  }

  /**
   * Endpoint para actualizar un registro de planilla por su ID.
   * Ruta: PATCH /planillas/:id
   *
   * @param id - ID de la planilla a actualizar
   * @param updatePlanillaDto - Campos modificados
   * @returns La planilla modificada
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanillaDto: UpdatePlanillaDto,
  ) {
    return this.planillasService.update(id, updatePlanillaDto);
  }

  /**
   * Endpoint para eliminar físicamente un registro de planilla.
   * Ruta: DELETE /planillas/:id
   *
   * @param id - ID de la planilla a eliminar
   * @returns Mensaje de confirmación
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.planillasService.remove(id);
    return { message: 'Planilla eliminada correctamente' };
  }
}
