import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS — allow credentials (cookies) from Web & Mobile clients
  app.enableCors({
    origin: [
      'http://localhost:4200', // open-erp-web
      'http://localhost:8100', // open-erp-mobile (Ionic dev)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'x-subdomain',
      'x-refresh-token',
    ],
  });

  // Set Global Prefix
  app.setGlobalPrefix('api/v1');

  // Set Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = errors.map((err) => ({
          field: err.property,
          messageKey: Object.values(err.constraints || {})[0],
        }));
        return new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            messageKey: 'errors.validation_failed',
            details,
          },
        });
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
