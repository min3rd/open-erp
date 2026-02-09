# Product Context Menu with Slug-Based API

## Overview

This document describes the implementation of an enhanced context menu for the Product list table with slug-based API endpoints. The implementation adds:

1. **Backend**: Identifier resolution system (slug → sku → id) for all product endpoints
2. **Frontend**: Enhanced context menu with publish, inactive, and statistics actions
3. **Navigation**: Slug-based URLs for better SEO and user experience

## Backend Changes

### Identifier Resolution

The backend now supports three types of product identifiers:

1. **Slug** (preferred): URL-friendly identifier (e.g., `laptop-hp-pavilion`)
2. **SKU**: Stock Keeping Unit (e.g., `SKU-001`)
3. **ID**: MongoDB ObjectId (e.g., `507f1f77bcf86cd799439011`)

**Resolution Order**: slug → sku → id

#### Implementation

**Repository** (`product.repository.ts`):
- Added `findBySlug()` method to query products by slug

**Service** (`product.service.ts`):
- Added `resolveIdentifier()` method to resolve any identifier to product ID
- Added `findByIdentifier()` method to fetch product using identifier
- Added `publish()` method to set product status to active
- Added `markInactive()` method to set product status to inactive

**Controller** (`product.controller.ts`):
Updated endpoints to accept identifier parameter:

- `GET /products/:identifier` - Get product by identifier
- `PATCH /products/:identifier` - Update product by identifier
- `DELETE /products/:identifier` - Soft delete product by identifier
- `POST /products/:identifier/publish` - Publish product (set status to active)
- `POST /products/:identifier/inactive` - Mark product as inactive
- `POST /products/:identifier/restore` - Restore soft-deleted product

All endpoints include:
- Enhanced OpenAPI documentation
- organizationId query parameter for scoped lookups
- Proper error handling (404 if not found)
- Permission checks

### Database Schema

The Product schema already includes:

1. **Slug field** with:
   - Type: String
   - Indexed: Yes
   - Lowercase: Yes
   - Unique: Within organization scope

2. **Unique indexes**:
   - Organization-scoped: `{ organizationId: 1, slug: 1 }` (unique, sparse)
   - Global-scoped: `{ slug: 1 }` (unique, sparse)

3. **Automatic slug generation**:
   - Generated from product name if not provided
   - Uniqueness ensured via `generateUniqueSlug()` utility
   - Conflicts resolved by appending numeric suffix

### Migration Script

A migration script is provided to backfill slugs for existing products:

```bash
npm run migration:backfill-slugs
```

Or directly:

```bash
ts-node -r tsconfig-paths/register scripts/backfill-product-slugs.ts
```

The script:
1. Finds all products without slugs
2. Generates unique slugs based on product names
3. Updates products with the generated slugs
4. Provides detailed progress and summary

## Frontend Changes

### ProductService Updates

**New Methods** (`product.service.ts`):

- `getProductByIdentifier(identifier, includeDeleted?, organizationId?)` - Fetch product by identifier
- `updateProductByIdentifier(identifier, dto, organizationId?)` - Update product by identifier
- `deleteProductByIdentifier(identifier, organizationId?)` - Delete product by identifier
- `publishProduct(identifier, organizationId?)` - Publish product
- `markProductInactive(identifier, organizationId?)` - Mark product as inactive

**Backward Compatibility**:
- Existing methods (`getProductById`, `updateProduct`, `deleteProduct`) are kept as deprecated wrappers
- They internally call the new identifier-based methods
- No breaking changes for existing code

### Enhanced Context Menu

**New Actions**:

1. **View** - Navigate to product detail view
2. **Edit** - Navigate to product edit view
3. **Publish** - Set product status to active (shown for draft/inactive products)
4. **Mark Inactive** - Set product status to inactive (shown for active products)
5. **Statistics** - View product statistics (placeholder, disabled for now)
6. **Delete** - Soft delete product

**Features**:
- Dynamic menu based on product status
- Confirmation dialogs for destructive actions
- Success/error notifications
- In-place UI updates (no page reload)
- Slug-based navigation (with fallback to SKU/ID)

### Navigation Updates

**Slug-Based URLs**:
- Product detail: `/product/:identifier/view`
- Product edit: `/product/:identifier/edit`

**Identifier Resolution**:
- Navigation prefers slug over SKU/ID
- Resolver uses `getProductByIdentifier()` for flexible lookups
- Backward compatible with existing SKU/ID-based URLs

### Translations

Added translations for all three languages:

**English** (`en.json`):
- Context menu items
- Confirmation dialogs
- Success/error messages

**Vietnamese** (`vi.json`):
- Fully translated UI strings

**Spanish** (`es.json`):
- Fully translated UI strings

Translation keys:
```
productList.contextMenu.publish
productList.contextMenu.markInactive
productList.contextMenu.statistics
productList.publish.*
productList.markInactive.*
productList.statistics.*
```

## API Documentation

### GET /products/:identifier

Get a product by identifier (slug, SKU, or ID).

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `includeDeleted` (query) - Include soft-deleted products (optional)
- `organizationId` (query) - Organization ID for scoped lookup (optional)

**Response**: Product object

**Example**:
```bash
# By slug
GET /products/laptop-hp-pavilion

# By SKU
GET /products/SKU-001

# By ID
GET /products/507f1f77bcf86cd799439011
```

### PATCH /products/:identifier

Update a product by identifier.

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `organizationId` (query) - Organization ID for scoped lookup (optional)
- Request body: `UpdateProductDto`

**Response**: Updated product object

### DELETE /products/:identifier

Soft delete a product by identifier.

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `organizationId` (query) - Organization ID for scoped lookup (optional)

**Response**: Success message

