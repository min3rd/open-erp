#!/usr/bin/env ts-node

/**
 * Seed provinces from a GeoJSON FeatureCollection file
 *
 * Usage:
 *   ts-node scripts/seeds/seed-provinces.ts [options]
 *
 * Options:
 *   --file <path>       Path to GeoJSON file (default: scripts/data/Việt Nam (tỉnh thành) - 34.geojson)
 *   --drop              Drop existing provinces before seeding
 *   --dry-run           Validate without writing to database
 *   --source <name>     Geometry source identifier (default: gov)
 *   --limit <n>         Limit number of features to process
 *   --skip <n>          Skip first n features
 */

import 'tsconfig-paths/register';
import { connection } from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import bbox from '@turf/bbox';
import centroid from '@turf/centroid';
import area from '@turf/area';
import type { FeatureCollection, Feature, GeoJsonProperties } from 'geojson';

import { ProvinceSchema } from '@shared/schemas/province.schema';
import { GeometrySource } from '@shared/types/geometry.types';
import { connectToDatabase } from './utils/seed-utils';

require('dotenv').config();

interface SeedOptions {
  file?: string;
  drop?: boolean;
  dryRun?: boolean;
  source?: string;
  limit?: number;
  skip?: number;
}

interface SeedStats {
  total: number;
  upserted: number;
  skipped: number;
  errors: number;
}

function parseArgs(): SeedOptions {
  const opts: SeedOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--file':
        if (args[i + 1]) {
          opts.file = args[i + 1];
          i++;
        }
        break;
      case '--drop':
        opts.drop = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--source':
        if (args[i + 1]) {
          opts.source = args[i + 1];
          i++;
        }
        break;
      case '--limit':
        if (args[i + 1]) {
          opts.limit = parseInt(args[i + 1], 10);
          i++;
        }
        break;
      case '--skip':
        if (args[i + 1]) {
          opts.skip = parseInt(args[i + 1], 10);
          i++;
        }
        break;
    }
  }

  return opts;
}

/**
 * Seed provinces from GeoJSON file
 */
export async function seedProvincesFromGeoJSON(
  options: SeedOptions = {},
): Promise<SeedStats> {
  const opts = { ...parseArgs(), ...options };

  const defaultFile = path.resolve(
    __dirname,
    '..',
    'data',
    'Việt Nam (tỉnh thành) - 34.geojson',
  );
  const filePath = opts.file
    ? path.resolve(process.cwd(), opts.file)
    : defaultFile;
  const geomSource = (opts.source as any) || GeometrySource.GOV;

  console.log(`Reading GeoJSON from: ${filePath}`);

  const stats: SeedStats = {
    total: 0,
    upserted: 0,
    skipped: 0,
    errors: 0,
  };

  // Read and parse GeoJSON file
  const raw = await fs.readFile(filePath, { encoding: 'utf8' });
  let parsed: FeatureCollection | null = null;

  try {
    parsed = JSON.parse(raw) as FeatureCollection;
  } catch (err) {
    console.error('Failed to parse GeoJSON file:', err);
    throw new Error('Invalid GeoJSON file');
  }

  if (
    !parsed ||
    parsed.type !== 'FeatureCollection' ||
    !Array.isArray(parsed.features)
  ) {
    throw new Error('Provided file is not a valid FeatureCollection');
  }

  console.log(`Found ${parsed.features.length} features in GeoJSON`);

  if (opts.dryRun) {
    console.log('DRY RUN MODE - No database changes will be made');
  }

  // Connect to database
  if (!opts.dryRun) {
    await connectToDatabase();
  }

  const Province = connection.model('Province', ProvinceSchema);

  try {
    // Drop existing data if requested
    if (opts.drop && !opts.dryRun) {
      console.log('Dropping existing provinces collection...');
      await Province.deleteMany({});
      console.log('✓ Collection dropped');
    }

    // Process features
    const featuresToProcess = parsed.features.slice(
      opts.skip || 0,
      opts.limit ? (opts.skip || 0) + opts.limit : undefined,
    );

    stats.total = featuresToProcess.length;
    console.log(`Processing ${stats.total} features...`);

    for (const feat of featuresToProcess) {
      const props: any = (feat.properties || {}) as GeoJsonProperties;

      // Extract code and name from various property names used in Vietnamese datasets
      const code = String(
        props.ma_tinh ??
          props.code ??
          props.id ??
          props.Ma ??
          props['GID_1'] ??
          '',
      ).trim();

      const name = String(
        props.ten_tinh ?? props.TEN_TINH ?? props.name ?? props.NAME ?? '',
      ).trim();

      if (!code || !name) {
        console.warn('⚠ Skipping feature with missing code/name:', props);
        stats.skipped++;
        continue;
      }

      const geom = feat.geometry ?? null;

      // Compute bbox, centroid, area where possible
      let bb: number[] | undefined;
      let ctr: { lat: number; lon: number } | undefined;
      let areaSqKm: number | undefined;

      try {
        if (geom) {
          bb = bbox(feat);
          const c = centroid(feat);
          if (c?.geometry && Array.isArray((c.geometry as any).coordinates)) {
            const [lon, lat] = (c.geometry as any).coordinates as [
              number,
              number,
            ];
            ctr = { lat, lon };
          }
          const a = area(feat); // in square meters
          areaSqKm = Math.round((a / 1_000_000) * 1e6) / 1e6; // km^2 rounded
        }
      } catch (err) {
        console.warn(`⚠ Failed to compute geometry metrics for ${code}:`, err);
      }

      const updateDoc: any = {
        code,
        name,
        version: '1.0',
        isLegacy: false,
        geometry: geom || undefined,
        centroid: ctr || undefined,
        bbox: bb || undefined,
        areaSqKm: areaSqKm || undefined,
        geometrySource: geom ? geomSource : undefined,
        geometryVersion: geom ? 1 : undefined,
        geometryUpdatedAt: geom ? new Date() : undefined,
        geometryUpdatedBy: geom ? 'seed-provinces' : undefined,
      };

      if (opts.dryRun) {
        console.log(`[DRY RUN] Would upsert province: ${code} - ${name}`);
        stats.upserted++;
      } else {
        try {
          const res = await Province.updateOne(
            { code },
            { $set: updateDoc, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );

          if (res.upsertedCount || res.matchedCount) {
            stats.upserted++;
          }
        } catch (err) {
          console.error(`✗ Error upserting province ${code}:`, err);
          stats.errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('PROVINCES SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total features: ${stats.total}`);
    console.log(`Upserted: ${stats.upserted}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    if (!opts.dryRun && connection.readyState === 1) {
      await connection.close();
      console.log('Database connection closed');
    }
  }

  return stats;
}

// Run as standalone script
if (require.main === module) {
  seedProvincesFromGeoJSON()
    .then((stats) => {
      console.log('\n✓ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n✗ Seeding failed:', err);
      process.exit(1);
    });
}
