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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Configuración de almacenamiento para fotos/escudos de equipos.
 * El directorio de destino se resuelve dinámicamente a partir de la variable
 * de entorno UPLOADS_PATH (ver src/common/utils/uploads-path.util.ts).
 */
const storageConfig = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadsPath('equipos'));
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Opciones para el FileInterceptor de foto de equipo.
 */
const equipoFotoInterceptorOptions = {
  storage: storageConfig,
  fileFilter: (_req: any, file: Express.Multer.File, callback: any) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return callback(
        new BadRequestException(
          'Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp).',
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
};

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
   * Acepta subida multipart/form-data para el archivo del campo "foto".
   *
   * @param createEquipoDto - Datos del equipo a crear
   * @param req - Objeto request con el payload del JWT
   * @param file - Archivo de imagen subido (opcional)
   * @returns El equipo creado con la relación a su usuario
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Post()
  @UseInterceptors(FileInterceptor('foto', equipoFotoInterceptorOptions))
  async create(
    @Body() createEquipoDto: CreateEquipoDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // req.user.sub contiene el ID del usuario extraído del token JWT
    return this.equiposService.create(createEquipoDto, req.user.sub, file);
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
  async findMyEquipos(@Req() req: RequestWithUser) {
    return this.equiposService.findByUser(req.user.sub);
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
   * Acepta subida multipart/form-data para actualizar el archivo del campo "foto".
   *
   * @param id - ID del equipo a actualizar
   * @param updateEquipoDto - Nuevos datos del equipo
   * @param req - Objeto request con el payload del JWT
   * @param file - Archivo de imagen subido si se reemplaza la foto (opcional)
   * @returns El equipo modificado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto', equipoFotoInterceptorOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoDto: UpdateEquipoDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.equiposService.update(
      id,
      updateEquipoDto,
      req.user.sub,
      req.user.role,
      file,
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
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    await this.equiposService.remove(id, req.user.sub, req.user.role);
    return { message: 'Equipo eliminado correctamente' };
  }
}
