import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';

async function bootstrap() {
  const logger = new Logger('AuthService');
  const app = await NestFactory.create(AppModule);

  // Get RabbitMQ client from app context
  const rabbitMQClient = app.get(RabbitMQClient);

  // Setup exchanges and queues
  await setupRabbitMQ(rabbitMQClient, logger);

  const port = process.env.AUTH_SERVICE_PORT || 3001;
  await app.listen(port);
  
  logger.log(`Auth Service is running on port ${port}`);
  logger.log(`Connected to RabbitMQ: ${rabbitMQClient.isConnected()}`);
}

async function setupRabbitMQ(client: RabbitMQClient, logger: Logger) {
  try {
    // Main exchanges
    await client.assertExchange({
      name: 'auth.events',
      type: 'topic',
      durable: true,
    });

    await client.assertExchange({
      name: 'auth.rpc',
      type: 'direct',
      durable: true,
    });

    // Dead Letter Exchange
    await client.assertExchange({
      name: 'dlx.auth',
      type: 'topic',
      durable: true,
    });

    // Auth events queue
    await client.assertQueue({
      name: 'auth.events.queue',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx.auth',
        'x-dead-letter-routing-key': 'dlx.auth.events',
      },
    });

    // Auth RPC queue
    await client.assertQueue({
      name: 'auth.rpc.queue',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx.auth',
        'x-dead-letter-routing-key': 'dlx.auth.rpc',
      },
    });

    // DLX queue
    await client.assertQueue({
      name: 'dlx.auth.queue',
      durable: true,
    });

    // Bind queues
    await client.bindQueue({
      queue: 'auth.events.queue',
      exchange: 'auth.events',
      routingKey: 'auth.#',
    });

    await client.bindQueue({
      queue: 'auth.rpc.queue',
      exchange: 'auth.rpc',
      routingKey: 'validate.token',
    });

    await client.bindQueue({
      queue: 'dlx.auth.queue',
      exchange: 'dlx.auth',
      routingKey: 'dlx.auth.#',
    });

    logger.log('RabbitMQ setup completed');
  } catch (error) {
    logger.error('Failed to setup RabbitMQ', error);
    throw error;
  }
}

bootstrap();
