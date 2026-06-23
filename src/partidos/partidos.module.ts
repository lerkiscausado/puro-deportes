import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Partido } from './partido.entity';
import { PartidosService } from './partidos.service';
import { PartidosController } from './partidos.controller';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { Inscripcion } from '../inscripciones/inscripcion.entity';

/**
 * Módulo de Partidos.
 * Integra todos los componentes del módulo y los registra en TypeORM.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Partido, User, Torneo, Equipo, Escenario, Inscripcion]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [PartidosController],
  providers: [PartidosService],
  exports: [PartidosService],
})
export class PartidosModule {}
