import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import type {
  StorageBucketResult,
  StorageProvisioningPort,
} from './storage-provisioning.port';

/**
 * MinioStorageAdapter — Creates a MinIO bucket for a tenant.
 * Falls back gracefully if MinIO is unreachable so onboarding is not blocked.
 */
@Injectable()
export class MinioStorageAdapter implements StorageProvisioningPort {
  private readonly logger = new Logger(MinioStorageAdapter.name);
  private readonly client: Minio.Client | null;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<number>('MINIO_PORT') ?? 9000;
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    if (endpoint && accessKey && secretKey) {
      this.client = new Minio.Client({
        endPoint: endpoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });
    } else {
      this.logger.warn(
        'MinIO config incomplete — storage will use NullStorageAdapter fallback',
      );
      this.client = null;
    }
  }

  async createBucket(bucketName: string): Promise<StorageBucketResult> {
    if (!this.client) {
      this.logger.warn(
        `MinioStorageAdapter: no client, skipping bucket "${bucketName}"`,
      );
      return { bucketName, created: false, provider: 'null' };
    }

    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, 'us-east-1');
        this.logger.log(`Bucket created: ${bucketName}`);
      } else {
        this.logger.debug(`Bucket already exists: ${bucketName}`);
      }
      return { bucketName, created: !exists, provider: 'minio' };
    } catch (err) {
      this.logger.error(
        `Failed to create bucket "${bucketName}": ${(err as Error).message}`,
      );
      // Non-fatal: return fallback so onboarding continues
      return { bucketName, created: false, provider: 'null' };
    }
  }
}
