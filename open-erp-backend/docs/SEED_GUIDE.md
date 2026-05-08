# Seed Guide — OpenERP Backend

## Overview

OpenERP uses a standardized, idempotent seed system. Seeds are tracked in the `seed_metadata` MongoDB collection — each seed step is recorded after a successful run, so subsequent runs automatically skip already-seeded steps. Use `--force` to override.

---

## Quick Start

```bash
# Run all seeds (skips already-seeded steps)
npm run db:seed:all

# Check status of all seeds
npm run db:seed:status

# Re-run all seeds (force even if already seeded)
npm run db:seed:force

# Run first-run initialization (idempotent, same as db:seed:all)
npm run db:init
```

---

## Command Reference

| Command | Description |
|---|---|
| `npm run db:seed:all` | Run all seeds (skip already-seeded steps) |
| `npm run db:seed:status` | Display which seeds have been run and when |
| `npm run db:seed:force` | Force re-run all seeds regardless of history |
| `npm run db:init` | First-run initialization entry point |
| `npm run db:seed:provinces` | Seed provinces only |
| `npm run db:seed:wards` | Seed wards only |
| `npm run db:seed:roles` | Seed roles only |
| `npm run db:seed:organizations` | Seed organizations only |
| `npm run db:seed:users` | Seed users only |
| `npm run db:seed:warehouse-types` | Seed warehouse types only |
| `npm run db:seed:warehouses` | Seed warehouses only |
| `npm run db:seed:relations` | Seed user-role-organization relations only |
| `npm run db:seed:navigation` | Seed navigation structure only |
| `npm run db:seed:product-types` | Seed product types only |
| `npm run db:seed:product-categories` | Seed product categories only |
| `npm run db:seed:wms` | Seed WMS demo data only |

---

## CLI Flags (seed-all.ts)

| Flag | Description |
|---|---|
| `--dry-run` | Preview what would be seeded without writing to DB |
| `--drop` | Drop collections before seeding (destructive!) |
| `--confirm` | Skip interactive confirmation prompts |
| `--force` | Re-run all seeds even if already recorded in seed_metadata |
| `--status` | Print seed status and exit without seeding |
| `--seed-superadmin-password <pw>` | Set SuperAdmin password explicitly |
| `--skip-provinces` | Skip seeding provinces |
| `--skip-wards` | Skip seeding wards |
| `--skip-roles` | Skip seeding roles |
| `--skip-organizations` | Skip seeding organizations |
| `--skip-users` | Skip seeding users |
| `--skip-warehouse-types` | Skip seeding warehouse types |
| `--skip-warehouses` | Skip seeding warehouses |
| `--skip-relations` | Skip seeding relations |
| `--skip-navigation` | Skip seeding navigation |
| `--skip-product-types` | Skip seeding product types |
| `--skip-product-categories` | Skip seeding product categories |
| `--skip-wms` | Skip seeding WMS demo data |

---

## Seed Execution Order & Dependencies

```
1. Provinces          (no dependencies)
2. Wards              (depends on: Provinces)
3. Roles              (no dependencies)
4. Organizations      (no dependencies)
5. Users              (depends on: Roles, Organizations)
6. Warehouse Types    (no dependencies)
7. Warehouses         (depends on: Organizations, Warehouse Types)
8. Relations          (depends on: Users, Roles, Organizations)
9. Navigation         (no dependencies)
10. Product Types     (no dependencies)
11. Product Categories (depends on: Product Types)
12. WMS Demo Data     (depends on: Warehouses — non-fatal if missing)
```

---

## Idempotency & State Tracking

Seeds use the `seed_metadata` collection in MongoDB to track execution state.

```json
{
  "name": "provinces",
  "version": "1.0.0",
  "environment": "development",
  "ranAt": "2024-01-15T10:30:00Z",
  "durationMs": 4200,
  "stats": {
    "total": 63,
    "inserted": 63,
    "updated": 0,
    "skipped": 0,
    "errors": 0
  }
}
```

