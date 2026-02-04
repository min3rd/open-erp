# Product Form Component

## Overview

The Product Form component provides a comprehensive interface for creating new products in the open-erp system. The form is displayed as a right-side drawer with a header, scrollable body with tabs, and a fixed footer.

## Features

### Header Section (Fixed)
- **Scope**: Global or Organization selection
- **Organization ID**: Conditional field (shown when scope is Organization)
- **SKU**: Required product identifier
- **Name**: Required product name
- **Slug**: Auto-generated URL-friendly identifier from name (editable)
- **Thumbnail**: Image upload with preview and validation
- **Status**: Product status (Draft, Active, Inactive, Discontinued)

### Body Section (Scrollable with Tabs)

#### 1. General Info Tab
- International Name
- Description (multi-line)
- Product Type (dropdown from API)
- Category (dropdown from API)
- Unit of measurement
- Barcode

#### 2. Media Tab
- Placeholder for future image/video gallery implementation
- Will support multiple file uploads

#### 3. Dimensions & Weight Tab
- Weight (kg) with decimal support
- Length, Width, Height (cm)
- Expiry Days

#### 4. Storage Conditions Tab
- Storage conditions text area
- Free-form text for storage requirements

#### 5. Warehouse Settings Tab
- Placeholder for warehouse-specific configuration
- Will support per-warehouse settings

#### 6. Custom Fields Tab
- Placeholder for custom key-value fields
- Will support JSON editor for metadata

### Footer Section (Fixed)
- **Cancel**: Navigate back to product list (with confirmation if form is dirty)
- **Randomize**: Fill form with random test data for development
- **Save Draft**: Save product with Draft status
- **Add New**: Create product with selected status

## Usage

### Navigation
From the product list page, click the "+" icon to navigate to the new product form:
```
/modules/management/product/:search/:status/:type/:category/:sort/:page/:limit/new
```

### Form Validation
Required fields:
- SKU
- Name
- Type
- Unit
- Scope
- Status

Optional fields:
- All others are optional

### File Upload
Supported image formats:
- JPEG/JPG
- PNG
- WebP

Maximum file size: 5MB

### Slug Generation
- Automatically generated from product name
- Converts to lowercase
- Removes diacritics and special characters
- Replaces spaces with hyphens
- Can be manually edited

## API Integration

### Endpoint
`POST /api/inventory/v1/products`

### Request Body (CreateProductDto)
```typescript
{
  scope: ProductScope;           // 'global' | 'organization'
  organizationId?: string;       // Required if scope is 'organization'
  sku: string;                   // Required
  name: string;                  // Required
  internationalName?: string;
  description?: string;
  type: string;                  // Required
  status: ProductStatus;         // Required
  unit: string;                  // Required
  categoryId?: string;
  barcode?: string;
  metadata?: Record<string, any>;
}
```

### Response
Returns created product with 201 status code on success.

## Development

### Component Structure
```
form/
├── form.ts          # Component logic
├── form.html        # Template
└── README.md        # This file
```

### Key Dependencies
- Angular 18+ (standalone components)
- PrimeNG 21.0.4 (UI components)
- RxJS (reactive programming)
- Transloco (i18n)

### Form State Management
Uses Angular Signals for reactive state:
- `isVisible`: Drawer visibility
- `isLoading`: Form submission state
- `thumbnailPreview`: Image preview URL
- `activeTabIndex`: Current active tab
- `product`: Loaded product (null for new)

### Memory Management
- Uses `takeUntilDestroyed` for automatic subscription cleanup
- Properly destroys all subscriptions on component destruction
- No memory leaks

## Testing

### Random Data Generation
Click "Randomize" button to fill form with test data:
- Random SKU (SKU-xxxxx)
- Random product name
- Auto-generated slug
- Random international name
- Sample description
- Random barcode
- Random dimensions and weight
- Sample storage conditions
- Random expiry days

### Manual Testing Steps
1. Navigate to product list
2. Click "+" icon to open form
3. Fill required fields (SKU, Name, Type, Unit)
4. Verify slug auto-generation
5. Upload thumbnail image
6. Switch between tabs
7. Click "Randomize" to test data filling
8. Click "Save Draft" to create with draft status
9. Click "Add New" to create with selected status
10. Verify navigation back to list on success
11. Verify error handling on API failure

## Localization

### Supported Languages
- English (en)
- Vietnamese (vi)

### Translation Keys
All translation keys are prefixed with `productForm.`:
- `productForm.title.*` - Form titles
- `productForm.fields.*` - Field labels and placeholders
- `productForm.tabs.*` - Tab labels
- `productForm.actions.*` - Button labels
- `productForm.messages.*` - Success/error messages

## Security

### Validation
- Client-side validation for all required fields
- File type and size validation for uploads
- Prevent XSS with Angular's sanitization
- No sensitive data exposure in errors

### CodeQL Scan
✅ Passed with 0 vulnerabilities

## Future Enhancements

### Planned Features
1. **Media Gallery**: Full image/video upload with gallery view
2. **Warehouse Settings**: Per-warehouse configuration UI
3. **Custom Fields**: Dynamic key-value editor with JSON support
4. **Edit Mode**: Support for editing existing products
5. **View Mode**: Read-only view of products
6. **Draft Auto-save**: Periodic auto-save of draft data
7. **Duplicate Product**: Create product from existing template
8. **Bulk Import**: CSV import with field mapping

### Performance Improvements
1. Implement virtual scrolling for large dropdown lists
2. Add search/filter for product types and categories
3. Implement debounced slug generation
4. Add progressive image loading

## Known Limitations

1. Product type and category dropdowns are limited to 1000 items each
2. Media tab is placeholder only (not yet implemented)
3. Warehouse settings tab is placeholder only
4. Custom fields tab is placeholder only
5. No support for edit/view modes yet (create only)

## Related Components

- `ProductList` - Product list view
- `ProductTypeForm` - Product type management
- `ProductCategoryForm` - Product category management

## Support

For issues or questions, please refer to:
- GitHub Issues: [open-erp repository](https://github.com/min3rd/open-erp)
- Documentation: `/docs` directory
