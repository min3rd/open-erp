import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    MetricsService,
    LoggerService,
    {
      provide: RabbitMQClient,
      useFactory: async () => {
        const client = new RabbitMQClient({
          url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
          user: process.env.RABBITMQ_USER || 'admin',
          password: process.env.RABBITMQ_PASSWORD || 'admin123',
          vhost: process.env.RABBITMQ_VHOST || '/',
          heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '60'),
          prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '10'),
          retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '3'),
          retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '1000'),
          enableTLS: process.env.RABBITMQ_ENABLE_TLS === 'true',
        });
        await client.connect();
        return client;
      },
    },
  ],
})
export class AppModule {}
