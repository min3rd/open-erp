# Product API - Media Upload with MinIO

This document describes the new media upload functionality for products using MinIO object storage.

## Overview

The Product API now supports:
- **Slug generation**: Auto-generated SEO-friendly URLs from product names
- **Thumbnail management**: Product thumbnail images stored in MinIO
- **Media storage**: Images, videos, and documents stored in MinIO
- **Direct client upload**: Using presigned URLs for better performance
- **Lifecycle management**: Automatic cleanup when media is deleted or replaced

## New Fields

### Product Schema

#### `slug` (string, optional)
- Auto-generated from product name if not provided
- Normalized to lowercase, URL-friendly format
- Unique within organization scope (or globally for global products)
- Example: `"electronic-component-x1"`

#### `thumbnail` (object, optional)
- Product thumbnail image metadata
- Structure:
  ```typescript
  {
    url: string;              // Public/proxy URL to access the image
    filename: string;         // Original filename
    contentType: string;      // MIME type (e.g., 'image/jpeg')
    size: number;            // File size in bytes
    minioObjectKey: string;  // MinIO object key for lifecycle management
    minioBucket: string;     // MinIO bucket name
  }
  ```

#### `media` (array, enhanced)
Each media item now includes:
- `minioObjectKey`: MinIO object key for lifecycle management
- `minioBucket`: MinIO bucket name

## API Endpoints

### 1. Get Presigned Upload URL (For Product Creation)

Generate a presigned URL for direct client upload to MinIO **before** creating a product (no product ID required).

**Endpoint:** `GET /products/media/presign-upload`

**Parameters:**
- `filename` (query, required): Original filename with extension
- `contentType` (query, required): MIME type (e.g., `image/jpeg`, `video/mp4`)
- `type` (query, optional): Media type - `thumbnail` or `media` (default: `media`)
- `organizationId` (query, optional): Organization ID for organization-scoped products

**Permissions:** `PRODUCT_CREATE` or `PRODUCT_MANAGE`

