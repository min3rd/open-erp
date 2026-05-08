import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from '@shared/logger';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { getRabbitMQConfig } from '@shared/config/rabbitmq.config';

// Schemas
import {
  InventoryStock,
  InventoryStockSchema,
  InventoryTransaction,
  InventoryTransactionSchema,
  ImportExportJob,
  ImportExportJobSchema,
  MappingTemplate,
  MappingTemplateSchema,
} from '@shared/schemas';

// Controllers
import { HealthController } from './controllers/health.controller';
import { StockController } from './controllers/stock.controller';
import { TransferController } from './controllers/transfer.controller';
import { DataImportController } from './controllers/data-import.controller';

// Services
import { StockService } from './services/stock.service';
import { TransferService } from './services/transfer.service';
import { DataImportService } from './services/data-import.service';
import { CatalogSyncConsumer } from './services/catalog-sync.consumer';

// Repositories
import { WmsStockRepository } from './repositories/stock.repository';
import { WmsTransactionRepository } from './repositories/transaction.repository';
import { WmsImportJobRepository } from './repositories/import-job.repository';

import { RABBITMQ_WMS_CLIENT } from './constants/rabbitmq.constants';

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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        // Override DB name for WMS domain
        return getMongooseOptions({ ...config, dbName: process.env.WMS_MONGODB_DB || 'wms_db' });
      },
    }),
    MongooseModule.forFeature([
      { name: InventoryStock.name, schema: InventoryStockSchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: ImportExportJob.name, schema: ImportExportJobSchema },
      { name: MappingTemplate.name, schema: MappingTemplateSchema },
    ]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    LoggerModule,
    ClientsModule.register([
      {
        name: RABBITMQ_WMS_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [buildRabbitMQUrl()],
          queue: 'wms_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [
    HealthController,
    StockController,
    TransferController,
    DataImportController,
    CatalogSyncConsumer,
  ],
  providers: [
    StockService,
    TransferService,
    DataImportService,
    WmsStockRepository,
    WmsTransactionRepository,
    WmsImportJobRepository,
  ],
})
export class WmsServiceModule {}