### POST /products/:identifier/publish

Publish a product (set status to active).

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `organizationId` (query) - Organization ID for scoped lookup (optional)

**Response**: Updated product object

### POST /products/:identifier/inactive

Mark a product as inactive.

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `organizationId` (query) - Organization ID for scoped lookup (optional)

**Response**: Updated product object

### POST /products/:identifier/restore

Restore a soft-deleted product.

**Parameters**:
- `identifier` (path) - Product slug, SKU, or MongoDB ObjectId
- `organizationId` (query) - Organization ID for scoped lookup (optional)

**Response**: Updated product object

## Usage Examples

### Backend (NestJS)

```typescript
// Product service usage
const product = await productService.findByIdentifier('laptop-hp-pavilion');

// Publish a product
const published = await productService.publish(productId, userId);

// Mark as inactive
const inactive = await productService.markInactive(productId, userId);
```

### Frontend (Angular)

```typescript
// Get product by slug
this.productService.getProductByIdentifier('laptop-hp-pavilion')
  .subscribe(product => {
    console.log('Product:', product);
  });

// Publish product
this.productService.publishProduct('laptop-hp-pavilion')
  .subscribe(updated => {
    console.log('Published:', updated);
  });

// Navigate using slug
const identifier = product.slug || product.sku || product.id;
this.router.navigate([identifier, 'edit'], { relativeTo: this.route });
```

## Testing

### Manual Testing Steps

1. **Setup Environment**:
   ```bash
   # Backend
   cd open-erp-backend
   npm i
   npm run docker:dev:up
   npm run db:seed:all --drop --confirm --org-count 100 --warehouse-count 100 --user-count 100 --seed-superadmin-password 123456aA@
   npm run migration:backfill-slugs
   npm run inventory:dev
   
   # Frontend
   cd open-erp-web
   npm i
   npm start
   ```

2. **Login**: Navigate to `http://localhost:4200` and login with `superadmin@example.com/123456aA@`

3. **Test Context Menu**:
   - Go to Product list
   - Right-click on a product row (desktop only)
   - Verify context menu appears with appropriate actions
   - Test each action:
     - View: Should navigate to product detail
     - Edit: Should navigate to product edit
     - Publish: Should show confirmation and update status
     - Mark Inactive: Should show confirmation and update status
     - Delete: Should show confirmation and soft delete

4. **Test Slug Navigation**:
   - Click on a product to view details
   - Verify URL uses slug (e.g., `/product/laptop-hp-pavilion/view`)
   - Test direct URL access with slug
   - Test with SKU and ID (backward compatibility)

5. **Test API Endpoints**:
   ```bash
   # Get by slug
   curl http://localhost:3006/v1/products/laptop-hp-pavilion
   
   # Get by SKU
   curl http://localhost:3006/v1/products/SKU-001
   
   # Publish product
   curl -X POST http://localhost:3006/v1/products/laptop-hp-pavilion/publish
   
   # Mark inactive
   curl -X POST http://localhost:3006/v1/products/laptop-hp-pavilion/inactive
   ```

### Automated Testing

Consider adding tests for:

1. **Backend**:
   - Identifier resolution logic
   - Slug generation and uniqueness
   - Endpoint functionality
   - Error handling

2. **Frontend**:
   - Context menu rendering
   - Action handlers
   - Navigation logic
   - Service methods

## Migration Guide

### For Existing Deployments

1. **Backup database** before running migration

2. **Run migration script**:
   ```bash
   npm run migration:backfill-slugs
   ```

3. **Verify slugs**:
   ```bash
   # Check products have slugs
   db.products.countDocuments({ slug: { $exists: true, $ne: null, $ne: '' } })
   ```

4. **Deploy updated code**:
   - Backend services (inventory)
   - Frontend application

5. **Test thoroughly**:
   - Product list and context menu
   - Product navigation
   - API endpoints

### For New Deployments

- Slugs are automatically generated for new products
- No migration needed
- Ensure indexes are created (automatic with schema)

## Best Practices

1. **Always prefer slug** in frontend navigation
2. **Use fallback chain**: `product.slug || product.sku || product.id`
3. **Test identifier resolution** with all three types
4. **Keep slugs immutable** once created (or provide redirect mechanism)
5. **Monitor slug uniqueness** in production
6. **Use organizationId** parameter for scoped products

## Troubleshooting

### Slug Not Found

**Problem**: API returns 404 for slug-based requests

**Solutions**:
1. Run migration script: `npm run migration:backfill-slugs`
2. Verify slug exists in database
3. Check slug uniqueness constraints
4. Try using SKU or ID instead

### Duplicate Slug Errors

**Problem**: Error creating/updating product with duplicate slug

**Solutions**:
1. Slugs must be unique within organization scope
2. Use different product name or provide custom slug
3. Check for existing products with similar names

### Context Menu Not Showing

**Problem**: Right-click doesn't show context menu

**Solutions**:
1. Verify desktop viewport (context menu is desktop-only)
2. Check browser console for errors
3. Ensure PrimeNG ContextMenuModule is imported
4. Verify product data is loaded

## Future Enhancements

1. **Statistics Feature**: Implement product statistics view
2. **Bulk Actions**: Add bulk publish/inactive for multiple products
3. **Slug History**: Track slug changes and provide redirects
4. **Custom Slugs**: Allow users to edit slugs with validation
5. **Slug Analytics**: Track usage of slug-based URLs
6. **Performance**: Add caching for identifier resolution

## References

- PrimeNG ContextMenu: https://primeng.org/contextmenu
- Slugify Library: Used for slug generation
- Backend: `/open-erp-backend/apps/inventory/src/`
- Frontend: `/open-erp-web/src/app/private/modules/management/product/`
