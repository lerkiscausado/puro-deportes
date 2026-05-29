import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PartidoPeriodo } from './partidoperiodo.entity';
import { PartidoPeriodosService } from './partidoperiodos.service';
import { PartidoPeriodosController } from './partidoperiodos.controller';
import { User } from '../users/user.entity';
import { Partido } from '../partidos/partido.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PartidoPeriodo, User, Partido]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [PartidoPeriodosController],
  providers: [PartidoPeriodosService],
  exports: [PartidoPeriodosService],
})
export class PartidoPeriodosModule {}
