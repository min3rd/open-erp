import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { LoggerModule } from '@shared/logger';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { MinioModule } from '@shared/services/minio/minio.module';

import {
  ImportExportJob,
  ImportExportJobSchema,
  MappingTemplate,
  MappingTemplateSchema,
  User,
  UserSchema,
  Product,
  ProductSchema,
  Warehouse,
  WarehouseSchema,
  Organization,
  OrganizationSchema,
  Role,
  RoleSchema,
} from '@shared/schemas';

import { DataTransferController } from './controllers/data-transfer.controller';
import { HealthController } from './controllers/health.controller';
import { DataTransferService } from './services/data-transfer.service';
import { ExcelParserService } from './services/excel-parser.service';
import { ImportExportJobRepository } from './repositories/import-export-job.repository';
import { MappingTemplateRepository } from './repositories/mapping-template.repository';
import { AuthorizationService } from '@shared/authz/authorization.service';
import { PermissionService } from '@shared/services';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: ImportExportJob.name, schema: ImportExportJobSchema },
      { name: MappingTemplate.name, schema: MappingTemplateSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }), // 50MB
    LoggerModule,
    MinioModule,
  ],
  controllers: [DataTransferController, HealthController],
  providers: [
    DataTransferService,
    ExcelParserService,
    ImportExportJobRepository,
    MappingTemplateRepository,
    AuthorizationService,
    PermissionService,
  ],
})
export class DataTransferModule {}
