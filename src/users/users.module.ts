import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailModule } from '../email/email.module';

/**
 * Módulo de usuarios.
 * Encapsula toda la funcionalidad relacionada con usuarios:
 * - Registra la entidad User en TypeORM para acceso a la base de datos.
 * - Configura JwtModule para la generación de tokens de autenticación.
 * - Declara el controlador que expone los endpoints HTTP.
 * - Provee el servicio con la lógica de negocio.
 * - Exporta UsersService para que otros módulos (ej: Auth) puedan reutilizarlo.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
