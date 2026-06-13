import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

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
