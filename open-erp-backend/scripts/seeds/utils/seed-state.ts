/**
 * SeedStateTracker — Tracks seed execution state in MongoDB collection `seed_metadata`.
 *
 * Provides idempotency: seeds can safely be skipped if already run at the same version.
 */

import { connection, Schema, Model, Document } from 'mongoose';
import type { SeedStats } from './seed-utils';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SeedMetadata {
  name: string;
  version: string;
  runAt: Date;
  duration: number;
  stats: SeedStats;
  checksum?: string;
  environment: string;
}

interface SeedMetadataDocument extends SeedMetadata, Document {}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SeedMetadataSchema = new Schema<SeedMetadataDocument>(
  {
    name: { type: String, required: true },
    version: { type: String, required: true },
    runAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    stats: {
      total: { type: Number, default: 0 },
      inserted: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
    },
    checksum: { type: String },
    environment: { type: String, required: true },
  },
  {
    collection: 'seed_metadata',
    timestamps: false,
  },
);

// Unique index: one record per seed name + version + environment
SeedMetadataSchema.index({ name: 1, version: 1, environment: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// SeedStateTracker class
// ---------------------------------------------------------------------------

export class SeedStateTracker {
  private model: Model<SeedMetadataDocument>;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    // Register model only once (guard against duplicate model error)
    this.model =
      (connection.models['SeedMetadata'] as Model<SeedMetadataDocument>) ||
      connection.model<SeedMetadataDocument>('SeedMetadata', SeedMetadataSchema);
  }

  /**
   * Returns true if the seed has already been executed successfully at the given version
   * in the current environment.
   */
  async hasRun(seedName: string, version: string = '1.0.0'): Promise<boolean> {
    try {
      const record = await this.model.findOne({
        name: seedName,
        version,
        environment: this.environment,
      });
      return record !== null;
    } catch {
      // If collection or connection has issues, treat as not run (safe default)
      return false;
    }
  }

  /**
   * Records a successful seed execution.
   */
  async markComplete(
    seedName: string,
    version: string,
    stats: SeedStats,
    durationMs: number,
    checksum?: string,
  ): Promise<void> {
    const doc: SeedMetadata = {
      name: seedName,
      version,
      runAt: new Date(),
      duration: durationMs,
      stats,
      environment: this.environment,
      ...(checksum ? { checksum } : {}),
    };

    await this.model.findOneAndUpdate(
      { name: seedName, version, environment: this.environment },
      { $set: doc },
      { upsert: true, new: true },
    );
  }

  /**
   * Returns all seed metadata records sorted by runAt desc.
   */
  async getStatus(): Promise<SeedMetadata[]> {
    const records = await this.model.find().sort({ runAt: -1 }).lean();
    return records as unknown as SeedMetadata[];
  }

  /**
   * Pretty-prints the current seed status to console.
   */
  async printStatus(): Promise<void> {
    const records = await this.getStatus();

    console.log('\n' + '='.repeat(70));
    console.log('SEED STATUS');
    console.log('='.repeat(70));
    console.log(`Environment: ${this.environment}`);
    console.log('');

    if (records.length === 0) {
      console.log('No seeds have been executed yet.');
    } else {
      const header = `${'Seed Name'.padEnd(30)} ${'Version'.padEnd(10)} ${'Run At'.padEnd(25)} ${'Duration'.padEnd(10)} Status`;
      console.log(header);
      console.log('-'.repeat(header.length));

      for (const r of records) {
        const runAt = new Date(r.runAt).toISOString().replace('T', ' ').slice(0, 19);
        const duration = `${r.duration}ms`;
        console.log(
          `${r.name.padEnd(30)} ${r.version.padEnd(10)} ${runAt.padEnd(25)} ${duration.padEnd(10)} ✓`,
        );
      }
    }

    console.log('='.repeat(70));
  }
}
