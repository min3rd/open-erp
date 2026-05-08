import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WmsServiceModule } from './wms-service.module';
import { getRabbitMQConfig } from '@shared/config/rabbitmq.config';

function buildRabbitMQUrl(): string {
  const config = getRabbitMQConfig();
  let url = config.url;
  if (config.user && config.password) {
    const u = encodeURIComponent(config.user);
    const p = encodeURIComponent(config.password);
    if (!/^amqps?:\/\/[^@]+@/.test(url)) {
      url = url.replace(/^(amqps?:\/\/)/, `$1${u}:${p}@`);
    }
  }
  return url;
}

async function bootstrap() {
  const app = await NestFactory.create(WmsServiceModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Connect RabbitMQ microservice (consumer)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [buildRabbitMQUrl()],
      queue: 'wms_queue',
      queueOptions: { durable: true },
      noAck: false,
    },
  });

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
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('WMS Domain Service API')
    .setDescription('Warehouse Management System — Stock, Transfer, Import/Export')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('wms-stock', 'Stock query & adjustment')
    .addTag('wms-transfers', 'Transfer orders')
    .addTag('wms-data-import', 'Import/export jobs')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();

  const port = process.env.WMS_SERVICE_PORT || 3008;
  await app.listen(port);

  console.log(`WMS Service running on port ${port}`);
}

bootstrap();
