import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { IMinioService } from './interfaces/minio.interface';
import {
  MinioConfig,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  PresignedUrlOptions,
  PresignedUploadResult,
  PresignedDownloadResult,
  ObjectVersion,
  ListVersionsOptions,
  CopyOptions,
  DeleteOptions,
  DeleteResult,
  ObjectMetadata,
  UpdateMetadataOptions,
  HealthCheckResult,
} from './types/minio.types';

/**
 * Service for interacting with MinIO object storage
 * Provides upload, download, versioning, and management capabilities
 */
@Injectable()
export class MinioService implements IMinioService {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Minio.Client;
  private readonly config: MinioConfig;
  private readonly trashPrefix = '.trash/';
  private readonly DEFAULT_PRESIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

  constructor(private readonly configService: ConfigService) {
    // Load configuration from environment variables
    this.config = {
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<boolean>('MINIO_USE_SSL', false),
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      bucket: this.configService.get<string>('MINIO_BUCKET', 'open-erp'),
      presignedUrlExpiry: this.configService.get<number>(
        'MINIO_PRESIGNED_URL_EXPIRY',
        3600,
      ), // Default 1 hour
    };

    // Initialize MinIO client
    this.client = new Minio.Client({
      endPoint: this.config.endPoint,
      port: this.config.port,
      useSSL: this.config.useSSL,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      region: this.config.region,
    });

    this.logger.log(
      `MinIO service initialized with endpoint: ${this.config.endPoint}:${this.config.port}`,
    );
  }

  /**
   * Get bucket name from options or use default
   */
  private getBucket(bucket?: string): string {
    return bucket || this.config.bucket;
  }

  /**
   * Get the default bucket name
   * @returns The default bucket name from configuration
   */
  getDefaultBucket(): string {
    return this.config.bucket;
  }

  /**
   * Ensure the bucket exists, create if it doesn't
   */
  private async ensureBucket(bucketName?: string): Promise<void> {
    try {
      const bucket = this.getBucket(bucketName);
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, this.config.region);
        this.logger.log(`Created bucket: ${bucket}`);
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring bucket exists: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sanitize object key to prevent path traversal attacks
   */
  private sanitizeKey(key: string): string {
    // Remove leading slashes, parent directory references, and normalize paths
    return key
      .replace(/^\/+/, '')
      .split('/')
      .filter((part) => part && part !== '.' && part !== '..')
      .join('/');
  }

  /**
   * Upload a file to MinIO (server-side upload)
   */
  async upload(
    key: string,
    fileStream: Readable | Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      await this.ensureBucket(options?.bucket);

      const sanitizedKey = this.sanitizeKey(key);
      this.logger.debug(`Uploading object: ${sanitizedKey}`);

      // Prepare metadata
      const metadata: Record<string, string> = {};
      if (options?.originalFilename) {
        metadata['original-filename'] = options.originalFilename;
      }
      if (options?.uploadedBy) {
        metadata['uploaded-by'] = options.uploadedBy;
      }
      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([k, v]) => {
          metadata[k] = String(v);
        });
      }

      // Upload the object
      const uploadResult = await this.client.putObject(
        this.config.bucket,
        sanitizedKey,
        fileStream,
        options?.size,
        {
          'Content-Type': options?.contentType || 'application/octet-stream',
          ...metadata,
        },
      );

      // Add tags if provided
      if (options?.tags) {
        await this.client.setObjectTagging(
          this.config.bucket,
          sanitizedKey,
          options.tags,
        );
      }

      const result: UploadResult = {
        key: sanitizedKey,
        url: await this.getObjectUrl(sanitizedKey, options?.bucket),
        etag: uploadResult.etag,
        versionId: uploadResult.versionId || undefined,
        bucket: this.getBucket(options?.bucket),
        size: options?.size,
        contentType: options?.contentType,
      };

