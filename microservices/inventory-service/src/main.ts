import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';

async function bootstrap() {
  const logger = new Logger('InventoryService');
  const app = await NestFactory.create(AppModule);

  // Get RabbitMQ client from app context
  const rabbitMQClient = app.get(RabbitMQClient);

  // Setup exchanges and queues
  await setupRabbitMQ(rabbitMQClient, logger);

  const port = process.env.INVENTORY_SERVICE_PORT || 3005;
  await app.listen(port);
  
  logger.log(`Inventory Service is running on port ${port}`);
  logger.log(`Connected to RabbitMQ: ${rabbitMQClient.isConnected()}`);
}

async function setupRabbitMQ(client: RabbitMQClient, logger: Logger) {
  try {
    // Subscribe to order events exchange (created by order service)
    await client.assertExchange({
      name: 'order.events',
      type: 'topic',
      durable: true,
    });

    // Create inventory-specific queue to consume order events
    await client.assertQueue({
      name: 'inventory.order-events.queue',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx.inventory',
        'x-dead-letter-routing-key': 'dlx.inventory.order-events',
      },
    });

    // Dead Letter Exchange
    await client.assertExchange({
      name: 'dlx.inventory',
      type: 'topic',
      durable: true,
    });

    // DLX queue
    await client.assertQueue({
      name: 'dlx.inventory.queue',
      durable: true,
    });

    // Bind inventory queue to order events
    await client.bindQueue({
      queue: 'inventory.order-events.queue',
      exchange: 'order.events',
      routingKey: 'order.created',
    });

    await client.bindQueue({
      queue: 'dlx.inventory.queue',
      exchange: 'dlx.inventory',
      routingKey: 'dlx.inventory.#',
    });

    logger.log('RabbitMQ setup completed');
  } catch (error) {
    logger.error('Failed to setup RabbitMQ', error);
    throw error;
  }
}

bootstrap();
