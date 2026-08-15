import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TipoEstadistica } from './tipo-estadistica.entity';
import { TiposEstadisticaService } from './tipos-estadistica.service';
import { TiposEstadisticaController } from './tipos-estadistica.controller';

/**
 * Módulo de tipos de estadística.
 * Encapsula la lógica de catálogo para los tipos de estadísticas deportivas.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TipoEstadistica]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [TiposEstadisticaController],
  providers: [TiposEstadisticaService],
  exports: [TiposEstadisticaService, TypeOrmModule],
})
export class TiposEstadisticaModule {}
