import { Readable } from 'stream';
import {
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
} from '../types/minio.types';

/**
 * Interface for MinIO service operations
 */
export interface IMinioService {
  /**
   * Upload a file to MinIO (server-side upload)
   * @param key - Object key/path in the bucket
   * @param fileStream - File stream to upload
   * @param options - Upload options
   * @returns Upload result with metadata
   */
  upload(
    key: string,
    fileStream: Readable | Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * Generate a presigned URL for uploading (client direct upload)
   * @param key - Object key/path in the bucket
   * @param options - Presigned URL options
   * @returns Presigned upload URL and metadata
   */
  presignUpload(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUploadResult>;

  /**
   * Generate a presigned URL for downloading
   * @param key - Object key/path in the bucket
   * @param options - Presigned URL options
   * @returns Presigned download URL
   */
  presignDownload(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedDownloadResult>;

  /**
   * Download a file as a stream
   * @param key - Object key/path in the bucket
   * @param options - Download options
   * @returns Readable stream of the file
   */
  downloadStream(key: string, options?: DownloadOptions): Promise<Readable>;

  /**
   * List all versions of an object
   * @param key - Object key/path in the bucket
   * @param options - List options
   * @returns Array of object versions
   */
  listVersions(
    key: string,
    options?: ListVersionsOptions,
  ): Promise<ObjectVersion[]>;

  /**
   * Get a specific version of an object
   * @param key - Object key/path in the bucket
   * @param versionId - Version ID
   * @returns Readable stream of the specific version
   */
  getVersion(key: string, versionId: string, bucket?: string): Promise<Readable>;

  /**
   * Copy an object to a new location
   * @param sourceKey - Source object key
   * @param destinationKey - Destination object key
   * @param options - Copy options
   * @returns Upload result for the copied object
   */
  copyObject(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions,
  ): Promise<UploadResult>;

  /**
   * Move an object to a new location (copy then delete)
   * @param sourceKey - Source object key
   * @param destinationKey - Destination object key
   * @param options - Copy options
   * @returns Upload result for the moved object
   */
  moveObject(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions,
  ): Promise<UploadResult>;

  /**
   * Delete an object
   * @param key - Object key/path in the bucket
   * @param options - Delete options
   * @returns Delete result
   */
  deleteObject(key: string, options?: DeleteOptions): Promise<DeleteResult>;

  /**
   * Delete multiple objects
   * @param keys - Array of object keys to delete
   * @param options - Delete options
   * @returns Array of delete results
   */
  deleteObjects(
    keys: string[],
    options?: DeleteOptions,
  ): Promise<DeleteResult[]>;

  /**
   * Get object metadata
   * @param key - Object key/path in the bucket
   * @returns Object metadata
   */
  getMetadata(key: string, bucket?: string): Promise<ObjectMetadata>;

  /**
   * Update object metadata
   * @param key - Object key/path in the bucket
   * @param options - Metadata update options
   * @returns Updated object metadata
   */
  updateMetadata(
    key: string,
    options: UpdateMetadataOptions,
  ): Promise<ObjectMetadata>;

  /**
   * Check if an object exists
   * @param key - Object key/path in the bucket
   * @returns True if object exists
   */
  objectExists(key: string, bucket?: string): Promise<boolean>;

  /**
   * Check MinIO connectivity and health
   * @returns Health check result
   */
  healthCheck(): Promise<HealthCheckResult>;
}
