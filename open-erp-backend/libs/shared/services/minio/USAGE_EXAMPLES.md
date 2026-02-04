# MinIO Service Integration Example

Here's how to integrate the MinIO service into your existing controllers:

## 1. Import the Module

In your feature module (e.g., `inventory.module.ts`):

```typescript
import { MinioModule } from '@shared/services/minio';

@Module({
  imports: [
    // ... other imports
    MinioModule,  // Add this
  ],
  // ... rest of module config
})
export class InventoryModule {}
```

## 2. Inject the Service

In your controller or service:

```typescript
import { MinioService } from '@shared/services/minio';

@Controller('products')
export class ProductController {
  constructor(
    private readonly minioService: MinioService,
    // ... other services
  ) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('productId') productId: string,
  ) {
    // Server-side upload
    const result = await this.minioService.upload(
      `products/${productId}/images/${file.originalname}`,
      file.buffer,
      {
        contentType: file.mimetype,
        size: file.size,
        originalFilename: file.originalname,
        uploadedBy: 'user-id-here',
        metadata: {
          productId,
          uploadedAt: new Date().toISOString(),
        },
      }
    );

    return {
      success: true,
      fileUrl: result.url,
      fileKey: result.key,
    };
  }

  @Post('presign-upload')
  async getUploadUrl(
    @Body('fileName') fileName: string,
    @Body('productId') productId: string,
  ) {
    // Client direct upload
    const presignedUrl = await this.minioService.presignUpload(
      `products/${productId}/images/${fileName}`,
      {
        expiresIn: 1800, // 30 minutes
      }
    );

    return presignedUrl;
  }

  @Get('download/:productId/:fileName')
  async downloadProductImage(
    @Param('productId') productId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // Stream download
    const stream = await this.minioService.downloadStream(
      `products/${productId}/images/${fileName}`
    );

    res.setHeader('Content-Type', 'image/jpeg');
    stream.pipe(res);
  }

  @Get('presign-download/:productId/:fileName')
  async getDownloadUrl(
    @Param('productId') productId: string,
    @Param('fileName') fileName: string,
  ) {
    // Presigned download URL
    return await this.minioService.presignDownload(
      `products/${productId}/images/${fileName}`,
      {
        expiresIn: 3600,
        responseHeaders: {
          'content-disposition': `attachment; filename="${fileName}"`,
        },
      }
    );
  }

  @Delete('image/:productId/:fileName')
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('fileName') fileName: string,
  ) {
    // Soft delete (move to trash)
    await this.minioService.deleteObject(
      `products/${productId}/images/${fileName}`,
      { softDelete: true }
    );

    return { success: true, message: 'Image deleted' };
  }
}
```

## 3. Frontend Integration (Angular)

```typescript
// For client direct upload
async uploadFile(file: File, productId: string) {
  // 1. Get presigned URL from backend
  const presignedData = await this.http.post('/api/products/presign-upload', {
    fileName: file.name,
    productId: productId,
  }).toPromise();

  // 2. Upload directly to MinIO
  await this.http.put(presignedData.url, file, {
    headers: {
      'Content-Type': file.type,
    }
  }).toPromise();

  return { success: true };
}

// For server-side upload
async uploadFileViaServer(file: File, productId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productId', productId);

  return this.http.post('/api/products/upload-image', formData).toPromise();
}
```

## Best Practices

1. **Use presigned URLs for client uploads**: Reduces server load and bandwidth
2. **Implement authorization checks**: Always verify user permissions before generating presigned URLs
3. **Set appropriate expiry times**: Balance between user experience and security
4. **Use soft delete**: Allows recovery of accidentally deleted files
5. **Organize with path prefixes**: Use consistent path structures like `{entity}/{id}/{type}/{filename}`
6. **Store metadata**: Include relevant information for searching and tracking

## Using Custom Buckets for Different Functional Areas

One of the key features is the ability to use different buckets for different functional areas:

```typescript
@Controller('products')
export class ProductController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('productId') productId: string,
  ) {
    // Upload to products bucket
    const result = await this.minioService.upload(
      `${productId}/images/${file.originalname}`,
      file.buffer,
      {
        bucket: 'products', // Dedicated bucket for products
        contentType: file.mimetype,
        size: file.size,
        originalFilename: file.originalname,
        uploadedBy: 'user-id-here',
      }
    );

    return { success: true, fileUrl: result.url };
  }

  @Get('download/:productId/:fileName')
  async downloadImage(
    @Param('productId') productId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // Download from products bucket
    const stream = await this.minioService.downloadStream(
      `${productId}/images/${fileName}`,
      { bucket: 'products' }
    );

    res.setHeader('Content-Type', 'image/jpeg');
    stream.pipe(res);
  }
}

@Controller('documents')
export class DocumentController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload to documents bucket
    const result = await this.minioService.upload(
      `invoices/${file.originalname}`,
      file.buffer,
      {
        bucket: 'documents', // Dedicated bucket for documents
        contentType: file.mimetype,
      }
    );

    return result;
  }
}
```

### Recommended Bucket Structure

- `products` - Product images, catalogs
- `documents` - Invoices, reports, contracts
- `user-uploads` - User-generated content
- `backups` - System backups
- `temp` - Temporary files (with lifecycle policy for auto-deletion)

This approach provides better organization, easier file management, and improved search capabilities.
