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
import { PartidoPeriodosService } from './partidoperiodos.service';
import { CreatePartidoPeriodoDto } from './dto/create-partidoperiodo.dto';
import { UpdatePartidoPeriodoDto } from './dto/update-partidoperiodo.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partidoperiodos')
export class PartidoPeriodosController {
  constructor(private readonly service: PartidoPeriodosService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(
    @Body() createDto: CreatePartidoPeriodoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.create(createDto, req.user.sub);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('partido/:partidoId')
  async findByPartido(@Param('partidoId', ParseIntPipe) partidoId: number) {
    return this.service.findByPartido(partidoId);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePartidoPeriodoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.update(id, updateDto, req.user.sub, req.user.role);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    await this.service.remove(id, req.user.sub, req.user.role);
    return { message: 'Periodo de partido eliminado correctamente' };
  }
}
