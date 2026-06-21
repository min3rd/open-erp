import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationAppModule } from './notification-app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(NotificationAppModule);

  const configService = app.get(ConfigService);
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);

  // Connect to Redis Transporter for Microservice Event Listening
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: redisHost,
      port: redisPort,
    },
  });

  // Enable CORS — allow credentials from Web & Mobile clients
  app.enableCors({
    origin: [
      'http://localhost:4200', // open-erp-web
      'http://localhost:8100', // open-erp-mobile
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

  // Set Global Prefix for Microservice REST HTTP endpoints
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

  // Start microservices listeners
  await app.startAllMicroservices();

  // Listen on port 3001 for HTTP REST (e.g. GET /notifications) and Socket.io Websockets
  const port = configService.get<number>('NOTIFICATION_PORT', 3001);
  await app.listen(port);
  console.log(`[Notification Microservice] HTTP & Socket.io running on port ${port}`);
  console.log(`[Notification Microservice] Redis Microservice listening for events...`);
}
void bootstrap();
