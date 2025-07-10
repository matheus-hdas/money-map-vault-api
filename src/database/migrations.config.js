const { DataSource } = require('typeorm');
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  dotenv.config({ path: '.env.development' });
}

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [],
  migrations: [path.resolve(__dirname, '../../dist/database/migrations/*.js')],
  synchronize: false,
});
