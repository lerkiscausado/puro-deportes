import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { FavoritosService } from './favoritos.service';
import { CreateFavoritoDto } from './dto/create-favorito.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';

/**
 * Controlador de favoritos.
 * Define los endpoints HTTP bajo la ruta /favoritos.
 *
 * Protegido solo con JwtAuthGuard — SIN RolesGuard ni @Roles.
 * Cualquier usuario autenticado (admin, manager o user/seguidor)
 * puede gestionar su propia lista de favoritos.
 */
@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  /**
   * Agrega un torneo a la lista de favoritos del usuario autenticado.
   * Ruta: POST /favoritos
   *
   * Rate limiting: 20 peticiones por minuto por IP para evitar abuso masivo.
   *
   * @param req - Objeto request con el payload del JWT
   * @param createFavoritoDto - DTO con el torneoId a marcar como favorito
   * @returns Mensaje de confirmación e id del favorito creado
   */
  @Throttle({ global: { limit: 20, ttl: 60000 } })
  @Post()
  async agregar(
    @Req() req: RequestWithUser,
    @Body() createFavoritoDto: CreateFavoritoDto,
  ) {
    return this.favoritosService.agregar(
      req.user.sub,
      createFavoritoDto.torneoId,
    );
  }

  /**
   * Retorna todos los torneos favoritos del usuario autenticado.
   * Ruta: GET /favoritos/mis-favoritos
   *
   * @param req - Objeto request con el payload del JWT
   * @returns Array de torneos con campo adicional `favoritoDesde`
   */
  @Get('mis-favoritos')
  async misFavoritos(@Req() req: RequestWithUser) {
    return this.favoritosService.misFavoritos(req.user.sub);
  }

  /**
   * Elimina un torneo de la lista de favoritos del usuario autenticado.
   * Ruta: DELETE /favoritos/:torneoId
   *
   * @param req - Objeto request con el payload del JWT
   * @param torneoId - ID del torneo a eliminar de favoritos (validado como entero)
   * @returns Mensaje de confirmación
   */
  @Delete(':torneoId')
  async eliminar(
    @Req() req: RequestWithUser,
    @Param('torneoId', ParseIntPipe) torneoId: number,
  ) {
    await this.favoritosService.eliminar(req.user.sub, torneoId);
    return { message: 'Torneo eliminado de favoritos correctamente' };
  }
}
