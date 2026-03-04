#!/usr/bin/env ts-node

/**
 * Master seed script to run all database seed operations
 *
 * Usage:
 *   ts-node scripts/seeds/seed-all.ts [options]
 *
 * Options:
 *   --drop              Drop existing data before seeding (requires --confirm)
 *   --confirm           Confirm destructive operations
 *   --dry-run           Validate without writing to database
 *   --skip-provinces    Skip provinces seeding
 *   --skip-wards        Skip wards seeding
 *   --skip-roles        Skip roles seeding
 *   --skip-organizations Skip organizations seeding
 *   --skip-users        Skip users seeding
 *   --skip-warehouse-types  Skip warehouse types seeding
 *   --skip-warehouses   Skip warehouses seeding
 *   --skip-relations    Skip relationships seeding
 *   --skip-navigation   Skip navigation seeding
 *   --warehouse-count   Number of sample warehouses to create (default: 20)
 *   --org-count         Number of organizations to create (default: 500)
 *   --user-count        Number of regular users to create (default: 10000)
 *   --seed-superadmin-password  Password for SuperAdmin user (generates random if not provided)
 */

import 'tsconfig-paths/register';
import { seedProvincesFromGeoJSON } from './seed-provinces';
import { seedWardsFromGeoJSON } from './seed-wards';
import { seedRoles } from './seed-roles';
import { seedOrganizations } from './seed-organizations';
import { seedUsers } from './seed-users';
import { seedWarehouseTypes } from './seed-warehouse-types';
import { seedWarehouses } from './seed-warehouses';
import { seedRelations } from './seed-relations';
import { seedNavigation } from './seed-navigation';
import { seedProductTypes } from './seed-product-types';
import { seedProductCategories } from './seed-product-categories';
import { seedWms } from './seed-wms';

require('dotenv').config();

interface Options {
  drop?: boolean;
  confirm?: boolean;
  dryRun?: boolean;
  skipProvinces?: boolean;
  skipWards?: boolean;
  skipRoles?: boolean;
  skipOrganizations?: boolean;
  skipUsers?: boolean;
  skipWarehouseTypes?: boolean;
  skipWarehouses?: boolean;
  skipRelations?: boolean;
  skipNavigation?: boolean;
  skipProductTypes?: boolean;
  skipProductCategories?: boolean;
  skipWms?: boolean;
  warehouseCount?: number;
  orgCount?: number;
  userCount?: number;
  seedSuperadminPassword?: string;
}

