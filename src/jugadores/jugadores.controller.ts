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
  UseGuards,
} from '@nestjs/common';
import { JugadoresService } from './jugadores.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

/**
 * Controlador de jugadores.
 * Define los endpoints HTTP bajo la ruta /jugadores.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly jugadoresService: JugadoresService) {}

  /**
   * Endpoint para registrar un nuevo jugador.
   * Ruta: POST /jugadores
   *
   * @param createJugadorDto - Datos del jugador a registrar
   * @returns El jugador creado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(@Body() createJugadorDto: CreateJugadorDto) {
    return this.jugadoresService.create(createJugadorDto);
  }

  /**
   * Endpoint para obtener todos los jugadores registrados con soporte para paginación y filtros.
   * Ruta: GET /jugadores
   *
   * @param page - Número de página (opcional)
   * @param limit - Cantidad de jugadores por página (opcional)
   * @param search - Término de búsqueda por nombre, apellidos o identificación (opcional)
   * @param gender - Género a filtrar (opcional)
   * @returns Lista completa o paginada de jugadores
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('gender') gender?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.jugadoresService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      gender,
    });
  }

  /**
   * Endpoint para obtener un jugador específico por su ID.
   * Ruta: GET /jugadores/:id
   *
   * @param id - ID del jugador (validado como número entero)
   * @returns El jugador encontrado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente los datos de un jugador por su ID.
   * Ruta: PATCH /jugadores/:id
   *
   * @param id - ID del jugador a actualizar
   * @param updateJugadorDto - Nuevos datos del jugador
   * @returns El jugador modificado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJugadorDto: UpdateJugadorDto,
  ) {
    return this.jugadoresService.update(id, updateJugadorDto);
  }

  /**
   * Endpoint para eliminar un jugador por su ID.
   * Ruta: DELETE /jugadores/:id
   *
   * @param id - ID del jugador a eliminar
   * @returns Mensaje de confirmación del jugador eliminado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.jugadoresService.remove(id);
    return { message: 'Jugador eliminado correctamente' };
  }
}
