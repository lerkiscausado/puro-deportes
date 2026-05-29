import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Escenario } from './escenario.entity';
import { EscenariosService } from './escenarios.service';
import { EscenariosController } from './escenarios.controller';
import { User } from '../users/user.entity';

/**
 * Módulo de Escenarios.
 * Integra todos los componentes del módulo y los registra en TypeORM.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Escenario, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [EscenariosController],
  providers: [EscenariosService],
  exports: [EscenariosService],
})
export class EscenariosModule {}
