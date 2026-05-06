import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Torneo } from './torneo.entity';
import { User } from '../users/user.entity';
import { TorneosService } from './torneos.service';
import { TorneosController } from './torneos.controller';

/**
 * Módulo de torneos.
 * Encapsula toda la funcionalidad relacionada con torneos:
 * - Registra las entidades Torneo y User en TypeORM para acceso a la base de datos.
 * - Configura JwtModule para la verificación de tokens en los guards.
 * - Declara el controlador que expone los endpoints HTTP.
 * - Provee el servicio con la lógica de negocio.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Torneo, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [TorneosController],
  providers: [TorneosService],
  exports: [TorneosService],
})
export class TorneosModule {}
