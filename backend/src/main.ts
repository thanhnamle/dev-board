import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Tiền tố toàn cục: mọi API đều có tiền tố /api
  app.setGlobalPrefix('api');

  // 2. Kích hoạt đọc Cookie
  app.use(cookieParser());

  // 3. Kích hoạt CORS hỗ trợ credentials (cookies) từ Angular Frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n======================================================`);
  console.log(`🚀 DevBoard NestJS Backend is running!`);
  console.log(`📡 Local API:     http://localhost:${port}/api`);
  console.log(`💓 Health Check:  http://localhost:${port}/api/health`);
  console.log(`🔑 GitHub OAuth:  http://localhost:${port}/api/auth/github`);
  console.log(`======================================================\n`);
}

bootstrap();
