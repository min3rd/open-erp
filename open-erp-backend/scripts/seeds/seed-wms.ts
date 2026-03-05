#!/usr/bin/env ts-node

/**
 * Seed WMS (Warehouse Management System) demo data
 *
 * Creates demo data for: Zones, Aisles, Bins, Lots, Serials,
 * Receipts, Picklists, WMS Packages, and Shipments.
 *
 * Prerequisites: warehouses, organizations, and products must exist.
 *
 * Usage:
 *   ts-node scripts/seeds/seed-wms.ts [options]
 *
 * Options:
 *   --warehouses <n>     Number of warehouses to use (default: 5)
 *   --drop               Drop existing WMS collections before seeding
 *   --dry-run            Validate without writing to database
 *   --skip-zones         Skip zones seeding
 *   --skip-aisles        Skip aisles seeding
 *   --skip-bins          Skip bins seeding
 *   --skip-lots          Skip lots seeding
 *   --skip-serials       Skip serials seeding
 *   --skip-receipts      Skip receipts seeding
 *   --skip-picklists     Skip picklists seeding
 *   --skip-packages      Skip packages seeding
 *   --skip-shipments     Skip shipments seeding
 */

import 'tsconfig-paths/register';
import { connect, connection, Types } from 'mongoose';
import { ZoneSchema, ZoneType } from '@shared/schemas/zone.schema';
import { AisleSchema } from '@shared/schemas/aisle.schema';
import { BinSchema, BinType } from '@shared/schemas/bin.schema';
import { LotSchema } from '@shared/schemas/lot.schema';
import { SerialSchema, SerialStatus } from '@shared/schemas/serial.schema';
import { ReceiptSchema, ReceiptStatus, QcStatus } from '@shared/schemas/receipt.schema';
import { PicklistSchema, PicklistStatus } from '@shared/schemas/picklist.schema';
import { WmsPackageSchema, WmsPackageStatus } from '@shared/schemas/wms-package.schema';
import { ShipmentSchema, ShipmentStatus } from '@shared/schemas/shipment.schema';
import { WarehouseSchema } from '@shared/schemas/warehouse.schema';
import { ProductSchema } from '@shared/schemas/product.schema';
import { OrganizationSchema } from '@shared/schemas/organization.schema';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';

require('dotenv').config();

// ---------------------------------------------------------------------------
// CLI Options
// ---------------------------------------------------------------------------

interface SeedOptions {
  warehouses?: number;
  drop?: boolean;
  dryRun?: boolean;
  skipZones?: boolean;
  skipAisles?: boolean;
  skipBins?: boolean;
  skipLots?: boolean;
  skipSerials?: boolean;
  skipReceipts?: boolean;
  skipPicklists?: boolean;
  skipPackages?: boolean;
  skipShipments?: boolean;
}

function parseArgs(): SeedOptions {
  const opts: SeedOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--warehouses':
        if (args[i + 1]) { opts.warehouses = parseInt(args[i + 1], 10); i++; }
        break;
      case '--drop':         opts.drop = true;          break;
      case '--dry-run':      opts.dryRun = true;        break;
      case '--skip-zones':   opts.skipZones = true;     break;
      case '--skip-aisles':  opts.skipAisles = true;    break;
      case '--skip-bins':    opts.skipBins = true;      break;
      case '--skip-lots':    opts.skipLots = true;      break;
      case '--skip-serials': opts.skipSerials = true;   break;
      case '--skip-receipts':  opts.skipReceipts = true;  break;
      case '--skip-picklists': opts.skipPicklists = true; break;
      case '--skip-packages':  opts.skipPackages = true;  break;
      case '--skip-shipments': opts.skipShipments = true; break;
    }
  }

  return opts;
}

// ---------------------------------------------------------------------------
// DB Connection (same pattern as other seed scripts)
// ---------------------------------------------------------------------------

