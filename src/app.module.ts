import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TorneosModule } from './torneos/torneos.module';
import { EscenariosModule } from './escenarios/escenarios.module';
import { JugadoresModule } from './jugadores/jugadores.module';
import { EquiposModule } from './equipos/equipos.module';
import { PartidosModule } from './partidos/partidos.module';
import { UploadsModule } from './uploads/uploads.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { PlanillasModule } from './planillas/planillas.module';
import { PartidoPeriodosModule } from './partidoperiodos/partidoperiodos.module';
import { NoticiasModule } from './noticias/noticias.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [],
        synchronize: true, // Nota: usar false en producción
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    TorneosModule,
    EscenariosModule,
    JugadoresModule,
    EquiposModule,
    PartidosModule,
    UploadsModule,
    InscripcionesModule,
    PlanillasModule,
    PartidoPeriodosModule,
    NoticiasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
