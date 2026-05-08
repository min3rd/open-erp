import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WorkdocModule } from './workdoc.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkdocModule);

  app.enableCors({ origin: '*' });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('WorkDoc Domain Service API')
    .setDescription('Work/Document — Document lifecycle & Workflow approval')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('workdoc-documents', 'Document management')
    .addTag('workdoc-workflows', 'Workflow approval requests')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.WORKDOC_SERVICE_PORT || 3009;
  await app.listen(port);

  console.log(`WorkDoc Service running on port ${port}`);
}

bootstrap();
