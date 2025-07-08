import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.development' });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