**Use Case:** Use this endpoint when creating a new product and you need to upload media first (since you don't have a product ID yet).

**Response:**
```json
{
  "success": true,
  "message": null,
  "error": null,
  "data": {
    "uploadUrl": "https://minio.example.com/open-erp/products/temp/...",
    "method": "PUT",
    "expiresAt": "2026-02-04T10:06:25.374Z",
    "objectKey": "products/temp/org-123/thumbnail/1707041185374-product.jpg",
    "bucket": "open-erp"
  }
}
```

**Note:** Files are uploaded to a temporary location (`products/temp/...`). After uploading, include the `objectKey` in your product creation request, and the file will remain accessible.

**Example Usage (JavaScript - Create Product Flow):**
```javascript
// Step 1: Get presigned URL (no product ID needed)
const response = await fetch(
  `/products/media/presign-upload?filename=product.jpg&contentType=image/jpeg&type=thumbnail&organizationId=123`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const { data } = await response.json();

// Step 2: Upload file directly to MinIO
await fetch(data.uploadUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: {
    'Content-Type': 'image/jpeg'
  }
});

// Step 3: Create product with the thumbnail
const product = await fetch('/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Product',
    sku: 'PROD-001',
    // ... other fields
    thumbnail: {
      url: data.uploadUrl.split('?')[0], // Remove query params
      filename: 'product.jpg',
      contentType: 'image/jpeg',
      size: fileBlob.size,
      minioObjectKey: data.objectKey,
      minioBucket: data.bucket
    }
  })
});
```

### 2. Get Presigned Upload URL (For Existing Product)

Generate a presigned URL for direct client upload to MinIO for an **existing** product.

**Endpoint:** `GET /products/:id/media/presign-upload`

**Parameters:**
- `id` (path): Product ID
- `filename` (query, required): Original filename with extension
- `contentType` (query, required): MIME type (e.g., `image/jpeg`, `video/mp4`)
- `type` (query, optional): Media type - `thumbnail` or `media` (default: `media`)

**Permissions:** `PRODUCT_UPDATE` or `PRODUCT_MANAGE`

**Use Case:** Use this endpoint when updating an existing product's media.

**Response:**
```json
{
  "success": true,
  "message": null,
  "error": null,
  "data": {
    "uploadUrl": "https://minio.example.com/open-erp/products/...",
    "method": "PUT",
    "expiresAt": "2026-02-04T10:06:25.374Z",
    "objectKey": "products/org-123/prod-456/thumbnail/1707041185374-product.jpg",
    "bucket": "open-erp"
  }
}
```

**Validation:**
- Thumbnails must be image files (`image/jpeg`, `image/png`, `image/webp`)
- General media supports images, videos, and documents
- Filenames are sanitized to prevent path traversal attacks

**Example Usage (JavaScript - Update Product Flow):**
```javascript
// Step 1: Get presigned URL
const response = await fetch(
  `/products/${productId}/media/presign-upload?filename=product.jpg&contentType=image/jpeg&type=thumbnail`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const { data } = await response.json();

// Step 2: Upload file directly to MinIO
await fetch(data.uploadUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: {
    'Content-Type': 'image/jpeg'
  }
});

// Step 3: Register the uploaded media
await fetch(`/products/${productId}/media/register`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    objectKey: data.objectKey,
    type: 'thumbnail',
    url: data.uploadUrl.split('?')[0], // Remove query params
    filename: 'product.jpg',
    contentType: 'image/jpeg',
    size: fileBlob.size
  })
});
```

### 3. Register Uploaded Media

After uploading to MinIO using the presigned URL, register the media metadata. This endpoint is used when **updating an existing product** to add new media items after they've been uploaded.

**Note:** For the **create product flow**, you don't need this endpoint - just include the thumbnail/media metadata directly in the `POST /products` request body.

**Endpoint:** `POST /products/:id/media/register`

**Parameters:**
- `id` (path): Product ID

**Request Body:**
```json
{
  "objectKey": "products/org-123/prod-456/media/1707041185374-image.jpg",
  "type": "image",
  "url": "https://minio.example.com/open-erp/products/...",
  "filename": "product-image.jpg",
  "contentType": "image/jpeg",
  "size": 1024000,
  "title": "Product front view",
  "description": "High quality product image",
  "isPrimary": true
}
```

**Permissions:** `PRODUCT_UPDATE` or `PRODUCT_MANAGE`

**Response:**
```json
{
  "success": true,
  "message": "Media registered successfully",
  "error": null,
  "data": {
    "mode": "update",
    "item": { /* Updated product object */ }
  }
}
```

**Behavior:**
- Verifies that the object exists in MinIO before registration
- For `type: "thumbnail"`, updates the product's thumbnail field
- For other types, adds to the product's media array
- Creates a new product version snapshot

### 4. Delete Media

Delete media from both the product and MinIO storage.

**Endpoint:** `DELETE /products/:id/media`

**Parameters:**
- `id` (path): Product ID
- `objectKey` (query, optional): MinIO object key to delete (for media items)
- `deleteThumbnail` (query, optional): Set to `true` to delete thumbnail

**Permissions:** `PRODUCT_UPDATE` or `PRODUCT_MANAGE`

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully",
  "error": null,
  "data": {
    "mode": "update",
    "item": { /* Updated product object */ }
  }
}
```

**Examples:**
```bash
# Delete thumbnail
DELETE /products/123/media?deleteThumbnail=true

# Delete specific media item
DELETE /products/123/media?objectKey=products/org-123/prod-456/media/123456-image.jpg
```

## Media Lifecycle Management

### Automatic Cleanup

Media files are automatically cleaned up in the following scenarios:

1. **Product Soft Delete**: When a product is soft-deleted, all associated media (thumbnail and media items) are moved to MinIO's trash (soft delete).

2. **Media Replacement**: When media is replaced through the update endpoint, old media files are removed from MinIO.

3. **Manual Deletion**: Using the delete media endpoint.

### Soft Delete vs Hard Delete

- **Soft Delete**: Media is moved to `.trash/` prefix in MinIO but not permanently deleted
- **Hard Delete**: Media is permanently removed from MinIO (requires setting `permanent: true`)

Currently, all automatic cleanup uses soft delete to allow recovery if needed.

### TTL Cleanup

Products have a TTL (Time To Live) of 2 years after soft deletion. After this period, MongoDB automatically removes the product document and MinIO objects should be cleaned up by a separate background job (not implemented in this PR).

## MinIO Object Key Structure

Media files are organized in MinIO with the following structure:

```
products/
  ├── org-{organizationId}/    (for organization-scoped products)
  │   └── {productId}/
  │       ├── thumbnail/
  │       │   └── {timestamp}-{filename}
  │       └── media/
  │           └── {timestamp}-{filename}
  └── global/                  (for global products)
      └── {productId}/
          ├── thumbnail/
          └── media/