### Check status via CLI

```bash
npm run db:seed:status
```

### Check status via MongoDB shell

```js
db.seed_metadata.find({}, { name: 1, version: 1, environment: 1, ranAt: 1 })
```

---

## Docker Initialization

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SEED_ON_INIT` | `false` | Set to `true` to run seeds when the container starts |
| `SEED_FORCE` | `false` | Set to `true` to re-run all seeds (ignores metadata) |
| `SEED_SUPERADMIN_PASSWORD` | _(empty)_ | SuperAdmin password (use a strong value in production) |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |

### Docker Compose — Development

In `docker-compose.dev.yml`, a `db-seed` service runs once on startup:

```bash
docker compose -f docker-compose.dev.yml up
```

Seeds run automatically because `SEED_ON_INIT=true` is the default in dev.

Override behavior:

```bash
# Force re-seed in dev
SEED_FORCE=true docker compose -f docker-compose.dev.yml up db-seed

# Disable auto-seed
SEED_ON_INIT=false docker compose -f docker-compose.dev.yml up
```

### Docker Compose — Production

In `docker-compose.yml`, seeding is disabled by default (`SEED_ON_INIT=false`).  
Enable seeding for the first deployment:

```bash
SEED_ON_INIT=true SEED_SUPERADMIN_PASSWORD=<strong-password> docker compose up
```

On subsequent restarts, seeds are skipped automatically (idempotent).

---

## Files Structure

```
scripts/
├── seeds/
│   ├── seed-all.ts               ← Master orchestrator
│   ├── first-run-init.ts         ← Docker/CI initialization entry point
│   ├── seed-provinces.ts
│   ├── seed-wards.ts
│   ├── seed-roles.ts
│   ├── seed-organizations.ts
│   ├── seed-users.ts
│   ├── seed-warehouse-types.ts
│   ├── seed-warehouses.ts
│   ├── seed-relations.ts
│   ├── seed-navigation.ts
│   ├── seed-product-types.ts
│   ├── seed-product-categories.ts
│   ├── seed-wms.ts
│   ├── seed-inventory-stock.ts
│   └── utils/
│       ├── seed-utils.ts         ← Shared utilities (single source of truth)
│       └── seed-state.ts         ← SeedStateTracker + seed_metadata schema
└── docker-init.sh                ← Docker entrypoint script
```

---

## Adding a New Seed

1. Create `scripts/seeds/seed-<name>.ts`
2. Import utilities from `./utils/seed-utils`
3. Export a named function `seed<Name>(opts: SeedOptions): Promise<SeedStats>`
4. Import and add as a new step in `seed-all.ts`:
   ```typescript
   const seedName = '<name>';
   if (!opts.force && await tracker.hasRun(seedName)) {
     console.log(`\nSkipping <Name> (already seeded — use --force to re-run)`);
     results.push({ name: '<Name>', success: true });
   } else {
     // ... run seed + markComplete
   }
   ```
5. Add `npm run db:seed:<name>` script to `package.json`
6. Update this guide

---

## Troubleshooting

**Seeds re-run every time even without `--force`**  
→ Check that `seed_metadata` collection exists and the seed ran successfully before. Use `npm run db:seed:status` to inspect.

**Seed fails with "Cannot find module '@shared/database'"**  
→ Ensure you run seeds via `ts-node -r tsconfig-paths/register`, not plain `ts-node`. Use the `npm run db:seed:*` scripts.

**SuperAdmin password warning**  
→ Always set `SEED_SUPERADMIN_PASSWORD` explicitly. If not set, a random password is generated and printed to the console once — it cannot be recovered later.

**Seed hangs / no output**  
→ Check MongoDB connection. Ensure `MONGODB_URI`, `MONGODB_USER`, `MONGODB_PASS`, `MONGODB_DB` are correctly set.
