#!/usr/bin/env ts-node

/**
 * First-run initialization entry point.
 *
 * Checks which seeds have not yet been executed and runs only the missing ones.
 * Idempotent: safe to call multiple times — already-seeded steps are skipped
 * unless SEED_FORCE=true is set.
 *
 * Usage (direct):
 *   ts-node -r tsconfig-paths/register scripts/seeds/first-run-init.ts
 *
 * Usage (via docker entrypoint):
 *   SEED_ON_INIT=true docker-compose up
 *
 * Environment variables:
 *   SEED_FORCE                - Set to "true" to re-run all seeds even if already run
 *   SEED_SUPERADMIN_PASSWORD  - Password for the SuperAdmin user
 */

import 'tsconfig-paths/register';

require('dotenv').config();

import { seedAll } from './seed-all';

async function firstRunInit() {
  console.log('='.repeat(60));
  console.log('OPEN-ERP FIRST-RUN INITIALIZATION');
  console.log('='.repeat(60));
  console.log('');

  const force = process.env.SEED_FORCE === 'true' || process.env.SEED_FORCE === '1';
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD;

  if (force) {
    console.log('ℹ️  SEED_FORCE=true — all seeds will be re-run regardless of previous state');
  }

  // Build process.argv-compatible args so seedAll's parseArgs picks them up
  const extraArgs: string[] = [];
  if (force) extraArgs.push('--force');
  if (superadminPassword) {
    extraArgs.push('--seed-superadmin-password', superadminPassword);
  }

  // Inject into process.argv (seed-all.ts reads from process.argv.slice(2))
  process.argv = [...process.argv.slice(0, 2), ...extraArgs];

  await seedAll();

  console.log('\n' + '='.repeat(60));
  console.log('✓ First-run initialization complete');
  console.log('='.repeat(60));
}

if (require.main === module) {
  firstRunInit()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ First-run initialization failed:', err);
      process.exit(1);
    });
}

export { firstRunInit };
