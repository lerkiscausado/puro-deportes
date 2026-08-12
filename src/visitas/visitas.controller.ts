import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VisitasService } from './visitas.service';
import { RegistrarVisitaDto } from './dto/registrar-visita.dto';
import { Public } from '../users/decorators/public.decorator';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';

/**
 * Controlador de visitas.
 * Define los endpoints HTTP bajo la ruta /visitas.
 *
 * - POST /visitas/registrar: público, registra una visita (fire-and-forget).
 * - GET  /visitas/estadisticas: solo ADMIN, retorna estadísticas agregadas.
 */
@Controller('visitas')
export class VisitasController {
  constructor(private readonly visitasService: VisitasService) {}

  /**
   * Registra una visita a una página pública.
   * Ruta: POST /visitas/registrar
   *
   * - @Public(): no requiere autenticación JWT.
   * - Rate limiting estricto: 30 peticiones por minuto por IP.
   * - Respuesta inmediata (201) — el guardado se inicia en background para
   *   no bloquear al cliente.
   *
   * @param dto - DTO con la ruta visitada
   */
  @Public()
  @Throttle({ global: { limit: 30, ttl: 60000 } })
  @Post('registrar')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() dto: RegistrarVisitaDto): { ok: boolean } {
    // Fire-and-forget: lanzamos el guardado sin await para responder de inmediato.
    // El .catch(() => {}) evita que un fallo de BD (ej. conexión cerrada al
    // terminar tests) cause un UnhandledPromiseRejection que crashee el proceso.
    this.visitasService.registrar(dto.ruta).catch(() => {});
    return { ok: true };
  }

  /**
   * Retorna estadísticas agregadas de visitas.
   * Ruta: GET /visitas/estadisticas
   *
   * Acceso exclusivo para administradores (Role.ADMIN).
   * No accesible para managers ni usuarios regulares.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('estadisticas')
  async estadisticas() {
    return this.visitasService.obtenerEstadisticas();
  }
}
