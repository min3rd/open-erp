export const STORAGE_PROVISIONING_PORT = 'STORAGE_PROVISIONING_PORT';

export interface StorageBucketResult {
  bucketName: string;
  created: boolean;
  provider: 'minio' | 'null';
}

export interface StorageProvisioningPort {
  createBucket(bucketName: string): Promise<StorageBucketResult>;
}
