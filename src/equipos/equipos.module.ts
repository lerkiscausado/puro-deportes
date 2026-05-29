import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Equipo } from './equipo.entity';
import { EquiposService } from './equipos.service';
import { EquiposController } from './equipos.controller';
import { User } from '../users/user.entity';

/**
 * Módulo de Equipos.
 * Integra todos los componentes del módulo y los registra en TypeORM.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Equipo, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [EquiposController],
  providers: [EquiposService],
  exports: [EquiposService],
})
export class EquiposModule {}