```

Example: `products/org-507f1f77bcf86cd799439011/65a1b2c3d4e5f6g7h8i9j0k1/thumbnail/1707041185374-product.jpg`

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Requires `PRODUCT_UPDATE` or `PRODUCT_MANAGE` permission
3. **Content Type Validation**: Only allowed content types can be uploaded
4. **Filename Sanitization**: Special characters are removed from filenames
5. **Object Key Sanitization**: Path traversal attempts are blocked
6. **Presigned URL Expiry**: URLs expire after 1 hour
7. **Object Existence Verification**: Media registration verifies file exists in MinIO

## Migration

A migration script is provided to add the new fields to existing products:

**File:** `migrations/20260204000001-add-slug-thumbnail-to-products.js`

**What it does:**
1. Adds nullable `slug` and `thumbnail` fields to all products
2. Creates unique indexes for slug (organization and global scope)
3. Auto-generates slugs from existing product names
4. Handles collisions by appending numeric suffixes

**Running the migration:**
```bash
npm run migrate:up
```

**Rolling back:**
```bash
npm run migrate:down
```

## Integration Example

### Complete Flow: Create Product with Thumbnail

```javascript
async function createProductWithThumbnail(productData, thumbnailFile) {
  const token = localStorage.getItem('token');
  
  // Step 1: Create the product
  const createResponse = await fetch('/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  const { data: { item: product } } = await createResponse.json();
  
  // Step 2: Get presigned upload URL
  const presignResponse = await fetch(
    `/products/${product.id}/media/presign-upload?` +
    `filename=${thumbnailFile.name}&` +
    `contentType=${thumbnailFile.type}&` +
    `type=thumbnail`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const { data: presignData } = await presignResponse.json();
  
  // Step 3: Upload file to MinIO
  await fetch(presignData.uploadUrl, {
    method: 'PUT',
    body: thumbnailFile,
    headers: {
      'Content-Type': thumbnailFile.type
    }
  });
  
  // Step 4: Register the uploaded thumbnail
  const registerResponse = await fetch(
    `/products/${product.id}/media/register`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        objectKey: presignData.objectKey,
        type: 'thumbnail',
        url: presignData.uploadUrl.split('?')[0],
        filename: thumbnailFile.name,
        contentType: thumbnailFile.type,
        size: thumbnailFile.size
      })
    }
  );
  
  const { data: { item: updatedProduct } } = await registerResponse.json();
  return updatedProduct;
}
```

## Testing

To test the implementation:

1. **Start the backend services:**
   ```bash
   cd open-erp-backend
   npm i
   npm run docker:dev:up
   npm run db:seed:all --drop --confirm
   npm run inventory:dev
   ```

2. **Test with curl:**
   ```bash
   # Get presigned URL
   curl -X GET "http://localhost:3000/products/{id}/media/presign-upload?filename=test.jpg&contentType=image/jpeg&type=thumbnail" \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Upload file
   curl -X PUT "PRESIGNED_URL" \
     -H "Content-Type: image/jpeg" \
     --data-binary @test.jpg
   
   # Register media
   curl -X POST "http://localhost:3000/products/{id}/media/register" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "objectKey": "products/org-123/prod-456/thumbnail/123456-test.jpg",
       "type": "thumbnail",
       "url": "https://minio.example.com/...",
       "filename": "test.jpg",
       "contentType": "image/jpeg",
       "size": 1024000
     }'
   ```

## OpenAPI Documentation

All new endpoints are documented with OpenAPI decorators and will appear in the Swagger UI at:
- Development: `http://localhost:3000/api`
- Production: `https://your-domain/api`

The documentation includes:
- Request/response schemas
- Parameter descriptions
- Example payloads
- Authentication requirements
- Permission requirements
