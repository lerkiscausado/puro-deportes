import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TiposEstadisticaService } from './tipos-estadistica.service';
import { Deporte } from '../torneos/enums/deporte.enum';
import { Public } from '../users/decorators/public.decorator';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';

/**
 * Controlador de tipos de estadística.
 * Expone endpoints públicos para consultar el catálogo de estadísticas por deporte.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tipos-estadistica')
export class TiposEstadisticaController {
  constructor(
    private readonly tiposEstadisticaService: TiposEstadisticaService,
  ) {}

  /**
   * Obtiene todos los tipos de estadística para un deporte específico.
   * Catálogo de acceso público.
   * Ruta: GET /tipos-estadistica/deporte/:deporte
   *
   * @param deporte - Nombre del deporte (ej: Futbol, Baloncesto, etc.)
   * @returns Lista de tipos de estadística del deporte
   */
  @Public()
  @Get('deporte/:deporte')
  async findByDeporte(@Param('deporte') deporte: Deporte) {
    return this.tiposEstadisticaService.findByDeporte(deporte);
  }
}
