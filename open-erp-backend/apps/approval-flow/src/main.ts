import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@shared/errors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ApprovalFlowModule } from './approval-flow.module';

async function bootstrap() {
  const app = await NestFactory.create(ApprovalFlowModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('ApprovalFlowService');

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
    .setTitle('Approval Flow API')
    .setDescription(
      'Multi-step approval workflow service with node-edge graph model, templates, branching, and scope-based resolution. Compatible with ng-vflow visualization.',
    )
    .setVersion('1.0.0')
    .addTag('workflow-templates', 'Workflow template management')
    .addTag('approval-requests', 'Approval request processing')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.APPROVAL_FLOW_SERVICE_PORT || 3011;
  await app.listen(port);
  logger.log(`Approval Flow Service running on port ${port}`);
}

bootstrap();
