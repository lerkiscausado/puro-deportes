import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Jugador } from './jugador.entity';
import { JugadoresService } from './jugadores.service';
import { JugadoresController } from './jugadores.controller';

/**
 * Módulo de Jugadores.
 * Integra todos los componentes del módulo y los registra en TypeORM y JWT.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [JugadoresController],
  providers: [JugadoresService],
  exports: [JugadoresService],
})
export class JugadoresModule {}
