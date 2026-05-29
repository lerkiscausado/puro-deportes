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
import type { Request } from 'express';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

/**
 * Controlador de equipos.
 * Define los endpoints HTTP bajo la ruta /equipos.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 * Los guards se aplican a nivel de controlador para asegurar que
 * cada endpoint requiera un token válido y el rol adecuado.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  /**
   * Endpoint para registrar un nuevo equipo deportivo.
   * Ruta: POST /equipos
   *
   * @param createEquipoDto - Datos del equipo a crear
   * @param req - Objeto request con el payload del JWT
   * @returns El equipo creado con la relación a su usuario
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Post()
  async create(@Body() createEquipoDto: CreateEquipoDto, @Req() req: Request) {
    // req['user'].sub contiene el ID del usuario extraído del token JWT
    return this.equiposService.create(createEquipoDto, req['user'].sub);
  }

  /**
   * Endpoint para obtener todos los equipos registrados.
   * Ruta: GET /equipos
   *
   * @returns Lista completa de equipos
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.equiposService.findAll();
  }

  /**
   * Endpoint para obtener los equipos del usuario autenticado.
   * Ruta: GET /equipos/mis-equipos
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Lista de equipos del usuario autenticado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('mis-equipos')
  async findMyEquipos(@Req() req: Request) {
    return this.equiposService.findByUser(req['user'].sub);
  }

  /**
   * Endpoint para obtener un equipo específico por su ID.
   * Ruta: GET /equipos/:id
   *
   * @param id - ID del equipo (validado como número entero)
   * @returns El equipo encontrado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente un equipo por su ID.
   * Ruta: PATCH /equipos/:id
   *
   * @param id - ID del equipo a actualizar
   * @param updateEquipoDto - Nuevos datos del equipo
   * @param req - Objeto request con el payload del JWT
   * @returns El equipo modificado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoDto: UpdateEquipoDto,
    @Req() req: Request,
  ) {
    return this.equiposService.update(
      id,
      updateEquipoDto,
      req['user'].sub,
      req['user'].role,
    );
  }

  /**
   * Endpoint para eliminar un equipo por su ID.
   * Ruta: DELETE /equipos/:id
   *
   * @param id - ID del equipo a eliminar
   * @param req - Objeto request con el payload del JWT
   * @returns Mensaje de confirmación del equipo eliminado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.equiposService.remove(id, req['user'].sub, req['user'].role);
    return { message: 'Equipo eliminado correctamente' };
  }
}
