import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { TorneosService } from './torneos.service';
import { CreateTorneoDto } from './dto/create-torneo.dto';
import { UpdateTorneoDto } from './dto/update-torneo.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Public } from '../users/decorators/public.decorator';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Configuración de almacenamiento para archivos subidos.
 * El directorio de destino se resuelve dinámicamente a partir de la variable
 * de entorno UPLOADS_PATH (ver src/common/utils/uploads-path.util.ts).
 */
const storageConfig = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadsPath('torneos'));
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Controlador de torneos.
 * Define los endpoints HTTP bajo la ruta /torneos.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 * Los guards se aplican a nivel de controlador para asegurar que
 * cada endpoint requiera un token válido y el rol adecuado.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('torneos')
export class TorneosController {
  constructor(private readonly torneosService: TorneosService) {}

  /**
   * Endpoint para crear un nuevo torneo.
   * Ruta: POST /torneos
   *
   * Roles permitidos: admin, manager.
   * Acepta archivos multipart/form-data para foto y reglamento (PDF).
   *
   * @param createTorneoDto - Datos del torneo validados
   * @param files - Archivos subidos (foto y reglamento)
   * @param req - Objeto request con el payload del JWT
   * @returns El torneo creado con la relación al usuario
   */
  @Roles(Role.USER, Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'foto', maxCount: 1 },
        { name: 'reglamento', maxCount: 1 },
      ],
      {
        storage: storageConfig,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo por archivo
      },
    ),
  )
  async create(
    @Body() createTorneoDto: CreateTorneoDto,
    @UploadedFiles()
    files: { foto?: Express.Multer.File[]; reglamento?: Express.Multer.File[] },
    @Req() req: RequestWithUser,
  ) {
    // req.user.sub contiene el ID del usuario extraído del token JWT
    return this.torneosService.create(createTorneoDto, req.user.sub, files);
  }

  /**
   * Endpoint para obtener todos los torneos.
   * Ruta: GET /torneos
   *
   * Roles permitidos: admin, manager, user.
   *
   * @returns Lista de todos los torneos registrados
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.torneosService.findAll();
  }

  /**
   * Endpoint público para obtener los torneos agrupados por deporte y rama.
   * Ruta: GET /torneos/public
   *
   * @returns Torneos no finalizados agrupados
   */
  @Public()
  @Get('public')
  async findPublicGrouped() {
    return this.torneosService.findPublicGrouped();
  }

  /**
   * Endpoint para obtener los torneos del usuario autenticado.
   * Ruta: GET /torneos/mis-torneos
   *
   * Roles permitidos: admin, manager, user.
   * Retorna solo los torneos creados por el usuario autenticado.
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Lista de torneos del usuario autenticado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('mis-torneos')
  async findMyTorneos(@Req() req: RequestWithUser) {
    return this.torneosService.findByUser(req.user.sub);
  }

  /**
   * Endpoint para obtener un torneo específico por su ID.
   * Ruta: GET /torneos/:id
   *
   * Roles permitidos: admin, manager, user.
   *
   * @param id - ID del torneo (validado como número entero)
   * @returns El torneo encontrado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.torneosService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente un torneo por su ID.
   * Ruta: PATCH /torneos/:id
   *
   * Roles permitidos: admin, manager, user.
   * La lógica interna restringe la edición al dueño (creador) o al admin.
   *
   * @param id - ID del torneo a actualizar
   * @param updateTorneoDto - Nuevos datos del torneo
   * @param req - Objeto request con el payload del JWT
   * @returns El torneo modificado
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTorneoDto: UpdateTorneoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.torneosService.update(
      id,
      updateTorneoDto,
      req.user.sub,
      req.user.role,
    );
  }
}
