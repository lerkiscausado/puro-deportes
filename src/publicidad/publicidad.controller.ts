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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PublicidadService } from './publicidad.service';
import { CreatePublicidadDto } from './dto/create-publicidad.dto';
import { UpdatePublicidadDto } from './dto/update-publicidad.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Public } from '../users/decorators/public.decorator';
import { getUploadsPath } from '../common/utils/uploads-path.util';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

/**
 * Configuración de almacenamiento para imágenes de publicidad.
 * El directorio de destino se resuelve dinámicamente a partir de la variable
 * de entorno UPLOADS_PATH (ver src/common/utils/uploads-path.util.ts).
 */
const storageConfig = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadsPath('publicidad'));
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `publicidad-${uniqueSuffix}${ext}`);
  },
});

/**
 * Opciones para el FileInterceptor de imagen de publicidad.
 */
const publicidadImagenInterceptorOptions = {
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
 * Controlador de publicidad.
 * Define los endpoints HTTP bajo la ruta /publicidad.
 *
 * Solo el rol ADMIN puede crear, editar y eliminar publicidades.
 * El endpoint vigente/public es público y no requiere autenticación.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('publicidad')
export class PublicidadController {
  constructor(private readonly publicidadService: PublicidadService) {}

  /**
   * Endpoint para crear un nuevo anuncio publicitario.
   * Ruta: POST /publicidad
   *
   * Únicamente accesible por Administrador.
   * La imagen es obligatoria (multipart/form-data, campo "imagen").
   */
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', publicidadImagenInterceptorOptions),
  )
  async create(
    @Body() createPublicidadDto: CreatePublicidadDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.publicidadService.create(
      createPublicidadDto,
      file,
      req.user.sub,
    );
  }

  /**
   * Endpoint para obtener todos los anuncios registrados.
   * Ruta: GET /publicidad
   *
   * Únicamente accesible por Administrador.
   */
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    return this.publicidadService.findAll();
  }

  /**
   * Endpoint público para obtener los anuncios vigentes.
   * Ruta: GET /publicidad/vigente/public
   *
   * No requiere autenticación. Retorna solo { id, imagen, link }.
   *
   * IMPORTANTE: Esta ruta debe declararse ANTES de ':id' para que NestJS
   * no interprete 'vigente' como un parámetro de ID.
   */
  @Public()
  @Get('vigente/public')
  async findVigentesPublic() {
    return this.publicidadService.findVigentesPublic();
  }

  /**
   * Endpoint para obtener un anuncio específico por su ID.
   * Ruta: GET /publicidad/:id
   *
   * Únicamente accesible por Administrador.
   */
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicidadService.findOne(id);
  }

  /**
   * Endpoint para actualizar parcialmente un anuncio por su ID.
   * Ruta: PATCH /publicidad/:id
   *
   * Únicamente accesible por Administrador.
   * La imagen es opcional en el update (multipart/form-data, campo "imagen").
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('imagen', publicidadImagenInterceptorOptions),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicidadDto: UpdatePublicidadDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.publicidadService.update(id, updatePublicidadDto, file);
  }

  /**
   * Endpoint para eliminar un anuncio por su ID.
   * Ruta: DELETE /publicidad/:id
   *
   * Únicamente accesible por Administrador.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.publicidadService.remove(id);
    return { message: 'Publicidad eliminada correctamente' };
  }
}
