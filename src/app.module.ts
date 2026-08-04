import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ── Rate limiting global ────────────────────────────────────────────
    // Protege TODOS los endpoints: máximo 100 peticiones por minuto por IP.
    // Los endpoints de autenticación tienen límites más estrictos definidos
    // con @Throttle() directamente en users.controller.ts.
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // ventana de tiempo en ms (1 minuto)
        limit: 100, // máximo de peticiones por IP en esa ventana
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        // Sincroniza el esquema en cualquier entorno que NO sea producción
        // explícita (development, test, etc.). Esto permite que
        // `npm run test:e2e` sea autocontenido contra una BD vacía, ya que
        // Jest fuerza NODE_ENV=test internamente. En producción (NODE_ENV=
        // production en el .env del VPS) esto sigue en false, usando
        // migraciones como corresponde.
        const shouldSynchronize = nodeEnv !== 'production';

        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT', 3306),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [],
          autoLoadEntities: true,

          // Solo sincroniza automáticamente en entornos no productivos.
          // En staging/producción usa `npm run migration:run` antes de arrancar.
          synchronize: shouldSynchronize,

          // Ruta a los archivos de migración (TypeScript en dev, JS en prod).
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],

          // Las migraciones NO se corren automáticamente al arrancar.
          // Deben ejecutarse de forma explícita como paso del despliegue.
          migrationsRun: false,
        };
      },
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
  providers: [
    AppService,
    // Registra el guard de rate limiting como guard global para toda la app.
    // Los endpoints que necesiten límites distintos usan @Throttle() localmente.
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
