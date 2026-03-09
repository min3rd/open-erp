import { Module } from '@nestjs/common';
import { LoggerModule } from '@shared/logger';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';

// Import schemas
import {
  Product,
  ProductSchema,
  ProductType,
  ProductTypeSchema,
  ProductCategory,
  ProductCategorySchema,
  ProductVersion,
  ProductVersionSchema,
  InventoryStock,
  InventoryStockSchema,
  InventoryTransaction,
  InventoryTransactionSchema,
  Warehouse,
  WarehouseSchema,
  Province,
  ProvinceSchema,
  Ward,
  WardSchema,
  Organization,
  OrganizationSchema,
  User,
  UserSchema,
  Role,
  RoleSchema,
  Zone,
  ZoneSchema,
  Aisle,
  AisleSchema,
  Bin,
  BinSchema,
  WarehouseLayout,
  WarehouseLayoutSchema,
  LayoutObject,
  LayoutObjectSchema,
  Lot,
  LotSchema,
  Serial,
  SerialSchema,
  Receipt,
  ReceiptSchema,
  Picklist,
  PicklistSchema,
  WmsPackage,
  WmsPackageSchema,
  Shipment,
  ShipmentSchema,
  ApprovalRequest,
  ApprovalRequestSchema,
  ApprovalWorkflowTemplate,
  ApprovalWorkflowTemplateSchema,
} from '@shared/schemas';

// Import services
import { ProductService } from './services/product.service';
import { ProductTypeService } from './services/product-type.service';
import { ProductCategoryService } from './services/product-category.service';
import { InventoryService } from './services/inventory.service';
import { WarehouseService } from './services/warehouse.service';
import { ZoneService } from './services/zone.service';
import { AisleService } from './services/aisle.service';
import { BinService } from './services/bin.service';
import { LayoutService } from './services/layout.service';
import { LotService } from './services/lot.service';
import { SerialService } from './services/serial.service';

// WMS Services
import { ReceiptService } from './services/wms/receipt.service';
import { PicklistService } from './services/wms/picklist.service';
import { ShipmentService } from './services/wms/shipment.service';

// Import repositories
import { ProductRepository } from './repositories/product.repository';
import { ProductTypeRepository } from './repositories/product-type.repository';
import { ProductCategoryRepository } from './repositories/product-category.repository';
import { ProductVersionRepository } from './repositories/product-version.repository';
import { InventoryStockRepository } from './repositories/inventory-stock.repository';
import { InventoryTransactionRepository } from './repositories/inventory-transaction.repository';
import { WarehouseRepository } from './repositories/warehouse.repository';
import { ZoneRepository } from './repositories/zone.repository';
import { AisleRepository } from './repositories/aisle.repository';
import { BinRepository } from './repositories/bin.repository';
import { LayoutRepository } from './repositories/layout.repository';
import { LotRepository } from './repositories/lot.repository';
import { SerialRepository } from './repositories/serial.repository';

// WMS Repositories
import { ReceiptRepository } from './repositories/wms/receipt.repository';
import { PicklistRepository } from './repositories/wms/picklist.repository';
import { ShipmentRepository } from './repositories/wms/shipment.repository';
import { WmsPackageRepository } from './repositories/wms/package.repository';

// Import controllers
import { ProductController } from './controllers/product.controller';
import { ProductTypeController } from './controllers/product-type.controller';
import { ProductCategoryController } from './controllers/product-category.controller';
import { InventoryController } from './controllers/inventory.controller';
import { HealthController } from './controllers/health.controller';
import { WarehouseController } from './controllers/warehouse.controller';
import { ZoneController } from './controllers/zone.controller';
import { AisleController } from './controllers/aisle.controller';
import { BinController } from './controllers/bin.controller';
import { LayoutController } from './controllers/layout.controller';
import { LotController } from './controllers/lot.controller';
import { SerialController } from './controllers/serial.controller';

// WMS Controllers
import { ReceiptController } from './controllers/wms/receipt.controller';
import { PicklistController } from './controllers/wms/picklist.controller';
import { ShipmentController } from './controllers/wms/shipment.controller';

// Import shared modules
import { AuthorizationService } from '@shared/authz/authorization.service';
import { PermissionService } from '@shared/services';
import { MinioModule } from '@shared/services/minio/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductType.name, schema: ProductTypeSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: ProductVersion.name, schema: ProductVersionSchema },
      { name: InventoryStock.name, schema: InventoryStockSchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Province.name, schema: ProvinceSchema },
      { name: Ward.name, schema: WardSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Zone.name, schema: ZoneSchema },
      { name: Aisle.name, schema: AisleSchema },
      { name: Bin.name, schema: BinSchema },
      { name: WarehouseLayout.name, schema: WarehouseLayoutSchema },
      { name: LayoutObject.name, schema: LayoutObjectSchema },
      { name: Lot.name, schema: LotSchema },
      { name: Serial.name, schema: SerialSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Picklist.name, schema: PicklistSchema },
      { name: WmsPackage.name, schema: WmsPackageSchema },
      { name: Shipment.name, schema: ShipmentSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
      { name: ApprovalWorkflowTemplate.name, schema: ApprovalWorkflowTemplateSchema },
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    MinioModule,
  ],
  controllers: [
    ProductController,
    ProductTypeController,
    ProductCategoryController,
    InventoryController,
    HealthController,
    WarehouseController,
    ZoneController,
    AisleController,
    BinController,
    LayoutController,
    LotController,
    SerialController,
    ReceiptController,
    PicklistController,
    ShipmentController,
  ],
  providers: [
    ProductService,
    ProductTypeService,
    ProductCategoryService,
    InventoryService,
    WarehouseService,
    ZoneService,
    AisleService,
    BinService,
    LayoutService,
    ProductRepository,
    ProductTypeRepository,
    ProductCategoryRepository,
    ProductVersionRepository,
    InventoryStockRepository,
    InventoryTransactionRepository,
    WarehouseRepository,
    ZoneRepository,
    AisleRepository,
    BinRepository,
    LayoutRepository,
    LotRepository,
    SerialRepository,
    LotService,
    SerialService,
    ReceiptService,
    PicklistService,
    ShipmentService,
    AuthorizationService,
    PermissionService,
    // WMS Repositories
    ReceiptRepository,
    PicklistRepository,
    ShipmentRepository,
    WmsPackageRepository,
  ],
})
export class InventoryModule {}
