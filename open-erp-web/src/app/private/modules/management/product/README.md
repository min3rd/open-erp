# Product Management Module

## Overview

This module provides a comprehensive product management interface with list view functionality for both desktop and mobile devices. It follows the Fluent UI design principles from Microsoft for a compact, information-dense interface.

## Features

### List View
- **Desktop**: Table view with advanced features
  - Server-side pagination, search, filtering, and sorting
  - Column resizing, reordering, and visibility control
  - Multi-select with bulk operations
  - Context menu on rows
  - Responsive column layout
  
- **Mobile**: Optimized card-based list view
  - Touch-friendly interface
  - Compact card display with key information
  - Expandable search panel
  - Action buttons on each card

### Toolbar Features
- **Search**: Full-text search across product name, SKU, and barcode
- **Filter**: Filter by product status (Active, Inactive, Draft, Discontinued)
- **Sort**: Multiple sort options (SKU, Name, Type, Status - ascending/descending)
- **Actions Menu**:
  - Export to CSV
  - Import from CSV
  - Bulk delete selected items

### Server-Side Operations
All data operations are performed server-side for optimal performance:
- Search queries
- Filtering by status
- Sorting by various fields
- Pagination with configurable page sizes (10, 25, 50, 100)

## Routes

The module uses a stateful URL pattern to support browser back/forward navigation and shareable links:

```
/private/management/product/:search/:filter/:sort/:page/:limit
```

### Route Parameters

- **search**: Search query string (use `-` for empty search)
- **filter**: Status filter (`all`, `active`, `inactive`, `draft`, `discontinued`)
- **sort**: Sort configuration in format `[field,order]` (e.g., `[name,asc]`)
- **page**: Current page number (1-based)
- **limit**: Items per page (10, 25, 50, or 100)

### Default Route

```
/private/management/product/-/all/[name,asc]/1/100
```

### Examples

```
# Search for "laptop" products
/private/management/product/laptop/all/[name,asc]/1/100

# Filter only active products
/private/management/product/-/active/[name,asc]/1/100

# Sort by SKU descending
/private/management/product/-/all/[sku,desc]/1/100

# Page 2 with 50 items per page
/private/management/product/-/all/[name,asc]/2/50
```

## API Endpoints

The module integrates with the following backend endpoints:

### List & Search
- `GET /v1/products` - Get paginated product list
  - Query params: `page`, `limit`, `search`, `status`, `type`, `scope`, `category`, `tags`, `sort`

### CRUD Operations
- `GET /v1/products/:id` - Get single product
- `POST /v1/products` - Create new product
- `PATCH /v1/products/:id` - Update product
- `DELETE /v1/products/:id` - Soft delete product
- `POST /v1/products/:id/restore` - Restore deleted product

### Bulk Operations
- Delete multiple products (implemented client-side via sequential API calls)

### Import/Export
- `GET /v1/products/export/csv` - Export products to CSV
- `POST /v1/products/import/csv` - Import products from CSV file

## Import/Export Format

### CSV Export
Exports current filtered/searched product list to CSV with the following columns:
- SKU
- Name
- International Name
- Type
- Status
- Unit
- Category
- Barcode
- Description

### CSV Import
Import CSV file with product data. The file should include:
- Required fields: `sku`, `name`, `type`, `status`, `unit`
- Optional fields: `internationalName`, `description`, `barcode`, `category`, `scope`, `organizationId`

Import results show:
- Number of successfully imported products
- Number of failed imports
- Error details for failed rows

## Permissions

The module respects the following permissions (TODO: Implementation pending):
- `PRODUCT_READ` - View products
- `PRODUCT_CREATE` - Create new products
- `PRODUCT_UPDATE` - Edit existing products
- `PRODUCT_DELETE` - Delete products
- `PRODUCT_MANAGE` - Full management access (required for import/export)

## Product Types

The system supports various product types suitable for different industries:

- Manufacturing: Raw Material, Component, Finished Good, Semi-Finished, etc.
- Trade: Merchandise, Agricultural, Seafood, Handicraft, Textile, etc.
- Food & Beverage: Food, Beverage, Fresh Produce, Processed Food
- Healthcare: Medicine, Medical Device, Cosmetic
- Others: Service, Digital, Software, Book, Stationery, etc.

## Product Status

- **Active**: Product is active and available
- **Inactive**: Product is temporarily inactive
- **Draft**: Product is in draft state (not published)
- **Discontinued**: Product is discontinued and no longer available

## State Management

The component uses Angular signals for reactive state management:
- `products()` - Current page products
- `isLoading()` - Loading state
- `searchQuery()` - Current search text
- `currentPage()` - Current page number
- `pageSize()` - Items per page
- `totalRecords()` - Total number of products
- `isMobile()` - Mobile viewport detection

## Translation Keys

All UI text is internationalized using Transloco with keys under:
- `productList.*` - List view translations
- `productType.*` - Product type translations
- `productStatus.*` - Product status translations

Supported languages:
- English (`en`)
- Vietnamese (`vi`)

## Component Structure

```
product/
├── list/
│   ├── list.ts          - List component logic
│   └── list.html        - List component template
├── resolvers/
│   └── product-list.resolver.ts - Pre-loads list data
├── product.ts           - Module wrapper component
├── product.html         - Router outlet template
├── product.routes.ts    - Route configuration
├── product.types.ts     - Type definitions
└── README.md           - This file
```

## Development

### Running the Application

1. Start backend services:
   ```bash
   cd open-erp-backend
   npm i
   npm run docker:dev:up
   npm run db:seed:all --drop --confirm --org-count 100 --warehouse-count 100 --user-count 100 --seed-superadmin-password 123456aA@
   # Run necessary services (auth, user, inventory)
   ```

2. Start frontend:
   ```bash
   cd open-erp-web
   npm i
   npm start
   ```

3. Access at `http://localhost:4200`
4. Login with `superadmin@example.com` / `123456aA@`

### Future Enhancements

- [ ] Product form component for create/edit/view
- [ ] Advanced filtering (by type, category, tags)
- [ ] Column visibility preferences persistence
- [ ] Export to Excel format
- [ ] Bulk update operations
- [ ] Product image preview in list
- [ ] Quick edit inline
- [ ] Product duplication
- [ ] Version history view

## References

This module follows the design patterns from the `product-category` module for consistency across the application.
