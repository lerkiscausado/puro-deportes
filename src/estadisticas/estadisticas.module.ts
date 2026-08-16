import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EstadisticaJugadorPartido } from './estadistica-jugador-partido.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { Partido } from '../partidos/partido.entity';
import { Equipo } from '../equipos/equipo.entity';
import { TipoEstadistica } from '../tipos-estadistica/tipo-estadistica.entity';
import { User } from '../users/user.entity';
import { Planilla } from '../planillas/planilla.entity';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';

/**
 * Módulo de estadísticas de jugadores por partido.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadisticaJugadorPartido,
      Jugador,
      Partido,
      Equipo,
      TipoEstadistica,
      User,
      Planilla,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService, TypeOrmModule],
})
export class EstadisticasModule {}
