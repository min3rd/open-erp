import { Injectable, Logger } from '@nestjs/common';
import type { StorageBucketResult, StorageProvisioningPort } from './storage-provisioning.port';

/**
 * NullStorageAdapter — Fallback when MinIO runtime is unavailable.
 * Records the intent to create a bucket without calling MinIO.
 * Used in unit tests and environments without MinIO.
 */
@Injectable()
export class NullStorageAdapter implements StorageProvisioningPort {
  private readonly logger = new Logger(NullStorageAdapter.name);

  async createBucket(bucketName: string): Promise<StorageBucketResult> {
    this.logger.warn(
      `NullStorageAdapter: bucket "${bucketName}" provisioning skipped (MinIO not available)`,
    );
    return { bucketName, created: false, provider: 'null' };
  }
}
