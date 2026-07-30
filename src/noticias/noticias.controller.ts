import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Configuración de almacenamiento para fotos de noticias.
 * El directorio de destino se resuelve dinámicamente a partir de la variable
 * de entorno UPLOADS_PATH (ver src/common/utils/uploads-path.util.ts).
 */
const storageConfig = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadsPath('noticias'));
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `noticia-${uniqueSuffix}${ext}`);
  },
});

/**
 * Controlador de noticias.
 * Define los endpoints HTTP bajo la ruta /noticias.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  /**
   * Endpoint para registrar una nueva noticia.
   * Ruta: POST /noticias
   *
   * Únicamente accesible por Administrador.
   * Acepta subida de archivo para el campo "foto".
   */
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: storageConfig,
      fileFilter: (_req, file, callback) => {
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
    }),
  )
  async create(
    @Body() createNoticiaDto: CreateNoticiaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.noticiasService.create(createNoticiaDto, file?.filename);
  }

  /**
   * Endpoint para obtener todas las noticias registradas.
   * Ruta: GET /noticias
   *
   * Roles permitidos: admin, manager, user.
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get()
  async findAll() {
    return this.noticiasService.findAll();
  }

  /**
   * Endpoint para obtener una noticia específica por su ID.
   * Ruta: GET /noticias/:id
   *
   * Roles permitidos: admin, manager, user.
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticiasService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente una noticia por su ID.
   * Ruta: PATCH /noticias/:id
   *
   * Únicamente accesible por Administrador.
   * Acepta subida de archivo para el campo "foto".
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: storageConfig,
      fileFilter: (_req, file, callback) => {
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
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticiaDto: UpdateNoticiaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.noticiasService.update(id, updateNoticiaDto, file?.filename);
  }

  /**
   * Endpoint para eliminar una noticia por su ID.
   * Ruta: DELETE /noticias/:id
   *
   * Únicamente accesible por Administrador.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.noticiasService.remove(id);
    return { message: 'Noticia eliminada correctamente' };
  }
}
