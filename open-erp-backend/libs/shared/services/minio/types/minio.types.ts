import { Readable } from 'stream';

/**
 * MinIO configuration options
 */
export interface MinioConfig {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  bucket: string;
  presignedUrlExpiry?: number; // in seconds
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string | number>;
  tags?: Record<string, string>;
  size?: number;
  originalFilename?: string;
  uploadedBy?: string;
}

/**
 * Result of a file upload
 */
export interface UploadResult {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
  etag: string;
  versionId?: string;
  bucket: string;
}

/**
 * Options for downloading a file
 */
export interface DownloadOptions {
  versionId?: string;
  start?: number; // byte range start
  end?: number; // byte range end
}

/**
 * Options for generating presigned URLs
 */
export interface PresignedUrlOptions {
  expiresIn?: number; // in seconds
  responseHeaders?: {
    'content-type'?: string;
    'content-disposition'?: string;
    'cache-control'?: string;
  };
  versionId?: string;
}

/**
 * Result of presigned URL generation for upload
 */
export interface PresignedUploadResult {
  url: string;
  method: 'PUT' | 'POST';
  fields?: Record<string, string>;
  expiresAt: Date;
}

/**
 * Result of presigned URL generation for download
 */
export interface PresignedDownloadResult {
  url: string;
  expiresAt: Date;
}

/**
 * Object version information
 */
export interface ObjectVersion {
  versionId: string;
  key: string;
  lastModified: Date;
  size: number;
  etag: string;
  isLatest: boolean;
  isDeleteMarker?: boolean;
}

/**
 * Options for listing object versions
 */
export interface ListVersionsOptions {
  maxVersions?: number;
}

/**
 * Options for copying an object
 */
export interface CopyOptions {
  metadata?: Record<string, string | number>;
  metadataDirective?: 'COPY' | 'REPLACE';
  versionId?: string;
}

/**
 * Options for deleting objects
 */
export interface DeleteOptions {
  versionId?: string;
  softDelete?: boolean; // Move to trash prefix instead of permanent delete
}

/**
 * Result of a delete operation
 */
export interface DeleteResult {
  deleted: boolean;
  key: string;
  versionId?: string;
}

/**
 * Object metadata
 */
export interface ObjectMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  versionId?: string;
  metadata?: Record<string, string>;
}

/**
 * Options for updating metadata
 */
export interface UpdateMetadataOptions {
  contentType?: string;
  customMetadata?: Record<string, string | number>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  timestamp: Date;
}
