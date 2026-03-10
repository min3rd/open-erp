# Product Edit Component

This document describes the Product Edit component implementation and its backend dependencies.

## Overview

The Product Edit component (`/product/:identifier/edit`) provides a form interface for editing existing products. It uses PrimeNG components for UI elements and Tailwind CSS for styling.

## Features

### Read-Only Fields

The following fields are displayed as read-only (non-editable) because they are unique identifiers:

- SKU (Stock Keeping Unit)
- Barcode
- Slug
- Scope (Global/Organization)
- Organization ID

### Editable Fields

All non-unique fields can be edited:

- Product Name
- Status (Draft, Active, Inactive, Discontinued)
- International Name
- Description
- Product Type
- Category
- Unit of Measurement
- Weight, Length, Width, Height
- Expiry Days
- Storage Conditions

### Media Management

#### Existing Media

- Displays existing images, videos, and documents
- Shows metadata: filename, size, upload date
- Allows marking for deletion (can be restored before save)

#### New Media Upload

- Supports multiple file uploads
- Client-side validation for file type and size
- File types supported:
  - Images: JPEG, PNG, WebP (max 5MB for thumbnail, 50MB for media)
  - Videos: MP4, WebM, OGG (max 50MB)
  - Documents: PDF, DOC, DOCX (max 50MB)

#### Thumbnail Management

- Upload new thumbnail image
- Replace existing thumbnail
- Remove thumbnail

## Backend Integration

### API Endpoints Used

#### 1. Get Product Details

```
GET /v1/products/:id
```

Used by the resolver to load product data when opening the edit form.

#### 2. Update Product

```
PATCH /v1/products/:id
```

Sends only changed fields. Expects partial update DTO.

Request body example:

```json
{
  "name": "Updated Product Name",
  "status": "active",
  "description": "New description",
  "thumbnail": {
    "url": "https://...",
    "filename": "image.jpg",
    "contentType": "image/jpeg",
    "size": 123456,
    "minioObjectKey": "...",
    "minioBucket": "..."
  }
}
```

#### 3. Presigned Upload URL

```
GET /v1/products/media/presign-upload?filename=...&contentType=...&type=thumbnail|media&organizationId=...
```

Returns presigned URL for direct upload to MinIO:

```json
{
  "uploadUrl": "https://minio.../...",
  "objectKey": "...",
  "bucket": "...",
  "method": "PUT",
  "expiresAt": "..."
}
```

#### 4. Register Media

```
POST /v1/products/:id/media/register
```

After uploading to MinIO, register the media with the product:

```json
{
  "type": "image|video|document",
  "url": "https://...",
  "filename": "filename.jpg",
  "contentType": "image/jpeg",
  "size": 123456,
  "objectKey": "..."
}
```

#### 5. Delete Media

```
DELETE /v1/products/:id/media?objectKey=...
```

Removes media from product and deletes from MinIO storage.

### Media Upload Flow

The component implements a **presigned upload flow**:

1. **Get Presigned URL**: Client requests a presigned URL from backend
2. **Direct Upload**: Client uploads file directly to MinIO using presigned URL (bypasses backend)
3. **Register Media**: Client notifies backend to register the uploaded media with the product
4. **Update Complete**: Backend updates product record with new media metadata

This approach:

- ✅ Reduces backend load (files don't pass through backend)
- ✅ Faster uploads (direct to object storage)
- ✅ Better scalability
- ✅ Lower bandwidth costs

### Alternative: Server-Side Upload

If your backend doesn't support presigned uploads, you can implement server-side upload:

1. Upload file to backend endpoint
2. Backend handles upload to MinIO
3. Backend updates product record
4. Response includes updated product with new media

To implement this, modify the `uploadFile` method in `edit.ts` to use `multipart/form-data` upload instead of presigned URLs.

## Permissions

The component checks for update permissions using the `canEdit` computed property. Currently returns `true` (TODO: implement actual permission check).

Expected behavior:

- If user lacks `PRODUCT_UPDATE` permission, save buttons are disabled
- If backend returns 403 Forbidden, user sees appropriate error message

## Form Actions

### Cancel

Navigates back to product detail view without saving changes.

### Reset

Reloads original product data, discarding any unsaved changes.

### Save Draft

Sets status to "Draft" and saves changes.

### Save Changes

Validates form, uploads new media, deletes marked media, and sends PATCH request with changed fields only.

## Validation

Client-side validation includes:

- Required fields (Name, Type, Unit, Status)
- Field length limits
- File type and size validation
- Numeric field validation

## Error Handling

The component handles:

- Validation errors (displayed inline)
- Network errors (toast message)
- 403 Forbidden (specific message about permissions)
- Upload failures (rolls back changes, shows error)

## Usage

### From Product List

Navigate to `/product/:sku/edit` where `:sku` is the product's SKU.

### From Product Detail

Click "Edit" button in the detail view, which navigates to `../edit` (sibling route).

### Route Structure

```
/product/:search/:status/:type/:category/:sort/:page/:limit/:sku/edit
```

Example:

```
/product/-/all/all/all/[name,asc]/1/100/SKU-12345/edit
```

## Technical Details

### Component Structure

- **TypeScript**: `edit.ts` (Component class)
- **Template**: `edit.html` (PrimeNG Drawer with tabs)
- **Styling**: Tailwind CSS utility classes
- **State Management**: Angular signals for reactive state
- **Forms**: Reactive Forms (FormGroup)

### Dependencies

- PrimeNG components (Button, Select, InputText, Textarea, Drawer, Tabs, InputNumber)
- Transloco for internationalization
- Product Service for API calls
- Organization Context Service for current organization

### Browser Compatibility

- Modern browsers (ES6+)
- File API for file uploads
- Fetch API for presigned upload

## Future Enhancements

Potential improvements:

- Implement actual permission checks
- Add warehouse settings tab functionality
- Add custom fields tab functionality
- Add image cropping/editing
- Add drag-and-drop media reordering
- Add media preview modal
- Add bulk media operations
- Add undo/redo functionality
