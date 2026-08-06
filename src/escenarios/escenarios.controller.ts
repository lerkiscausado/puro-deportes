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
import { EscenariosService } from './escenarios.service';
import { CreateEscenarioDto } from './dto/create-escenario.dto';
import { UpdateEscenarioDto } from './dto/update-escenario.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

/**
 * Controlador de escenarios.
 * Define los endpoints HTTP bajo la ruta /escenarios.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 * Los guards se aplican a nivel de controlador para asegurar que
 * cada endpoint requiera un token válido y el rol adecuado.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escenarios')
export class EscenariosController {
  constructor(private readonly escenariosService: EscenariosService) {}

  /**
   * Endpoint para registrar un nuevo escenario deportivo.
   * Ruta: POST /escenarios
   *
   * @param createEscenarioDto - Datos del escenario a crear
   * @param req - Objeto request con el payload del JWT
   * @returns El escenario creado con la relación a su usuario
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(
    @Body() createEscenarioDto: CreateEscenarioDto,
    @Req() req: RequestWithUser,
  ) {
    // req.user.sub contiene el ID del usuario extraído del token JWT
    return this.escenariosService.create(createEscenarioDto, req.user.sub);
  }

  /**
   * Endpoint para obtener todos los escenarios registrados.
   * Ruta: GET /escenarios
   *
   * @returns Lista completa de escenarios
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.escenariosService.findAll();
  }

  /**
   * Endpoint para obtener los escenarios del usuario autenticado.
   * Ruta: GET /escenarios/mis-escenarios
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Lista de escenarios del usuario autenticado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('mis-escenarios')
  async findMyEscenarios(@Req() req: RequestWithUser) {
    return this.escenariosService.findByUser(req.user.sub);
  }

  /**
   * Endpoint para obtener un escenario específico por su ID.
   * Ruta: GET /escenarios/:id
   *
   * @param id - ID del escenario (validado como número entero)
   * @returns El escenario encontrado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.escenariosService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente un escenario por su ID.
   * Ruta: PATCH /escenarios/:id
   *
   * @param id - ID del escenario a actualizar
   * @param updateEscenarioDto - Nuevos datos del escenario
   * @param req - Objeto request con el payload del JWT
   * @returns El escenario modificado
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEscenarioDto: UpdateEscenarioDto,
    @Req() req: RequestWithUser,
  ) {
    return this.escenariosService.update(
      id,
      updateEscenarioDto,
      req.user.sub,
      req.user.role,
    );
  }

  /**
   * Endpoint para eliminar un escenario por su ID.
   * Ruta: DELETE /escenarios/:id
   *
   * @param id - ID del escenario a eliminar
   * @param req - Objeto request con el payload del JWT
   * @returns Mensaje de confirmación del escenario eliminado
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    await this.escenariosService.remove(id, req.user.sub, req.user.role);
    return { message: 'Escenario eliminado correctamente' };
  }
}
