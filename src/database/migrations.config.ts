import { DataSource } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  dotenv.config({ path: '.env.development' });
}

export default new DataSource({
  type: 'postgres',
  host: String(process.env.DB_HOST),
  port: Number(process.env.DB_PORT),
  username: String(process.env.DB_USER),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME),
  entities: [],
  migrations: [path.resolve('src', 'database', 'migrations', '*.ts')],
  synchronize: false,
});
