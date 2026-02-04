# MinIO Service

A comprehensive shared service for interacting with MinIO object storage in the Open ERP backend.

## Features

- **Upload Management**: Server-side uploads and client direct uploads via presigned URLs
- **Download Management**: Stream downloads and presigned download URLs
- **Versioning**: List, retrieve, and manage object versions
- **File Operations**: Copy, move, rename, and delete objects
- **Metadata Management**: Store and update file metadata
- **Security**: Path traversal prevention, configurable authentication
- **Health Monitoring**: Connectivity checks for monitoring

## Installation

The MinIO service is part of the shared libraries and is automatically available when you import the `MinioModule`.

## Configuration

Add the following environment variables to your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1
MINIO_BUCKET=open-erp
MINIO_PRESIGNED_URL_EXPIRY=3600
```

## Usage

### Import the Module

```typescript
import { MinioModule } from '@shared/services/minio';

@Module({
  imports: [MinioModule],
  // ...
})
export class YourModule {}
```

### Inject the Service

```typescript
import { MinioService } from '@shared/services/minio';

@Injectable()
export class YourService {
  constructor(private readonly minioService: MinioService) {}
}
```

### Upload a File (Server-side)

```typescript
const fileStream = createReadStream('path/to/file.pdf');
const result = await this.minioService.upload(
  'documents/file.pdf',
  fileStream,
  {
    contentType: 'application/pdf',
    originalFilename: 'file.pdf',
    uploadedBy: userId,
    metadata: {
      category: 'invoice',
      year: '2024',
    },
    tags: {
      department: 'accounting',
    },
  }
);

console.log('Uploaded:', result.key, result.url);
```

### Generate Presigned Upload URL (Client Direct Upload)

```typescript
const presignedUrl = await this.minioService.presignUpload(
  'documents/file.pdf',
  {
    expiresIn: 1800, // 30 minutes
  }
);

// Return this URL to the client
// Client can then PUT the file directly to MinIO
return {
  uploadUrl: presignedUrl.url,
  method: presignedUrl.method,
  expiresAt: presignedUrl.expiresAt,
};
```

### Download a File

```typescript
// Get file as stream
const stream = await this.minioService.downloadStream('documents/file.pdf');
response.setHeader('Content-Type', 'application/pdf');
stream.pipe(response);

// Or generate presigned download URL
const downloadUrl = await this.minioService.presignDownload(
  'documents/file.pdf',
  {
    expiresIn: 600, // 10 minutes
    responseHeaders: {
      'content-disposition': 'attachment; filename="document.pdf"',
    },
  }
);
```

### List Object Versions

```typescript
const versions = await this.minioService.listVersions('documents/file.pdf', {
  maxVersions: 10,
});

versions.forEach(v => {
  console.log(`Version ${v.versionId}: ${v.size} bytes, ${v.isLatest ? 'latest' : 'old'}`);
});
```

### Copy and Move Files

```typescript
// Copy
await this.minioService.copyObject(
  'documents/original.pdf',
  'archive/original.pdf',
  {
    metadata: { archived: 'true' },
    metadataDirective: 'REPLACE',
  }
);

// Move (copy + delete original)
await this.minioService.moveObject(
  'temp/file.pdf',
  'documents/file.pdf'
);
```

### Delete Files

```typescript
// Hard delete
await this.minioService.deleteObject('documents/old-file.pdf');

// Soft delete (moves to .trash/ prefix)
await this.minioService.deleteObject('documents/file.pdf', {
  softDelete: true,
});

// Bulk delete
await this.minioService.deleteObjects([
  'temp/file1.pdf',
  'temp/file2.pdf',
  'temp/file3.pdf',
]);
```

### Metadata Management

```typescript
// Get metadata
const metadata = await this.minioService.getMetadata('documents/file.pdf');
console.log('Size:', metadata.size, 'ETag:', metadata.etag);

// Update metadata
await this.minioService.updateMetadata('documents/file.pdf', {
  contentType: 'application/pdf',
  customMetadata: {
    reviewed: 'true',
    reviewedBy: userId,
  },
});
```

### Health Check

```typescript
const health = await this.minioService.healthCheck();
if (!health.healthy) {
  console.error('MinIO is not available:', health.message);
}
```

## API Reference

### `upload(key, fileStream, options?)`

Upload a file to MinIO.

**Parameters:**
- `key` - Object path in bucket (e.g., "documents/file.pdf")
- `fileStream` - Readable stream or Buffer
- `options` - Upload options:
  - `contentType` - MIME type
  - `size` - File size in bytes
  - `originalFilename` - Original filename
  - `uploadedBy` - User ID who uploaded
  - `metadata` - Custom metadata object
  - `tags` - Tags object

**Returns:** `Promise<UploadResult>`

### `presignUpload(key, options?)`

Generate presigned URL for client direct upload.

**Parameters:**
- `key` - Object path
- `options.expiresIn` - Expiry in seconds (default: 3600)

**Returns:** `Promise<PresignedUploadResult>`

### `presignDownload(key, options?)`

Generate presigned URL for download.

**Parameters:**
- `key` - Object path
- `options.expiresIn` - Expiry in seconds
- `options.responseHeaders` - Headers to set on response
- `options.versionId` - Specific version to download

**Returns:** `Promise<PresignedDownloadResult>`

### `downloadStream(key, options?)`

Download file as stream.

**Parameters:**
- `key` - Object path
- `options.start` - Byte range start
- `options.end` - Byte range end
- `options.versionId` - Specific version

**Returns:** `Promise<Readable>`

### `listVersions(key, options?)`

List all versions of an object.

**Parameters:**
- `key` - Object path
- `options.maxVersions` - Maximum versions to return

**Returns:** `Promise<ObjectVersion[]>`

### `copyObject(sourceKey, destinationKey, options?)`

Copy object to new location.

**Returns:** `Promise<UploadResult>`

### `moveObject(sourceKey, destinationKey, options?)`

Move object to new location.

**Returns:** `Promise<UploadResult>`

### `deleteObject(key, options?)`

Delete an object.

**Parameters:**
- `key` - Object path
- `options.softDelete` - Move to trash instead of permanent delete
- `options.versionId` - Delete specific version

**Returns:** `Promise<DeleteResult>`

### `deleteObjects(keys, options?)`

Delete multiple objects.

**Returns:** `Promise<DeleteResult[]>`

### `getMetadata(key)`

Get object metadata.

**Returns:** `Promise<ObjectMetadata>`

### `updateMetadata(key, options)`

Update object metadata.

**Returns:** `Promise<ObjectMetadata>`

### `objectExists(key)`

Check if object exists.

**Returns:** `Promise<boolean>`

### `healthCheck()`

Check MinIO connectivity.

**Returns:** `Promise<HealthCheckResult>`

## Security Considerations

1. **Path Traversal Prevention**: All keys are sanitized to prevent directory traversal attacks
2. **Authentication**: Use environment variables for credentials, never hardcode
3. **Authorization**: Implement permission checks at the controller/service level before calling MinIO operations
4. **Presigned URLs**: Configure appropriate expiry times for presigned URLs
5. **Metadata Validation**: Validate and sanitize metadata before storage

## Best Practices

1. Always use presigned URLs for client direct uploads when possible to reduce server load
2. Enable versioning on buckets for important documents
3. Use soft delete for user-facing delete operations
4. Implement proper error handling for network failures
5. Use streaming for large files to avoid memory issues
6. Set appropriate content types for better browser handling
7. Use metadata for searchability and organization

## Testing

Run the tests:

```bash
npm test libs/shared/services/minio/minio.service.spec.ts
```

## License

Part of the Open ERP backend project.
