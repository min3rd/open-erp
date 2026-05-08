import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from '@shared/logger';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { getRabbitMQConfig } from '@shared/config/rabbitmq.config';
import { formatRabbitMQUrl } from '@shared/rabbitmq';

import { CatalogItem, CatalogItemSchema } from './schemas/catalog-item.schema';
import { CatalogItemRepository } from './repositories/catalog-item.repository';
import { CatalogItemService } from './services/catalog-item.service';
import { CatalogItemController } from './controllers/catalog-item.controller';
import { HealthController } from './controllers/health.controller';
import { TenantPolicyController } from './controllers/tenant-policy.controller';
import { RABBITMQ_PLATFORM_CLIENT, PLATFORM_QUEUE } from './constants/rabbitmq.constants';
import { TenantPolicyService } from '@shared/authz';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        // Override dbName cho platform_db
        return getMongooseOptions({
          ...config,
          dbName: process.env.PLATFORM_DB_NAME ?? 'platform_db',
        });
      },
    }),
    MongooseModule.forFeature([
      { name: CatalogItem.name, schema: CatalogItemSchema },
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_PLATFORM_CLIENT,
        useFactory: () => {
          const rabbitMQConfig = getRabbitMQConfig();
          const url = formatRabbitMQUrl(rabbitMQConfig);
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: PLATFORM_QUEUE,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [CatalogItemController, HealthController, TenantPolicyController],
  providers: [CatalogItemRepository, CatalogItemService, TenantPolicyService],
})
export class PlatformServiceModule {}