function parseArgs(): Options {
  const opts: Options = {};
  // Collect args from multiple sources to be robust for different npm invocations:
  // 1) process.argv when running directly with ts-node
  // 2) npm injected args via npm_config_argv (when callers use wrong dash placement)
  // 3) individual npm_config_* env flags (npm converts --flag to npm_config_flag)
  const argvFromProcess = process.argv.slice(2);

  console.log('DEBUG: process.argv:', process.argv);
  console.log('DEBUG: argvFromProcess:', argvFromProcess);
  console.log('DEBUG: npm_config_argv:', process.env.npm_config_argv);

  const argvFromNpm: string[] = [];
  if (process.env.npm_config_argv) {
    try {
      const parsed = JSON.parse(process.env.npm_config_argv as string);
      console.log('DEBUG: parsed npm_config_argv:', parsed);
      if (parsed && Array.isArray(parsed.original)) {
        // original often looks like ["run","db:seed:all","--","--drop"]
        // remove 'run' and the lifecycle event name and the literal '--'
        const lifecycle = process.env.npm_lifecycle_event;
        parsed.original.forEach((item: string) => {
          if (item === 'run' || item === lifecycle || item === '--') return;
          argvFromNpm.push(item);
        });
      }
    } catch (e) {
      // ignore parse errors
      console.log('DEBUG: npm_config_argv parse error:', e);
    }
  }
  console.log('DEBUG: argvFromNpm:', argvFromNpm);

  // Check for npm_config_<flag> env vars for flags passed without --
  // Support both boolean flags and key/value flags (e.g., npm_config_org_count=100)
  const possibleFlags = [
    'drop',
    'confirm',
    'dry-run',
    'skip-provinces',
    'skip-wards',
    'skip-roles',
    'skip-organizations',
    'skip-users',
    'skip-warehouse-types',
    'skip-warehouses',
    'skip-relations',
    'skip-navigation',
    'skip-product-types',
    'skip-product-categories',
    'skip-wms',
    'warehouse-count',
    'org-count',
    'user-count',
    'seed-superadmin-password',
  ];
  const argvFromEnvFlags: string[] = [];
  possibleFlags.forEach((flag) => {
    // npm converts dashes to underscores in env var names
    const envName = `npm_config_${flag.replace(/-/g, '_')}`;
    const val = process.env[envName];
    if (typeof val !== 'undefined') {
      console.log(`DEBUG: Found env ${envName}=${val}`);
      // If val is 'true' or empty string, treat as boolean flag
      if (val === 'true' || val === '') {
        argvFromEnvFlags.push(`--${flag}`);
      } else {
        // For key/value flags, include both the flag and the value
        argvFromEnvFlags.push(`--${flag}`);
        argvFromEnvFlags.push(String(val));
      }
    }
  });
  console.log('DEBUG: argvFromEnvFlags:', argvFromEnvFlags);

  // Combine args from all sources (don't dedupe - values may repeat legitimately)
  const combined = [...argvFromProcess, ...argvFromNpm, ...argvFromEnvFlags];
  console.log('DEBUG: combined args:', combined);

  // Expand any --key=value style args into ['--key', 'value'] for easier parsing
  const expandedArgs: string[] = [];
  combined.forEach((a) => {
    if (typeof a === 'string' && a.startsWith('--') && a.includes('=')) {
      const [k, ...rest] = a.split('=');
      const v = rest.join('=');
      expandedArgs.push(k);
      if (v.length > 0) expandedArgs.push(v);
    } else {
      expandedArgs.push(a);
    }
  });
  console.log('DEBUG: expandedArgs:', expandedArgs);

  for (let i = 0; i < expandedArgs.length; i++) {
    const arg = expandedArgs[i];
    switch (arg) {
      case '--drop':
        opts.drop = true;
        break;
      case '--confirm':
        opts.confirm = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--skip-provinces':
        opts.skipProvinces = true;
        break;
      case '--skip-wards':
        opts.skipWards = true;
        break;
      case '--skip-roles':
        opts.skipRoles = true;
        break;
      case '--skip-organizations':
        opts.skipOrganizations = true;
        break;
      case '--skip-users':
        opts.skipUsers = true;
        break;
      case '--skip-warehouse-types':
        opts.skipWarehouseTypes = true;
        break;
      case '--skip-warehouses':
        opts.skipWarehouses = true;
        break;
      case '--skip-relations':
        opts.skipRelations = true;
        break;
      case '--skip-navigation':
        opts.skipNavigation = true;
        break;
      case '--skip-product-types':
        opts.skipProductTypes = true;
        break;
      case '--skip-product-categories':
        opts.skipProductCategories = true;
        break;
      case '--skip-wms':
        opts.skipWms = true;
        break;
      case '--warehouse-count':
        if (expandedArgs[i + 1]) {
          opts.warehouseCount = parseInt(expandedArgs[i + 1], 10);
          i++;
        }
        break;
      case '--org-count':
        if (expandedArgs[i + 1]) {
          opts.orgCount = parseInt(expandedArgs[i + 1], 10);
          i++;
        }
        break;
      case '--user-count':
        if (expandedArgs[i + 1]) {
          opts.userCount = parseInt(expandedArgs[i + 1], 10);
          i++;
        }
        break;
      case '--seed-superadmin-password':
        if (expandedArgs[i + 1]) {
          opts.seedSuperadminPassword = expandedArgs[i + 1];
          i++;
        }
        break;
    }
  }

  return opts;
}

