import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Publicidad } from './publicidad.entity';
import { PublicidadService } from './publicidad.service';
import { PublicidadController } from './publicidad.controller';

/**
 * Módulo de Publicidad.
 * Integra todos los componentes del módulo y los registra en TypeORM.
 * Solo el rol ADMIN puede gestionar anuncios publicitarios.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Publicidad]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [PublicidadController],
  providers: [PublicidadService],
  exports: [PublicidadService],
})
export class PublicidadModule {}
