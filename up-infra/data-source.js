// eslint-disable

const path = require('path');
const dotenv = require('dotenv');
const { DataSource } = require('typeorm');

const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  dotenv.config({ path: '.env.development' });
}

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
});

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    path.join(__dirname, '../src/modules/database/entities/*.entity.ts'),
  ],
  migrations: [path.join(__dirname, '../src/modules/database/migrations/*.ts')],
  seeds: [path.join(__dirname, '../src/modules/database/seeds/**/*.seeder.ts')],
  factories: [
    path.join(__dirname, '../src/modules/database/factories/**/*.factory.ts'),
  ],
  synchronize: false,
  logging: ['migration'],
  seedTracking: false,
});

module.exports = dataSource;
