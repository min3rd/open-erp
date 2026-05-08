#!/usr/bin/env ts-node

/**
 * Seed sample inventory stock records
 *
 * Usage:
 *   ts-node scripts/seeds/seed-inventory-stock.ts [options]
 *
 * Options:
 *   --count <n>           Number of products to consider (default: 200)
 *   --per-warehouse <n>   Products per warehouse (default: 50)
 *   --warehouses <n>      Number of warehouses to use (default: 10)
 *   --drop                Drop existing inventory_stocks before seeding
 *   --dry-run             Validate without writing to database
 */

import 'tsconfig-paths/register';
import { connection } from 'mongoose';
import { InventoryStockSchema } from '@shared/schemas/inventory-stock.schema';
import { ProductSchema } from '@shared/schemas/product.schema';
import { WarehouseSchema } from '@shared/schemas/warehouse.schema';
import { connectToDatabase } from './utils/seed-utils';

require('dotenv').config();

interface SeedOptions {
  count?: number;
  perWarehouse?: number;
  warehouses?: number;
  drop?: boolean;
  dryRun?: boolean;
}

function parseArgs(): SeedOptions {
  const opts: SeedOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--count':
        if (args[i + 1]) {
          opts.count = parseInt(args[i + 1], 10);
          i++;
        }
        break;
      case '--per-warehouse':
        if (args[i + 1]) {
          opts.perWarehouse = parseInt(args[i + 1], 10);
          i++;
        }
        break;
      case '--warehouses':
        if (args[i + 1]) {
          opts.warehouses = parseInt(args[i + 1], 10);
          i++;
        }
        break;
      case '--drop':
        opts.drop = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
    }
  }

  return opts;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedInventoryStock(options: SeedOptions = {}): Promise<any> {
  const opts = { ...parseArgs(), ...options };
  const count = opts.count || 200;
  const perWarehouse = opts.perWarehouse || 50;
  const warehousesLimit = opts.warehouses || 10;

  if (opts.dryRun) {
    console.log('DRY RUN - no database changes will be made');
    console.log(`Would create stock for ${Math.min(count, perWarehouse)} products across ${warehousesLimit} warehouses`);
    return {};
  }

  await connectToDatabase();

  const InventoryStock = connection.model('InventoryStock', InventoryStockSchema);
  const Product = connection.model('Product', ProductSchema);
  const Warehouse = connection.model('Warehouse', WarehouseSchema);

  try {
    if (opts.drop) {
      console.log('Dropping existing inventory_stocks collection...');
      await InventoryStock.deleteMany({});
      console.log('✓ Dropped inventory_stocks');
    }

    // Fetch products and warehouses
    console.log('Fetching products and warehouses...');
    const products = await Product.find({ status: { $ne: 'DRAFT' } }).limit(count).lean();
    const warehouses = await Warehouse.find({}).limit(warehousesLimit).lean();

    if (products.length === 0) {
      throw new Error('No products found. Run product seed first.');
    }
    if (warehouses.length === 0) {
      throw new Error('No warehouses found. Run warehouses seed first.');
    }

    console.log(`Using ${products.length} products and ${warehouses.length} warehouses`);

    let inserted = 0;
    for (const wh of warehouses) {
      const itemsForWarehouse = products.slice(0, perWarehouse);
      for (const p of itemsForWarehouse) {
        const available = randomInt(0, 1000);
        const reserved = randomInt(0, Math.min(50, available));
        const damaged = randomInt(0, Math.min(10, available - reserved));

        const record: any = {
          productId: p._id,
          productSnapshot: {
            id: p._id,
            sku: p.sku,
            name: p.name,
            unit: p.unit || 'UNIT',
          },
          warehouseId: wh._id,
          availableQuantity: available - reserved - damaged,
          reservedQuantity: reserved,
          damagedQuantity: damaged,
          inTransitQuantity: randomInt(0, 50),
          lots: [],
          valuationMethod: 'AVERAGE',
          averageCost: parseFloat((Math.random() * 100).toFixed(2)),
          totalValue: 0,
          zone: `Z${randomInt(1,5)}`,
          aisle: `A${randomInt(1,20)}`,
          rack: `R${randomInt(1,50)}`,
          bin: `B${randomInt(1,200)}`,
          lastMovementDate: new Date(),
        };

        record.totalValue = parseFloat((record.availableQuantity * record.averageCost).toFixed(2));

        try {
          await InventoryStock.updateOne(
            { productId: record.productId, warehouseId: record.warehouseId },
            { $set: record },
            { upsert: true },
          );
          inserted++;
        } catch (err: any) {
          console.error('Error upserting inventory stock for', p.sku, err?.message || err);
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`Inventory stock seeding complete`);
    console.log(`Inserted/Updated: ${inserted}`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Error seeding inventory stock:', err);
    throw err;
  } finally {
    if (connection.readyState === 1) {
      await connection.close();
      console.log('Database connection closed');
    }
  }
}

if (require.main === module) {
  seedInventoryStock()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
