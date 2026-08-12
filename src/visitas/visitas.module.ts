import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Visita } from './visita.entity';
import { VisitasService } from './visitas.service';
import { VisitasController } from './visitas.controller';

/**
 * Módulo de visitas.
 * Encapsula la lógica de registro y estadísticas de visitas a páginas públicas.
 *
 * - Registra la entidad Visita en TypeORM (tabla 'visitas' existente en BD).
 * - Configura JwtModule para que JwtAuthGuard del controlador pueda verificar tokens.
 * - Declara el controlador que expone los endpoints HTTP.
 * - Provee el servicio con la lógica de negocio.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Visita]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [VisitasController],
  providers: [VisitasService],
  exports: [VisitasService],
})
export class VisitasModule {}
