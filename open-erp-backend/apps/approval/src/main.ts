import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@shared/errors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ApprovalModule } from './approval.module';

async function bootstrap() {
  const app = await NestFactory.create(ApprovalModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('ApprovalService');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.enableCors({ origin: '*' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Approval Workflow API')
    .setDescription(
      'Multi-step approval workflow service with templates, branching, and scope-based resolution',
    )
    .setVersion('1.0.0')
    .addTag('workflow-templates', 'Workflow template management')
    .addTag('approval-requests', 'Approval request processing')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.APPROVAL_SERVICE_PORT || 3011;
  await app.listen(port);
  logger.log(`Approval Service running on port ${port}`);
}

bootstrap();