      this.logger.log(`Successfully uploaded object: ${sanitizedKey}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error uploading object ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a presigned URL for uploading (client direct upload)
   */
  async presignUpload(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUploadResult> {
    try {
      await this.ensureBucket(options?.bucket);

      const sanitizedKey = this.sanitizeKey(key);
      const expiresIn: number =
        options?.expiresIn ||
        this.config.presignedUrlExpiry ||
        this.DEFAULT_PRESIGNED_URL_EXPIRY;

      this.logger.debug(`Generating presigned upload URL for: ${sanitizedKey}`);

      const url = await this.client.presignedPutObject(
        this.config.bucket,
        sanitizedKey,
        expiresIn,
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      return {
        url,
        method: 'PUT',
        expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Error generating presigned upload URL for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a presigned URL for downloading
   */
  async presignDownload(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedDownloadResult> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const expiresIn: number =
        options?.expiresIn ||
        this.config.presignedUrlExpiry ||
        this.DEFAULT_PRESIGNED_URL_EXPIRY;

      this.logger.debug(
        `Generating presigned download URL for: ${sanitizedKey}`,
      );

      const reqParams: Record<string, string> = {};
      if (options?.responseHeaders) {
        Object.entries(options.responseHeaders).forEach(([k, v]) => {
          if (v) reqParams[`response-${k}`] = v;
        });
      }
      if (options?.versionId) {
        reqParams['versionId'] = options.versionId;
      }

      const url = await this.client.presignedGetObject(
        this.config.bucket,
        sanitizedKey,
        expiresIn,
        reqParams,
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      return {
        url,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Error generating presigned download URL for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Download a file as a stream
   */
  async downloadStream(
    key: string,
    options?: DownloadOptions,
  ): Promise<Readable> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      this.logger.debug(`Downloading object stream: ${sanitizedKey}`);

      let stream: Readable;

      if (options?.start !== undefined || options?.end !== undefined) {
        // Range request
        stream = await this.client.getPartialObject(
          this.config.bucket,
          sanitizedKey,
          options.start || 0,
          options.end,
        );
      } else if (options?.versionId) {
        // Specific version
        stream = await this.client.getObject(
          this.getBucket(options?.bucket),
          sanitizedKey,
          {
            versionId: options.versionId,
          } as any,
        );
      } else {
        // Latest version
        stream = await this.client.getObject(
          this.getBucket(options?.bucket),
          sanitizedKey,
        );
      }

      return stream;
    } catch (error) {
      this.logger.error(
        `Error downloading object ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * List all versions of an object
   * Note: MinIO client doesn't have a direct listObjectVersions method
   * This implementation assumes versioning is enabled on the bucket
   * and uses a workaround with listObjects
   */
  async listVersions(
    key: string,
    options?: ListVersionsOptions,
  ): Promise<ObjectVersion[]> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      this.logger.debug(`Listing versions for: ${sanitizedKey}`);

      // MinIO JS client doesn't directly support listing versions
      // For now, we'll return the current version only
      // In production, you may need to implement version tracking in your database
      const stat = await this.client.statObject(
        this.config.bucket,
        sanitizedKey,
      );

      const versions: ObjectVersion[] = [
        {
          versionId: stat.versionId || 'null',
          key: sanitizedKey,
          lastModified: new Date(stat.lastModified),
          size: stat.size,
          etag: stat.etag,
          isLatest: true,
          isDeleteMarker: false,
        },
      ];

      if (options?.maxVersions && versions.length > options.maxVersions) {
        return versions.slice(0, options.maxVersions);
      }

      return versions;
    } catch (error) {
      this.logger.error(
        `Error listing versions for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a specific version of an object
   */
  async getVersion(
    key: string,
    versionId: string,
    bucket?: string,
  ): Promise<Readable> {
    return this.downloadStream(key, { versionId, bucket });
  }

  /**
   * Copy an object to a new location
   */
  async copyObject(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions,
  ): Promise<UploadResult> {
    try {
      await this.ensureBucket(options?.bucket);

      const sanitizedSourceKey = this.sanitizeKey(sourceKey);
      const sanitizedDestKey = this.sanitizeKey(destinationKey);

      this.logger.debug(
        `Copying object from ${sanitizedSourceKey} to ${sanitizedDestKey}`,
      );

      const conditions = new Minio.CopyConditions();
      let copySource = `/${this.getBucket(options?.bucket)}/${sanitizedSourceKey}`;
      if (options?.versionId) {
        copySource += `?versionId=${options.versionId}`;
      }

      const copyResult = await this.client.copyObject(
        this.config.bucket,
        sanitizedDestKey,
        copySource,
        conditions,
      );

      // Extract etag from result (handle both V1 and V2 result types)
      const etag = 'etag' in copyResult ? copyResult.etag : '';

      const result: UploadResult = {
        key: sanitizedDestKey,
        url: await this.getObjectUrl(sanitizedDestKey, options?.bucket),
        etag,
        bucket: this.getBucket(options?.bucket),
      };

      this.logger.log(
        `Successfully copied object from ${sanitizedSourceKey} to ${sanitizedDestKey}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error copying object from ${sourceKey} to ${destinationKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Move an object to a new location (copy then delete)
   */
  async moveObject(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions,
  ): Promise<UploadResult> {
    try {
      const result = await this.copyObject(sourceKey, destinationKey, options);
      await this.deleteObject(sourceKey);
      this.logger.log(
        `Successfully moved object from ${sourceKey} to ${destinationKey}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error moving object from ${sourceKey} to ${destinationKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(
    key: string,
    options?: DeleteOptions,
  ): Promise<DeleteResult> {
    try {
      const sanitizedKey = this.sanitizeKey(key);

      if (options?.softDelete) {
        // Soft delete: move to trash
        const trashKey = `${this.trashPrefix}${sanitizedKey}`;
        await this.moveObject(sanitizedKey, trashKey);
        this.logger.log(`Soft deleted object: ${sanitizedKey} to ${trashKey}`);
        return {
          deleted: true,
          key: sanitizedKey,
        };
      } else {
        // Hard delete
        this.logger.debug(`Deleting object: ${sanitizedKey}`);
        await this.client.removeObject(
          this.getBucket(options?.bucket),
          sanitizedKey,
          {
            versionId: options?.versionId,
          } as any,
        );
        this.logger.log(`Successfully deleted object: ${sanitizedKey}`);
        return {
          deleted: true,
          key: sanitizedKey,
          versionId: options?.versionId,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error deleting object ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete multiple objects
   */
  async deleteObjects(
    keys: string[],
    options?: DeleteOptions,
  ): Promise<DeleteResult[]> {
    try {
      const results: DeleteResult[] = [];

      if (options?.softDelete) {
        // Soft delete each object
        for (const key of keys) {
          const result = await this.deleteObject(key, options);
          results.push(result);
        }
      } else {
        // Hard delete in batch
        const sanitizedKeys = keys.map((key) => this.sanitizeKey(key));
        this.logger.debug(`Deleting ${sanitizedKeys.length} objects`);

        await this.client.removeObjects(
          this.getBucket(options?.bucket),
          sanitizedKeys,
        );

        sanitizedKeys.forEach((key) => {
          results.push({
            deleted: true,
            key,
          });
        });

        this.logger.log(`Successfully deleted ${results.length} objects`);
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error deleting objects: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  async getMetadata(key: string, bucket?: string): Promise<ObjectMetadata> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      this.logger.debug(`Getting metadata for: ${sanitizedKey}`);

      const stat = await this.client.statObject(
        this.config.bucket,
        sanitizedKey,
      );

      return {
        key: sanitizedKey,
        size: stat.size,
        lastModified: new Date(stat.lastModified),
        etag: stat.etag,
        contentType: stat.metaData?.['content-type'],
        versionId: stat.versionId || undefined,
        metadata: stat.metaData,
      };
    } catch (error) {
      this.logger.error(
        `Error getting metadata for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update object metadata
   * Note: MinIO requires copying the object to itself with new metadata
   */
  async updateMetadata(
    key: string,
    options: UpdateMetadataOptions,
  ): Promise<ObjectMetadata> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      this.logger.debug(`Updating metadata for: ${sanitizedKey}`);

      // Get current metadata
      const currentStat = await this.client.statObject(
        this.config.bucket,
        sanitizedKey,
      );

      // Prepare new metadata
      const newMetadata: Record<string, string> = {
        ...(currentStat.metaData || {}),
      };

      if (options.contentType) {
        newMetadata['Content-Type'] = options.contentType;
      }

      if (options.customMetadata) {
        Object.entries(options.customMetadata).forEach(([k, v]) => {
          newMetadata[k] = String(v);
        });
      }

      // To update metadata, we need to copy the object to itself with new metadata
      // This is a limitation of the MinIO JS client
      const conditions = new Minio.CopyConditions();
      await this.client.copyObject(
        this.config.bucket,
        sanitizedKey,
        `/${this.getBucket(options?.bucket)}/${sanitizedKey}`,
        conditions,
      );

      this.logger.log(`Successfully updated metadata for: ${sanitizedKey}`);

      // Return updated metadata
      return this.getMetadata(key);
    } catch (error) {
      this.logger.error(
        `Error updating metadata for ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if an object exists
   */
  async objectExists(key: string, bucket?: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      await this.client.statObject(this.getBucket(bucket), sanitizedKey);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check MinIO connectivity and health
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      this.logger.debug('Performing health check');

      // Try to list buckets as a connectivity test
      await this.client.listBuckets();

      // Check if our bucket exists
      const bucketExists = await this.client.bucketExists(this.config.bucket);

      if (!bucketExists) {
        return {
          healthy: false,
          message: `Bucket '${this.config.bucket}' does not exist`,
          timestamp: new Date(),
        };
      }

      return {
        healthy: true,
        message: 'MinIO connection successful',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        healthy: false,
        message: `MinIO connection failed: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get the public URL for an object (if bucket is public)
   */
  private async getObjectUrl(key: string, bucket?: string): Promise<string> {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const bucketName = bucket || this.config.bucket;
    return `${protocol}://${this.config.endPoint}:${this.config.port}/${bucketName}/${key}`;
  }

  /**
   * Get a presigned URL for downloading an object
   * @param key - Object key
   * @param options - Options including expiry time
   * @returns Presigned URL string
   */
  async getPresignedUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<string> {
    try {
      const bucket = this.getBucket(options?.bucket);
      const expiresIn: number =
        options?.expiresIn ||
        this.config.presignedUrlExpiry ||
        this.DEFAULT_PRESIGNED_URL_EXPIRY;

      this.logger.debug(
        `Generating presigned URL for ${key} with expiry ${expiresIn}s`,
      );

      const url = await this.client.presignedGetObject(bucket, key, expiresIn);
      return url;
    } catch (error) {
      this.logger.error(
        `Error generating presigned URL for ${key}: ${error.message}`,
        error.stack,
      );
      // Return empty string on error instead of throwing
      return '';
    }
  }
}
