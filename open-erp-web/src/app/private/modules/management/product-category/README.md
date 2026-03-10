# Product Category Management Screen

## Overview

This module provides a comprehensive Product Category management interface with full CRUD operations, following the product-type module pattern.

## Location

- **Frontend Module**: `open-erp-web/src/app/private/modules/management/product-category/`
- **Service**: `open-erp-web/src/core/services/product-category/product-category.service.ts`
- **Backend API**: `open-erp-backend/apps/inventory/src/controllers/product-category.controller.ts`

## Features

### 1. List View (Desktop & Mobile)

- **Desktop**: PrimeNG table with sortable columns, pagination, and context menu
- **Mobile**: Responsive card-based list with touch-optimized actions
- **Columns**: Code, Name, Parent Category, Description, Status (Active/Inactive), Order, Level
- **Configurable Columns**: Users can show/hide columns via column selector

### 2. Search & Filter

- **Search**: Real-time server-side search across code, name, and description
- **Filter by Status**: All / Active / Inactive
- **Multi-field Sorting**:
  - Code (A-Z, Z-A)
  - Name (A-Z, Z-A)
  - Order (Low to High, High to Low)
  - Level (Low to High, High to Low)

### 3. CRUD Operations

- **Create**: Add new category via drawer form
- **Read/View**: View category details in read-only mode
- **Update/Edit**: Edit existing category via drawer form
- **Delete**: Soft delete with confirmation dialog
- **Bulk Delete**: Delete multiple selected categories

### 4. Form Fields

- **Code** (required): Unique identifier, 2-50 characters
- **Name** (required): Display name, 2-100 characters
- **Parent Category** (optional): Dropdown selection for hierarchical structure
- **Description** (optional): Text description, max 500 characters
- **Active Status**: Toggle switch (default: true)
- **Display Order**: Number input, min 0 (default: 0)
- **Metadata**: JSON object for custom data (optional)

### 5. Import/Export

- **Export CSV**: Export current filtered/searched results
- **Import CSV**: Upload CSV file with error handling and result feedback

## Routes

- Base: `/management/product-category`
- Default: `/management/product-category/-/1/100` (all categories, page 1, 100 per page)
- Search: `/management/product-category/:search/:page/:limit`
- New: `/management/product-category/:search/:page/:limit/new`
- View: `/management/product-category/:search/:page/:limit/:id/view`
- Edit: `/management/product-category/:search/:page/:limit/:id/edit`

## API Endpoints

Base URL: `http://localhost:3006/config/product-categories`

- `GET /config/product-categories` - List with pagination, search, filter
- `GET /config/product-categories/:id` - Get by ID
- `GET /config/product-categories/tree` - Get hierarchical tree
- `GET /config/product-categories/roots` - Get root categories
- `GET /config/product-categories/:id/children` - Get direct children
- `GET /config/product-categories/:id/descendants` - Get all descendants
- `POST /config/product-categories` - Create new category
- `PUT /config/product-categories/:id` - Update category
- `DELETE /config/product-categories/:id` - Soft delete category

## Permissions

- **PRODUCT_CATEGORY_READ**: Required to view categories
- **MANAGE_PRODUCT_CATEGORY**: Required to create, update, delete categories

## Translations

Supported languages: English (en), Vietnamese (vi), Spanish (es)

Translation keys:

- `productCategoryList.*` - List view labels and messages
- `productCategoryForm.*` - Form labels and validation messages

## Technical Stack

- **Angular 21.1.1**: Standalone components with signals
- **PrimeNG 21.0.4**: UI components (Table, Drawer, Form controls)
- **Transloco 8.2.1**: Internationalization
- **RxJS 7.8.2**: Reactive programming
- **TypeScript 5.9.2**: Type safety

## Build Status

✅ Build successful - product-category-routes chunk: 47.70 kB (9.72 kB gzipped)

## Future Enhancements

1. Tree view for hierarchical category display
2. Drag-and-drop reordering
3. Bulk import with validation preview
4. Export with custom column selection
5. Category icons/images support
6. Advanced filtering (by level, parent, date range)
