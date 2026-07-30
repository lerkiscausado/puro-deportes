import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Carga el archivo .env para que las variables estén disponibles cuando
// el CLI de TypeORM invoca este archivo fuera del contexto de NestJS.
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Entidades: apunta a los fuentes TypeScript cuando se usa desde el CLI
  // (ts-node) y a los compilados .js cuando se usa desde dist/ en producción.
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Directorio donde se guardarán los archivos de migración.
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  // El CLI genera las migraciones; nunca sincronizamos automáticamente desde aquí.
  synchronize: false,
});
