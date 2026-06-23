import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Noticia } from './noticia.entity';
import { NoticiasService } from './noticias.service';
import { NoticiasController } from './noticias.controller';

/**
 * Módulo de noticias.
 * Registra la entidad Noticia, configura JWT para el guard y provee
 * el controlador y el servicio.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Noticia]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [NoticiasController],
  providers: [NoticiasService],
  exports: [NoticiasService],
})
export class NoticiasModule {}