async function connectToDatabase(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const mongooseOpts = getMongooseOptions(dbConfig) as any;
  const connectUri = dbConfig.uri;

  const maskedAuth = dbConfig.user ? `${dbConfig.user}:***` : '(no-auth)';
  console.log('Connecting to MongoDB...');
  console.log(`  URI: ${connectUri}`);
  console.log(`  Database: ${mongooseOpts.dbName}`);
  console.log(`  Auth: ${maskedAuth}`);

  async function doConnect(uri: string, opts: any) {
    return await connect(uri, opts);
  }

  try {
    await doConnect(connectUri, {
      dbName: mongooseOpts.dbName,
      auth: mongooseOpts.auth,
      authSource: mongooseOpts.authSource,
      maxPoolSize: mongooseOpts.maxPoolSize,
      minPoolSize: mongooseOpts.minPoolSize,
      serverSelectionTimeoutMS: mongooseOpts.serverSelectionTimeoutMS,
      connectTimeoutMS: mongooseOpts.connectTimeoutMS,
      socketTimeoutMS: mongooseOpts.socketTimeoutMS,
      tls: mongooseOpts.tls,
      tlsAllowInvalidCertificates: mongooseOpts.tlsAllowInvalidCertificates,
      replicaSet: mongooseOpts.replicaSet,
    });
    console.log('✓ Connected to MongoDB');
  } catch (err: any) {
    console.error('Initial connection failed:', err?.message || err);
    if (dbConfig.user && dbConfig.pass) {
      const user = encodeURIComponent(dbConfig.user);
      const pass = encodeURIComponent(dbConfig.pass);
      const credentialedUri = connectUri.replace(/^(mongodb(\+srv)?:\/\/)/, `$1${user}:${pass}@`);
      console.log('Retrying with credentials embedded in URI...');
      try {
        await doConnect(credentialedUri, {
          dbName: mongooseOpts.dbName,
          maxPoolSize: mongooseOpts.maxPoolSize,
          minPoolSize: mongooseOpts.minPoolSize,
          serverSelectionTimeoutMS: mongooseOpts.serverSelectionTimeoutMS,
          connectTimeoutMS: mongooseOpts.connectTimeoutMS,
          socketTimeoutMS: mongooseOpts.socketTimeoutMS,
          tls: mongooseOpts.tls,
          tlsAllowInvalidCertificates: mongooseOpts.tlsAllowInvalidCertificates,
          replicaSet: mongooseOpts.replicaSet,
        });
        console.log('✓ Connected to MongoDB with embedded credentials');
      } catch (err2: any) {
        console.error('Retry with embedded credentials failed:', err2?.message || err2);
        throw err2;
      }
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, daysAhead = 0): Date {
  const now = Date.now();
  const past = now - daysAgo * 86_400_000;
  const future = now + daysAhead * 86_400_000;
  return new Date(past + Math.random() * (future - past));
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

// ---------------------------------------------------------------------------
// Zone definitions per warehouse
// ---------------------------------------------------------------------------

interface ZoneDef {
  codeSuffix: string;
  name: string;
  type: ZoneType;
  sequence: number;
  isDefault: boolean;
  description: string;
  aisleCount: number;
  binPerAisle: number;
  binType: BinType;
  binCapacity: number;
}

const ZONE_DEFINITIONS: ZoneDef[] = [
  {
    codeSuffix: 'RCV',
    name: 'Khu Nhập hàng',
    type: ZoneType.RECEIVING,
    sequence: 1,
    isDefault: false,
    description: 'Khu vực tiếp nhận hàng hóa đến từ nhà cung cấp',
    aisleCount: 2,
    binPerAisle: 4,
    binType: BinType.FLOOR,
    binCapacity: 50,
  },
  {
    codeSuffix: 'STG-A',
    name: 'Kho Lưu trữ A',
    type: ZoneType.STORAGE,
    sequence: 2,
    isDefault: true,
    description: 'Khu vực lưu trữ hàng hóa chính – dãy A',
    aisleCount: 4,
    binPerAisle: 8,
    binType: BinType.RACK,
    binCapacity: 100,
  },
  {
    codeSuffix: 'STG-B',
    name: 'Kho Lưu trữ B',
    type: ZoneType.STORAGE,
    sequence: 3,
    isDefault: false,
    description: 'Khu vực lưu trữ hàng hóa chính – dãy B',
    aisleCount: 4,
    binPerAisle: 8,
    binType: BinType.RACK,
    binCapacity: 100,
  },
  {
    codeSuffix: 'STG-PLT',
    name: 'Khu Pallet',
    type: ZoneType.STORAGE,
    sequence: 4,
    isDefault: false,
    description: 'Khu vực lưu trữ hàng trên pallet',
    aisleCount: 3,
    binPerAisle: 6,
    binType: BinType.PALLET,
    binCapacity: 20,
  },
  {
    codeSuffix: 'STA',
    name: 'Khu Dàn hàng',
    type: ZoneType.STAGING,
    sequence: 5,
    isDefault: false,
    description: 'Khu vực chuẩn bị hàng trước khi giao',
    aisleCount: 2,
    binPerAisle: 4,
    binType: BinType.FLOOR,
    binCapacity: 30,
  },
  {
    codeSuffix: 'SHP',
    name: 'Khu Xuất hàng',
    type: ZoneType.SHIPPING,
    sequence: 6,
    isDefault: false,
    description: 'Khu vực xuất hàng ra xe tải / đơn vị vận chuyển',
    aisleCount: 2,
    binPerAisle: 4,
    binType: BinType.FLOOR,
    binCapacity: 40,
  },
  {
    codeSuffix: 'QRT',
    name: 'Khu Kiểm dịch',
    type: ZoneType.QUARANTINE,
    sequence: 7,
    isDefault: false,
    description: 'Khu vực cách ly hàng nghi ngờ lỗi / kiểm tra chất lượng',
    aisleCount: 1,
    binPerAisle: 4,
    binType: BinType.SHELF,
    binCapacity: 20,
  },
  {
    codeSuffix: 'RET',
    name: 'Khu Hàng trả về',
    type: ZoneType.RETURN,
    sequence: 8,
    isDefault: false,
    description: 'Khu vực tiếp nhận và xử lý hàng trả lại từ khách hàng',
    aisleCount: 1,
    binPerAisle: 4,
    binType: BinType.SHELF,
    binCapacity: 15,
  },
  {
    codeSuffix: 'CLD',
    name: 'Kho Lạnh',
    type: ZoneType.COLD,
    sequence: 9,
    isDefault: false,
    description: 'Khu vực bảo quản lạnh (2°C – 8°C)',
    aisleCount: 2,
    binPerAisle: 4,
    binType: BinType.RACK,
    binCapacity: 30,
  },
];

// Vietnamese supplier names for receipt demos
const SUPPLIERS = [
  'Công ty TNHH Sản xuất ABC',
  'Công ty CP Thương mại XYZ',
  'Nhà cung cấp Việt Long',
  'Công ty TNHH Phú Thịnh',
  'Tập đoàn Minh Tiến',
  'Nhà phân phối Đức Toàn',
  'Công ty CP Hoàng Gia',
  'Nhà sản xuất Thành Đạt',
];

// Carrier names
const CARRIERS = [
  'Giao Hàng Nhanh (GHN)',
  'Giao Hàng Tiết Kiệm (GHTK)',
  'ViettelPost',
  'J&T Express',
  'Ninja Van',
  'DHL Express',
  'FedEx Vietnam',
  'BEST Express',
];

// ---------------------------------------------------------------------------
// Seeding functions
// ---------------------------------------------------------------------------

async function seedZones(
  warehouses: any[],
  opts: SeedOptions,
): Promise<Map<string, any[]>> {
  const Zone = connection.model('Zone', ZoneSchema);
  const warehouseZonesMap = new Map<string, any[]>();

  if (opts.drop) {
    console.log('  Dropping existing zones...');
    await Zone.deleteMany({});
  }

  let total = 0;
  let inserted = 0;

  for (const warehouse of warehouses) {
    const zones: any[] = [];

    for (const def of ZONE_DEFINITIONS) {
      const code = `${warehouse.code}-${def.codeSuffix}`;
      const zoneData = {
        warehouseId: warehouse._id,
        code,
        name: `${def.name}`,
        type: def.type,
        sequence: def.sequence,
        isDefault: def.isDefault,
        isActive: true,
        description: def.description,
        metadata: {
          seedVersion: 1,
          aisleCount: def.aisleCount,
          binPerAisle: def.binPerAisle,
        },
      };

      total++;
      try {
        const result = await Zone.findOneAndUpdate(
          { warehouseId: warehouse._id, code },
          { $set: zoneData },
          { upsert: true, returnDocument: 'after' },
        );
        zones.push({ ...result.toObject({ transform: false }), _def: def });
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Zone ${code}: ${err.message}`);
      }
    }

    warehouseZonesMap.set(warehouse._id.toString(), zones);
  }

  console.log(`  ✓ Zones: ${inserted}/${total}`);
  return warehouseZonesMap;
}

async function seedAisles(
  warehouseZonesMap: Map<string, any[]>,
  opts: SeedOptions,
): Promise<Map<string, any[]>> {
  const Aisle = connection.model('Aisle', AisleSchema);
  const zoneAislesMap = new Map<string, any[]>();

  if (opts.drop) {
    console.log('  Dropping existing aisles...');
    await Aisle.deleteMany({});
  }

  let total = 0;
  let inserted = 0;

  for (const zones of warehouseZonesMap.values()) {
    for (const zone of zones) {
      const def: ZoneDef = zone._def;
      const aisles: any[] = [];

      for (let a = 1; a <= def.aisleCount; a++) {
        const code = `${zone.code}-A${pad(a)}`;
        const aisleData = {
          zoneId: zone._id,
          code,
          name: `Dãy ${pad(a)}`,
          sequence: a,
          levels: randomInt(1, 5),
          isActive: true,
          description: `Dãy đi lại số ${a} thuộc ${zone.name}`,
        };

        total++;
        try {
          const result = await Aisle.findOneAndUpdate(
            { zoneId: zone._id, code },
            { $set: aisleData },
            { upsert: true, returnDocument: 'after' },
          );
          aisles.push({ ...result.toObject({ transform: false }), _def: def });
          inserted++;
        } catch (err: any) {
          console.error(`    ✗ Aisle ${code}: ${err.message}`);
        }
      }

      zoneAislesMap.set(zone._id.toString(), aisles);
    }
  }

  console.log(`  ✓ Aisles: ${inserted}/${total}`);
  return zoneAislesMap;
}

async function seedBins(
  zoneAislesMap: Map<string, any[]>,
  opts: SeedOptions,
): Promise<any[]> {
  const Bin = connection.model('Bin', BinSchema);
  const allBins: any[] = [];

  if (opts.drop) {
    console.log('  Dropping existing bins...');
    await Bin.deleteMany({});
  }

  let total = 0;
  let inserted = 0;

  for (const aisles of zoneAislesMap.values()) {
    for (const aisle of aisles) {
      const def: ZoneDef = aisle._def;

      for (let b = 1; b <= def.binPerAisle; b++) {
        const code = `${aisle.code}-B${pad(b)}`;
        const barcode = `BC${Date.now().toString(36).toUpperCase()}${pad(b, 3)}`;
        const binData = {
          aisleId: aisle._id,
          code,
          barcode,
          binType: def.binType,
          capacityQty: def.binCapacity,
          currentQty: randomInt(0, Math.floor(def.binCapacity * 0.7)),
          isActive: true,
          isBlocked: Math.random() < 0.05, // 5% chance of blocked
          dimensions: {
            lengthCm: randomInt(40, 200),
            widthCm: randomInt(40, 150),
            heightCm: randomInt(30, 250),
          },
        };

        total++;
        try {
          const result = await Bin.findOneAndUpdate(
            { aisleId: aisle._id, code },
            { $set: binData },
            { upsert: true, returnDocument: 'after' },
          );
          allBins.push(result.toObject({ transform: false }));
          inserted++;
        } catch (err: any) {
          console.error(`    ✗ Bin ${code}: ${err.message}`);
        }
      }
    }
  }

  console.log(`  ✓ Bins: ${inserted}/${total}`);
  return allBins;
}

async function seedLots(
  products: any[],
  orgs: any[],
  opts: SeedOptions,
): Promise<any[]> {
  const Lot = connection.model('Lot', LotSchema);
  const allLots: any[] = [];

  if (opts.drop) {
    console.log('  Dropping existing lots...');
    await Lot.deleteMany({});
  }

  const lotsPerProduct = 3;
  let total = 0;
  let inserted = 0;

  for (const product of products) {
    const org = randomFrom(orgs);
    const now = new Date();

    for (let l = 1; l <= lotsPerProduct; l++) {
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const lotCode = `LOT-${product.sku || 'SKU'}-${year}${month}-${pad(l, 3)}`;

      const manufacturedAt = randomDate(180, 0); // up to 6 months ago
      const expiryAt = new Date(manufacturedAt.getTime() + randomInt(180, 730) * 86_400_000); // +6~24 months
      const totalQty = randomInt(100, 1000);
      const remainingQty = randomInt(0, totalQty);

      const lotData = {
        skuId: product._id,
        lotCode,
        organizationId: org._id,
        manufacturedAt,
        expiryAt,
        totalQty,
        remainingQty,
        metadata: {
          productName: product.name,
          productSku: product.sku,
        },
      };

      total++;
      try {
        const result = await Lot.findOneAndUpdate(
          { skuId: product._id, lotCode },
          { $set: lotData },
          { upsert: true, new: true },
        );
        allLots.push(result.toObject());
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Lot ${lotCode}: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ Lots: ${inserted}/${total}`);
  return allLots;
}

async function seedSerials(
  products: any[],
  allBins: any[],
  allLots: any[],
  orgs: any[],
  opts: SeedOptions,
): Promise<void> {
  const Serial = connection.model('Serial', SerialSchema);

  if (opts.drop) {
    console.log('  Dropping existing serials...');
    await Serial.deleteMany({});
  }

  // Only seed serials for first 20 products to keep it manageable
  const serialProducts = products.slice(0, 20);
  const serialsPerProduct = 10;
  let total = 0;
  let inserted = 0;

  const statuses = [
    SerialStatus.AVAILABLE,
    SerialStatus.AVAILABLE,
    SerialStatus.AVAILABLE,
    SerialStatus.RESERVED,
    SerialStatus.IN_TRANSIT,
    SerialStatus.CONSUMED,
  ];

  for (const product of serialProducts) {
    const org = randomFrom(orgs);
    const productLots = allLots.filter(
      (l) => l.skuId.toString() === product._id.toString(),
    );

    for (let s = 1; s <= serialsPerProduct; s++) {
      const serial = `SN-${product.sku || 'SKU'}-${Date.now().toString(36).toUpperCase()}-${pad(s, 4)}`;
      const status = randomFrom(statuses);
      const bin = randomFrom(allBins);
      const lot = productLots.length > 0 ? randomFrom(productLots) : null;

      const serialData = {
        skuId: product._id,
        serial,
        status,
        binId: status === SerialStatus.AVAILABLE ? bin._id : undefined,
        lotId: lot ? lot._id : undefined,
        organizationId: org._id,
        assignedAt: status !== SerialStatus.AVAILABLE ? randomDate(30) : undefined,
      };

      total++;
      try {
        await Serial.findOneAndUpdate(
          { skuId: product._id, serial },
          { $set: serialData },
          { upsert: true },
        );
        inserted++;
      } catch (err: any) {
        // Skip duplicate serials silently
      }
    }
  }

  console.log(`  ✓ Serials: ${inserted}/${total}`);
}

async function seedReceipts(
  warehouses: any[],
  orgs: any[],
  products: any[],
  allLots: any[],
  opts: SeedOptions,
): Promise<any[]> {
  const Receipt = connection.model('Receipt', ReceiptSchema);
  const allReceipts: any[] = [];

  if (opts.drop) {
    console.log('  Dropping existing receipts...');
    await Receipt.deleteMany({});
  }

  const statusFlow: ReceiptStatus[] = [
    ReceiptStatus.COMPLETED,
    ReceiptStatus.RECEIVED,
    ReceiptStatus.QC_PASSED,
    ReceiptStatus.QC_PENDING,
    ReceiptStatus.PENDING,
    ReceiptStatus.PARTIAL,
    ReceiptStatus.DRAFT,
    ReceiptStatus.CANCELLED,
  ];

  let total = 0;
  let inserted = 0;

  for (const warehouse of warehouses) {
    const org = randomFrom(orgs);

    // 20 receipts per warehouse (covers all status flows, multiple times)
    for (let r = 0; r < 20; r++) {
      const status = statusFlow[r % statusFlow.length];
      const supplier = randomFrom(SUPPLIERS);
      // Vary the number of lines: 2-6 products per receipt
      const lineCount = randomInt(2, 6);
      const startIdx = (r * lineCount) % Math.max(1, products.length - lineCount);
      const receiptProducts = products.slice(startIdx, startIdx + lineCount);

      const lines = receiptProducts.map((prod) => {
        const orderedQty = randomInt(10, 200);
        const receivedQty =
          status === ReceiptStatus.COMPLETED || status === ReceiptStatus.RECEIVED
            ? orderedQty
            : status === ReceiptStatus.PARTIAL
              ? randomInt(1, orderedQty - 1)
              : 0;

        const lot = allLots.find((l) => l.skuId.toString() === prod._id.toString());
        const qcStatus =
          status === ReceiptStatus.QC_PASSED
            ? QcStatus.PASSED
            : status === ReceiptStatus.QC_FAILED
              ? QcStatus.FAILED
              : status === ReceiptStatus.QC_PENDING
                ? QcStatus.PENDING
                : QcStatus.PASSED;

        return {
          skuId: prod._id,
          skuCode: prod.sku || prod.code,
          skuName: prod.name,
          orderedQty,
          receivedQty,
          unit: prod.unit || 'cái',
          lotId: lot ? lot._id : undefined,
          qcStatus,
          defectQty: qcStatus === QcStatus.FAILED ? randomInt(1, 5) : 0,
        };
      });

      const receiptData = {
        orgId: org._id,
        warehouseId: warehouse._id,
        poId: `PO-${warehouse.code}-${pad(r + 1, 4)}`,
        supplier,
        status,
        lines,
        notes: `Phiếu nhập hàng demo - ${supplier}`,
        attachments: [],
      };

      total++;
      try {
        const result = await Receipt.create(receiptData);
        allReceipts.push(result.toObject());
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Receipt: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ Receipts: ${inserted}/${total}`);
  return allReceipts;
}

async function seedPicklists(
  warehouses: any[],
  orgs: any[],
  products: any[],
  allLots: any[],
  opts: SeedOptions,
): Promise<any[]> {
  const Picklist = connection.model('Picklist', PicklistSchema);
  const allPicklists: any[] = [];

  if (opts.drop) {
    console.log('  Dropping existing picklists...');
    await Picklist.deleteMany({});
  }

  const statuses: PicklistStatus[] = [
    PicklistStatus.COMPLETED,
    PicklistStatus.IN_PROGRESS,
    PicklistStatus.ASSIGNED,
    PicklistStatus.DRAFT,
    PicklistStatus.PARTIAL,
    PicklistStatus.CANCELLED,
  ];

  let total = 0;
  let inserted = 0;

  for (const warehouse of warehouses) {
    const org = randomFrom(orgs);

    // 15 picklists per warehouse (covers all statuses, varied line counts)
    for (let p = 0; p < 15; p++) {
      const status = statuses[p % statuses.length];
      const lineCount = randomInt(2, 5);
      const startIdx = (p * lineCount) % Math.max(1, products.length - lineCount);
      const pickProducts = products.slice(startIdx, startIdx + lineCount);

      const lines = pickProducts.map((prod) => {
        const qty = randomInt(1, 50);
        const pickedQty =
          status === PicklistStatus.COMPLETED
            ? qty
            : status === PicklistStatus.PARTIAL
              ? randomInt(1, qty - 1)
              : status === PicklistStatus.IN_PROGRESS
                ? randomInt(0, qty)
                : 0;

        const lot = allLots.find((l) => l.skuId.toString() === prod._id.toString());
        return {
          skuId: prod._id,
          skuCode: prod.sku || prod.code,
          skuName: prod.name,
          qty,
          pickedQty,
          unit: prod.unit || 'cái',
          bins: [],
          serials: [],
          lotId: lot ? lot._id : undefined,
        };
      });

      const picklistData = {
        orgId: org._id,
        warehouseId: warehouse._id,
        orderIds: [`ORD-${warehouse.code}-${pad(p + 1, 4)}`],
        status,
        lines,
        notes: `Phiếu nhặt hàng demo – đơn ${pad(p + 1, 4)}`,
        completedAt: status === PicklistStatus.COMPLETED ? randomDate(7) : undefined,
      };

      total++;
      try {
        const result = await Picklist.create(picklistData);
        allPicklists.push(result.toObject());
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Picklist: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ Picklists: ${inserted}/${total}`);
  return allPicklists;
}

async function seedPackages(
  orgs: any[],
  allPicklists: any[],
  opts: SeedOptions,
): Promise<any[]> {
  const WmsPackage = connection.model('WmsPackage', WmsPackageSchema);
  const allPackages: any[] = [];

  if (opts.drop) {
    console.log('  Dropping existing wms_packages...');
    await WmsPackage.deleteMany({});
  }

  const statuses: WmsPackageStatus[] = [
    WmsPackageStatus.PACKED,
    WmsPackageStatus.SHIPPED,
    WmsPackageStatus.OPEN,
  ];

  let total = 0;
  let inserted = 0;

  for (const org of orgs) {
    const orgPicklists = allPicklists.filter(
      (pl) => pl.orgId.toString() === org._id.toString(),
    );
    const completedPicklists = orgPicklists.filter(
      (pl) => pl.status === PicklistStatus.COMPLETED,
    );

    // 5 packages per org (varied statuses and picklist linkage)
    for (let pk = 0; pk < 5; pk++) {
      const status = statuses[pk % statuses.length];
      const linkedPicklists = completedPicklists
        .slice(pk, pk + randomInt(1, 2))
        .map((pl) => pl._id.toString());

      const packageData = {
        orgId: org._id,
        picklistIds: linkedPicklists,
        status,
        weight: randomInt(1, 50) + Math.random(),
        dimensions: `${randomInt(20, 100)}x${randomInt(20, 80)}x${randomInt(10, 60)} cm`,
        labels: [`LBL-${org._id.toString().slice(-4)}-${pad(pk + 1, 3)}`],
        trackingNumber:
          status === WmsPackageStatus.SHIPPED
            ? `TRK${Date.now().toString(36).toUpperCase()}${pad(pk + 1)}`
            : undefined,
        notes: `Kiện hàng demo số ${pad(pk + 1, 3)}`,
      };

      total++;
      try {
        const result = await WmsPackage.create(packageData);
        allPackages.push(result.toObject());
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Package: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ Packages: ${inserted}/${total}`);
  return allPackages;
}

async function seedShipments(
  warehouses: any[],
  orgs: any[],
  allPackages: any[],
  opts: SeedOptions,
): Promise<void> {
  const Shipment = connection.model('Shipment', ShipmentSchema);

  if (opts.drop) {
    console.log('  Dropping existing shipments...');
    await Shipment.deleteMany({});
  }

  const statuses: ShipmentStatus[] = [
    ShipmentStatus.DELIVERED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.SHIPPED,
    ShipmentStatus.PENDING,
    ShipmentStatus.DRAFT,
    ShipmentStatus.RETURNED,
    ShipmentStatus.CANCELLED,
  ];

  const recipientNames = [
    'Nguyễn Văn A',
    'Trần Thị B',
    'Lê Hoàng C',
    'Phạm Minh D',
    'Hoàng Thu E',
    'Vũ Đức F',
    'Đặng Lan G',
    'Bùi Quốc H',
  ];

  const recipientAddresses = [
    '123 Nguyễn Trãi, Quận 1, TP.HCM',
    '456 Lê Lợi, Hoàn Kiếm, Hà Nội',
    '789 Trần Phú, Hải Châu, Đà Nẵng',
    '12 Hùng Vương, Ninh Kiều, Cần Thơ',
    '34 Bạch Đằng, Hồng Bàng, Hải Phòng',
    '56 Đinh Tiên Hoàng, Nha Trang, Khánh Hòa',
    '78 Nguyễn Huệ, Pleiku, Gia Lai',
    '90 Lý Thường Kiệt, Vinh, Nghệ An',
  ];

  let total = 0;
  let inserted = 0;

  for (const warehouse of warehouses) {
    const org = randomFrom(orgs);
    const orgPackages = allPackages
      .filter((pk) => pk.orgId.toString() === org._id.toString())
      .map((pk) => pk._id);

    // 7 shipments per warehouse (covers all statuses fully with extras)
    for (let s = 0; s < 7; s++) {
      const status = statuses[s % statuses.length];
      const carrier = randomFrom(CARRIERS);
      const isShipped = [
        ShipmentStatus.SHIPPED,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.DELIVERED,
      ].includes(status);
      const isDelivered = status === ShipmentStatus.DELIVERED;

      const shipmentData = {
        orgId: org._id,
        warehouseId: warehouse._id,
        orderIds: [`ORD-${warehouse.code}-${pad(s + 1, 4)}`],
        packageIds: orgPackages.slice(s % Math.max(1, orgPackages.length), s % Math.max(1, orgPackages.length) + 1),
        status,
        carrier,
        trackingNumber: isShipped
          ? `${carrier.split('(')[0].trim().replace(/\s+/g, '').toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${s.toString(36).padStart(2, '0')}`
          : undefined,
        recipientName: randomFrom(recipientNames),
        recipientAddress: randomFrom(recipientAddresses),
        notes: `Lô giao hàng demo – chuyến ${pad(s + 1, 3)}`,
        shippedAt: isShipped ? randomDate(14, 0) : undefined,
        deliveredAt: isDelivered ? randomDate(7, 0) : undefined,
      };

      total++;
      try {
        await Shipment.create(shipmentData);
        inserted++;
      } catch (err: any) {
        console.error(`    ✗ Shipment: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ Shipments: ${inserted}/${total}`);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function seedWms(options: SeedOptions = {}): Promise<void> {
  const opts = { ...parseArgs(), ...options };
  const warehouseLimit = opts.warehouses ?? 5;

  console.log('\n' + '='.repeat(60));
  console.log('WMS DEMO DATA SEEDING');
  console.log('='.repeat(60));

  if (opts.dryRun) {
    console.log('DRY RUN – no database changes will be made');
    console.log(`Would seed WMS data for up to ${warehouseLimit} warehouses`);
    return;
  }

  // Connect only when not already connected (e.g. called from seed-all)
  if (connection.readyState !== 1) {
    await connectToDatabase();
  }

  // Register models
  const Warehouse = connection.model('Warehouse', WarehouseSchema);
  const Product = connection.model('Product', ProductSchema);
  const Organization = connection.model('Organization', OrganizationSchema);

  // Fetch prerequisite data
  console.log('\nFetching prerequisite data...');
  const [warehouses, products, orgs] = await Promise.all([
    Warehouse.find({ deletedAt: null }).limit(warehouseLimit).lean(),
    Product.find({ deletedAt: null }).limit(30).lean(),
    Organization.find({ deletedAt: null }).limit(10).lean(),
  ]);

  if (warehouses.length === 0) {
    throw new Error('No warehouses found. Please run seed-warehouses first.');
  }
  if (products.length === 0) {
    throw new Error('No products found. Please seed products first.');
  }
  if (orgs.length === 0) {
    throw new Error(
      'No organizations found. Please run seed-organizations first.',
    );
  }

  console.log(
    `Found: ${warehouses.length} warehouses, ${products.length} products, ${orgs.length} organizations`,
  );

  // --- Zones ---
  let warehouseZonesMap = new Map<string, any[]>();
  if (!opts.skipZones) {
    console.log('\n[1/9] Seeding zones...');
    warehouseZonesMap = await seedZones(warehouses, opts);
  } else {
    console.log('\n[1/9] Skipping zones');
    // Re-load existing zones from DB
    const ZoneModel = connection.model('Zone', ZoneSchema);
    for (const wh of warehouses) {
      const existingZones = await ZoneModel.find({ warehouseId: wh._id as any }).lean();
      warehouseZonesMap.set(wh._id.toString(), existingZones);
    }
  }

  // --- Aisles ---
  let zoneAislesMap = new Map<string, any[]>();
  if (!opts.skipAisles) {
    console.log('[2/9] Seeding aisles...');
    zoneAislesMap = await seedAisles(warehouseZonesMap, opts);
  } else {
    console.log('[2/9] Skipping aisles');
    const AisleModel = connection.model('Aisle', AisleSchema);
    for (const zones of warehouseZonesMap.values()) {
      for (const zone of zones) {
        const aisles = await AisleModel.find({ zoneId: zone._id as any }).lean();
        zoneAislesMap.set(zone._id.toString(), aisles);
      }
    }
  }

  // --- Bins ---
  let allBins: any[] = [];
  if (!opts.skipBins) {
    console.log('[3/9] Seeding bins...');
    allBins = await seedBins(zoneAislesMap, opts);
  } else {
    console.log('[3/9] Skipping bins');
    const BinModel = connection.model('Bin', BinSchema);
    for (const aisles of zoneAislesMap.values()) {
      for (const aisle of aisles) {
        const bins = await BinModel.find({ aisleId: aisle._id as any }).lean();
        allBins.push(...bins);
      }
    }
  }

  // --- Lots ---
  let allLots: any[] = [];
  if (!opts.skipLots) {
    console.log('[4/9] Seeding lots (batch tracking)...');
    allLots = await seedLots(products, orgs, opts);
  } else {
    console.log('[4/9] Skipping lots');
    const LotModel = connection.model('Lot', LotSchema);
    allLots = await LotModel.find().lean();
  }

  // --- Serials ---
  if (!opts.skipSerials) {
    console.log('[5/9] Seeding serials...');
    await seedSerials(products, allBins, allLots, orgs, opts);
  } else {
    console.log('[5/9] Skipping serials');
  }

  // --- Receipts ---
  let allReceipts: any[] = [];
  if (!opts.skipReceipts) {
    console.log('[6/9] Seeding receipts (inbound)...');
    allReceipts = await seedReceipts(warehouses, orgs, products, allLots, opts);
  } else {
    console.log('[6/9] Skipping receipts');
  }

  // --- Picklists ---
  let allPicklists: any[] = [];
  if (!opts.skipPicklists) {
    console.log('[7/9] Seeding picklists...');
    allPicklists = await seedPicklists(warehouses, orgs, products, allLots, opts);
  } else {
    console.log('[7/9] Skipping picklists');
    const PicklistModel = connection.model('Picklist', PicklistSchema);
    allPicklists = await PicklistModel.find().lean();
  }

  // --- Packages ---
  let allPackages: any[] = [];
  if (!opts.skipPackages) {
    console.log('[8/9] Seeding WMS packages...');
    allPackages = await seedPackages(orgs, allPicklists, opts);
  } else {
    console.log('[8/9] Skipping packages');
    const PkgModel = connection.model('WmsPackage', WmsPackageSchema);
    allPackages = await PkgModel.find().lean();
  }

  // --- Shipments ---
  if (!opts.skipShipments) {
    console.log('[9/9] Seeding shipments (outbound)...');
    await seedShipments(warehouses, orgs, allPackages, opts);
  } else {
    console.log('[9/9] Skipping shipments');
  }

  console.log('\n' + '='.repeat(60));
  console.log('WMS SEEDING COMPLETE');
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  seedWms()
    .then(async () => {
      console.log('\n✓ WMS seeding completed successfully!');
      if (connection.readyState === 1) {
        await connection.close();
        console.log('Database connection closed');
      }
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n✗ WMS seeding failed:', err);
      if (connection.readyState === 1) {
        await connection.close();
      }
      process.exit(1);
    });
}
