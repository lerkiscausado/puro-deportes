import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { EstadisticasService } from './estadisticas.service';
import { RegistrarEstadisticaDto } from './dto/registrar-estadistica.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Public } from '../users/decorators/public.decorator';

/**
 * Controlador de estadísticas de jugadores por partido.
 * Permite registrar, eliminar y consultar estadísticas deportivas individuales y de torneo.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  /**
   * Registra o actualiza la estadística de un jugador en un partido.
   * Ruta: POST /estadisticas
   * Roles permitidos: ADMIN, MANAGER.
   *
   * @param req - Objeto request con payload JWT del usuario autenticado
   * @param dto - DTO con datos de la estadística
   * @returns Registro guardado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async registrar(
    @Req() req: RequestWithUser,
    @Body() dto: RegistrarEstadisticaDto,
  ) {
    return this.estadisticasService.registrar(req.user.sub, dto);
  }

  /**
   * Elimina un registro de estadística por ID.
   * Ruta: DELETE /estadisticas/:id
   * Roles permitidos: ADMIN, MANAGER.
   *
   * @param id - ID de la estadística a eliminar
   * @returns Mensaje de confirmación
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.estadisticasService.eliminar(id);
  }

  /**
   * Retorna las estadísticas de un partido específico agrupadas por jugador.
   * Ruta: GET /estadisticas/partido/:partidoId
   * Acceso público.
   *
   * @param partidoId - ID del partido
   * @returns Lista de jugadores con sus estadísticas y total de puntos
   */
  @Public()
  @Get('partido/:partidoId')
  async porPartido(@Param('partidoId', ParseIntPipe) partidoId: number) {
    return this.estadisticasService.porPartido(partidoId);
  }

  /**
   * Retorna la tabla de líderes de un torneo (top 20), con filtro opcional por tipo de estadística.
   * Ruta: GET /estadisticas/torneo/:torneoId/lideres?tipoEstadisticaId=
   * Acceso público.
   *
   * @param torneoId - ID del torneo
   * @param tipoEstadisticaId - ID opcional de tipo de estadística
   * @returns Lista de jugadores líderes
   */
  @Public()
  @Get('torneo/:torneoId/lideres')
  async lideresPorTorneo(
    @Param('torneoId', ParseIntPipe) torneoId: number,
    @Query('tipoEstadisticaId') tipoEstadisticaId?: string,
  ) {
    const tipoIdNum = tipoEstadisticaId ? parseInt(tipoEstadisticaId, 10) : undefined;
    return this.estadisticasService.lideresPorTorneo(torneoId, tipoIdNum);
  }

  /**
   * Retorna las estadísticas acumuladas históricas de un jugador.
   * Ruta: GET /estadisticas/jugador/:jugadorId/global
   * Acceso público.
   *
   * @param jugadorId - ID del jugador
   * @returns Estadísticas globales del jugador
   */
  @Public()
  @Get('jugador/:jugadorId/global')
  async globalPorJugador(@Param('jugadorId', ParseIntPipe) jugadorId: number) {
    return this.estadisticasService.globalPorJugador(jugadorId);
  }
}
