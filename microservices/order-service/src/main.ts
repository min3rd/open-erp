import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(AppModule);

  // Get RabbitMQ client from app context
  const rabbitMQClient = app.get(RabbitMQClient);

  // Setup exchanges and queues
  await setupRabbitMQ(rabbitMQClient, logger);

  const port = process.env.ORDER_SERVICE_PORT || 3004;
  await app.listen(port);
  
  logger.log(`Order Service is running on port ${port}`);
  logger.log(`Connected to RabbitMQ: ${rabbitMQClient.isConnected()}`);
}

async function setupRabbitMQ(client: RabbitMQClient, logger: Logger) {
  try {
    // Main exchanges
    await client.assertExchange({
      name: 'order.events',
      type: 'topic',
      durable: true,
    });

    // Dead Letter Exchange
    await client.assertExchange({
      name: 'dlx.order',
      type: 'topic',
      durable: true,
    });

    // Order events queue
    await client.assertQueue({
      name: 'order.events.queue',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx.order',
        'x-dead-letter-routing-key': 'dlx.order.events',
      },
    });

    // DLX queue
    await client.assertQueue({
      name: 'dlx.order.queue',
      durable: true,
    });

    // Bind queues
    await client.bindQueue({
      queue: 'order.events.queue',
      exchange: 'order.events',
      routingKey: 'order.#',
    });

    await client.bindQueue({
      queue: 'dlx.order.queue',
      exchange: 'dlx.order',
      routingKey: 'dlx.order.#',
    });

    logger.log('RabbitMQ setup completed');
  } catch (error) {
    logger.error('Failed to setup RabbitMQ', error);
    throw error;
  }
}

bootstrap();