async function seedAll() {
  const opts = parseArgs();

  console.log('='.repeat(60));
  console.log(JSON.stringify(opts, null, 2));
  console.log('='.repeat(60));

  // Validate destructive operations
  if (opts.drop && !opts.confirm) {
    console.error('ERROR: --drop requires --confirm flag for safety');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('DATABASE SEED - ALL OPERATIONS');
  console.log('='.repeat(60));
  console.log('');
  console.log('Options:');
  console.log(`  Drop existing data: ${opts.drop ? 'YES' : 'NO'}`);
  console.log(`  Dry run: ${opts.dryRun ? 'YES' : 'NO'}`);
  console.log(`  Organization count: ${opts.orgCount || 500}`);
  console.log(`  User count: ${opts.userCount || 100}`);
  console.log(`  Warehouse count: ${opts.warehouseCount || 20}`);
  console.log('');

  const results: {
    name: string;
    success: boolean;
    error?: string;
    stats?: any;
  }[] = [];

  // 1. Seed Provinces
  if (!opts.skipProvinces) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: Seeding Provinces from GeoJSON');
    console.log('='.repeat(60));
    try {
      const stats = await seedProvincesFromGeoJSON({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Provinces', success: true, stats });
      console.log('✓ Provinces seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Provinces', success: false, error: errorMsg });
      console.error('✗ Provinces seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err; // Stop on error unless dry-run
      }
    }
  } else {
    console.log('\nSkipping provinces seeding');
  }

  // 2. Seed Wards
  if (!opts.skipWards) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Seeding Wards from GeoJSON');
    console.log('='.repeat(60));
    try {
      const stats = await seedWardsFromGeoJSON({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Wards', success: true, stats });
      console.log('✓ Wards seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Wards', success: false, error: errorMsg });
      console.error('✗ Wards seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping wards seeding');
  }

  // 3. Seed Roles
  if (!opts.skipRoles) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Seeding System Roles');
    console.log('='.repeat(60));
    try {
      const stats = await seedRoles({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Roles', success: true, stats });
      console.log('✓ Roles seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Roles', success: false, error: errorMsg });
      console.error('✗ Roles seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping roles seeding');
  }

  // 4. Seed Organizations
  if (!opts.skipOrganizations) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Seeding Organizations');
    console.log('='.repeat(60));
    try {
      const stats = await seedOrganizations({
        drop: opts.drop,
        dryRun: opts.dryRun,
        count: opts.orgCount || 500,
        batchSize: 100,
      });
      results.push({ name: 'Organizations', success: true, stats });
      console.log('✓ Organizations seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Organizations', success: false, error: errorMsg });
      console.error('✗ Organizations seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping organizations seeding');
  }

  // 5. Seed Users
  if (!opts.skipUsers) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 5: Seeding Users (1 SuperAdmin + Regular Users)');
    console.log('='.repeat(60));
    try {
      const stats = await seedUsers({
        drop: opts.drop,
        dryRun: opts.dryRun,
        count: opts.userCount || 100,
        batchSize: 500,
        seedSuperadminPassword: opts.seedSuperadminPassword,
        domain: 'example.com',
      });
      results.push({ name: 'Users', success: true, stats });
      console.log('✓ Users seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Users', success: false, error: errorMsg });
      console.error('✗ Users seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping users seeding');
  }

  // 6. Seed Warehouse Types
  if (!opts.skipWarehouseTypes) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6: Seeding Warehouse Types');
    console.log('='.repeat(60));
    try {
      const stats = await seedWarehouseTypes({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Warehouse Types', success: true, stats });
      console.log('✓ Warehouse types seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({
        name: 'Warehouse Types',
        success: false,
        error: errorMsg,
      });
      console.error('✗ Warehouse types seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping warehouse types seeding');
  }

  // 7. Seed Sample Warehouses
  if (!opts.skipWarehouses) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 7: Seeding Sample Warehouses');
    console.log('='.repeat(60));
    try {
      const stats = await seedWarehouses({
        drop: opts.drop,
        dryRun: opts.dryRun,
        count: opts.warehouseCount || 20,
      });
      results.push({ name: 'Warehouses', success: true, stats });
      console.log('✓ Warehouses seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Warehouses', success: false, error: errorMsg });
      console.error('✗ Warehouses seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping warehouses seeding');
  }

  // 8. Seed Relationships (User-Role-Organization)
  if (!opts.skipRelations) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 8: Seeding Relationships (User-Role-Organization)');
    console.log('='.repeat(60));
    try {
      const stats = await seedRelations({
        drop: opts.drop,
        dryRun: opts.dryRun,
        batchSize: 100,
      });
      results.push({ name: 'Relations', success: true, stats });
      console.log('✓ Relations seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Relations', success: false, error: errorMsg });
      console.error('✗ Relations seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping relations seeding');
  }

  // 9. Seed Navigation
  if (!opts.skipNavigation) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 9: Seeding Navigation');
    console.log('='.repeat(60));
    try {
      const stats = await seedNavigation({
        drop: opts.drop,
        dryRun: opts.dryRun,
        confirm: opts.confirm,
      });
      results.push({ name: 'Navigation', success: true, stats });
      console.log('✓ Navigation seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Navigation', success: false, error: errorMsg });
      console.error('✗ Navigation seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping navigation seeding');
  }

  // 10. Seed Product Types
  if (!opts.skipProductTypes) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 10: Seeding Product Types');
    console.log('='.repeat(60));
    try {
      const stats = await seedProductTypes({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Product Types', success: true, stats });
      console.log('✓ Product Types seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'Product Types', success: false, error: errorMsg });
      console.error('✗ Product Types seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping product types seeding');
  }

  // 11. Seed Product Categories
  if (!opts.skipProductCategories) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 11: Seeding Product Categories');
    console.log('='.repeat(60));
    try {
      const stats = await seedProductCategories({
        drop: opts.drop,
        dryRun: opts.dryRun,
      });
      results.push({ name: 'Product Categories', success: true, stats });
      console.log('✓ Product Categories seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({
        name: 'Product Categories',
        success: false,
        error: errorMsg,
      });
      console.error('✗ Product Categories seeding failed:', errorMsg);
      if (!opts.dryRun) {
        throw err;
      }
    }
  } else {
    console.log('\nSkipping product categories seeding');
  }

  // 12. Seed WMS Demo Data
  if (!opts.skipWms) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 12: Seeding WMS Demo Data');
    console.log('='.repeat(60));
    try {
      await seedWms({
        drop: opts.drop,
        dryRun: opts.dryRun,
        warehouses: Math.min(opts.warehouseCount || 5, 5),
      });
      results.push({ name: 'WMS Demo Data', success: true });
      console.log('✓ WMS demo data seeding completed successfully');
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      results.push({ name: 'WMS Demo Data', success: false, error: errorMsg });
      console.error('✗ WMS demo data seeding failed:', errorMsg);
      // Non-fatal: WMS data depends on products which may not exist yet
    }
  } else {
    console.log('\nSkipping WMS demo data seeding');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  results.forEach((result) => {
    const status = result.success ? '✓' : '✗';
    console.log(
      `${status} ${result.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    );
    if (result.stats) {
      console.log(`  Stats:`, JSON.stringify(result.stats, null, 2));
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log('');
  console.log(`Total: ${results.length} operations`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('='.repeat(60));

  if (failCount > 0 && !opts.dryRun) {
    process.exit(1);
  }
}

if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('\n✓ All seeding operations completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n✗ Seeding failed:', err);
      process.exit(1);
    });
}

export { seedAll };
