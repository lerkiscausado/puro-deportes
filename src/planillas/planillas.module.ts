import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Planilla } from './planilla.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Jugador } from '../jugadores/jugador.entity';
import { PlanillasService } from './planillas.service';
import { PlanillasController } from './planillas.controller';

/**
 * Módulo de planillas.
 * Encapsula la lógica de negocio, endpoints HTTP y configuración de TypeORM y JwtModule
 * para la administración de rosters de jugadores en equipos y torneos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Planilla, User, Torneo, Equipo, Jugador]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [PlanillasController],
  providers: [PlanillasService],
  exports: [PlanillasService],
})
export class PlanillasModule {}
