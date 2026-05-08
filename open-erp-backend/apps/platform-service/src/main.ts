import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PlatformServiceModule } from './platform-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PlatformServiceModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.enableCors({ origin: '*' });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Platform Service API')
    .setDescription('API quản lý master catalog dùng chung toàn hệ thống (UoM, Category, ProductType, Tag, Attribute)')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('catalog-items', 'Master catalog item endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PLATFORM_SERVICE_PORT ?? 3007;
  await app.listen(port);

  console.log(`Platform Service is running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api/docs`);
}

bootstrap();
