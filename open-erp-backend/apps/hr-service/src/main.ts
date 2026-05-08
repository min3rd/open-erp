import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HrModule } from './hr.module';

async function bootstrap() {
  const app = await NestFactory.create(HrModule);

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
    .setTitle('HR Domain Service API')
    .setDescription('Human Resources — Employee, Leave Request & Department management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('hr-employees', 'Employee management')
    .addTag('hr-leave-requests', 'Leave request workflow')
    .addTag('hr-departments', 'Department management')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.HR_SERVICE_PORT || 3010;
  await app.listen(port);

  console.log(`HR Service running on port ${port}`);
}

bootstrap();
