import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Favorito } from './favorito.entity';
import { Torneo } from '../torneos/torneo.entity';
import { FavoritosService } from './favoritos.service';
import { FavoritosController } from './favoritos.controller';

/**
 * Módulo de favoritos.
 * Encapsula la lógica de negocio, endpoints HTTP y configuración de TypeORM y JwtModule
 * para la gestión de torneos favoritos de los usuarios autenticados.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Favorito, Torneo]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [FavoritosController],
  providers: [FavoritosService],
  exports: [FavoritosService],
})
export class FavoritosModule {}
