# Product Type Management Module

## Overview
This module provides a comprehensive interface for managing Product Types in the Open ERP system. Product Types are configurable entities that define the structure and attributes for different categories of products in the inventory system.

## Features

### List View
- **Responsive Design**: Optimized for both desktop (table) and mobile (list) views
- **Server-side Pagination**: Efficient handling of large datasets
- **Search & Filter**: Real-time search by code/name, filter by status (active/inactive)
- **Bulk Operations**: Select multiple items for batch delete operations
- **Context Menu**: Right-click actions for quick access to view/edit/delete
- **Export**: Export product types to CSV format

### Form View (Drawer)
- **Three Modes**: Create new, Edit existing, or View read-only
- **Validation**: Client-side form validation with error messages
- **Dynamic Attributes**: Add custom attributes with different data types:
  - String
  - Number
  - Boolean
  - Date
  - Select (with custom options)
- **Responsive Drawer**: Side panel that adapts to screen size

### Routing & State Management
- **URL-based State**: All filters, search, pagination preserved in URL
- **Deep Linking**: Share URLs with current state
- **Browser Navigation**: Back/forward buttons work correctly
- **Route Pattern**: `/management/product-type/:scope/:search/:page/:limit[/:id/:action]`
  - `scope`: all | active | inactive
  - `search`: search query or `-` for none
  - `page`: current page number
  - `limit`: items per page
  - `id`: product type ID (optional, for edit/view)
  - `action`: new | edit | view (optional)

## API Integration

### Endpoints Used
All endpoints are in the `inventory` service at `http://localhost:3006/v1/config/product-types`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List product types with pagination and filters |
| GET | `/active` | Get only active product types |
| GET | `/:id` | Get single product type by ID |
| POST | `/` | Create new product type |
| PUT | `/:id` | Update existing product type |
| DELETE | `/:id` | Delete product type (soft delete) |
| GET | `/export/csv` | Export to CSV (if implemented in backend) |
| POST | `/import/csv` | Import from CSV (if implemented in backend) |

### Query Parameters
- `page` (number): Page number for pagination
- `limit` (number): Items per page
- `isActive` (boolean): Filter by active status
- `search` (string): Search by code, name, or description

## Data Model

### ProductType
```typescript
{
  id: string;
  code: string;              // Unique identifier
  name: string;              // Display name
  description?: string;      // Optional description
  isActive: boolean;         // Active status
  attributes: AttributeDefinition[];  // Custom attributes
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
```

### AttributeDefinition
```typescript
{
  name: string;              // Attribute identifier
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  label?: string;            // Display label
  description?: string;      // Help text
  required?: boolean;        // Is this attribute required
  options?: string[];        // For select type only
  defaultValue?: string;     // Default value
  validation?: Record<string, any>;  // Custom validation rules
}
```

## Usage Examples

### Accessing the Module
Navigate to: `/management/product-type`

This will redirect to: `/management/product-type/all/-/1/100`
- Shows all product types
- No search filter
- Page 1
- 100 items per page

### Creating a Product Type
1. Click "New" button in the toolbar
2. Fill in required fields:
   - Code: Unique identifier (e.g., `raw_material`)
   - Name: Display name (e.g., `Raw Material`)
   - Description (optional)
   - Active status (checked by default)
3. Add custom attributes if needed:
   - Click "Add Attribute"
   - Define attribute properties (name, type, label, etc.)
   - For select type, specify comma-separated options
4. Click "Save" to create

### Editing a Product Type
1. Find the product type in the list
2. Click the edit icon (pencil) or right-click → Edit
3. Modify fields as needed
4. Click "Save" to update

### Viewing a Product Type
1. Find the product type in the list
2. Click the view icon (eye) or click on the row
3. View all details in read-only mode
4. Click "Edit" button to switch to edit mode

### Searching and Filtering
1. **Scope Selector**: Choose All, Active, or Inactive
2. **Search Box**: Type to search by code or name
3. Press Enter or click away to apply search
4. Results update automatically with new URL

### Bulk Operations
1. Select multiple items using checkboxes
2. Click "Bulk Actions" button
3. Choose action (e.g., Delete)
4. Confirm the operation

### Exporting Data
1. Apply desired filters and search
2. Click "Export CSV" button
3. File downloads automatically with timestamp

## Internationalization (i18n)

The module supports three languages:
- Vietnamese (vi) - Default
- English (en)
- Spanish (es)

All text strings are externalized in translation files:
- `/public/i18n/vi.json`
- `/public/i18n/en.json`
- `/public/i18n/es.json`

Translation keys are prefixed with:
- `productTypeList.*` for list view
- `productTypeForm.*` for form view

## Permissions

The module respects the following permissions:
- `PRODUCT_TYPE_READ`: View product types
- `MANAGE_PRODUCT_TYPE`: Create, update, delete product types

These are enforced on the backend. The frontend will receive appropriate error messages if permissions are insufficient.

## Technical Details

### File Structure
```
product-type/
├── list/
│   ├── list.ts           # List component (TypeScript)
│   └── list.html         # List template (HTML)
├── form/
│   ├── form.ts           # Form component (TypeScript)
│   └── form.html         # Form template (HTML)
├── resolvers/
│   ├── product-type-list.resolver.ts    # Pre-fetch list data
│   └── product-type-detail.resolver.ts  # Pre-fetch detail data
├── product-type.ts       # Root component
├── product-type.html     # Root template
├── product-type.routes.ts  # Routing configuration
└── product-type.types.ts   # Type exports
```

### Service Location
```
core/services/product-type/
└── product-type.service.ts  # API service
```

### Dependencies
- **PrimeNG Components**: Table, Drawer, Button, Toolbar, Menu, Select, Checkbox, Textarea
- **Angular Forms**: ReactiveFormsModule for form handling
- **Transloco**: For internationalization
- **RxJS**: For reactive programming

## Known Limitations

1. **Import/Export**: The CSV import/export endpoints may need to be implemented in the backend.
2. **Column Configuration**: The ability to select visible columns is planned but not yet implemented.
3. **Advanced Sorting**: Only basic sorting is available; multi-column sort is not implemented.
4. **Batch Edit**: Only batch delete is supported; batch edit is not available.

## Future Enhancements

1. Implement column visibility configuration
2. Add advanced search with multiple criteria
3. Implement import wizard with error handling
4. Add attribute templates for common product types
5. Support for nested/complex attribute types
6. Attribute validation preview
7. Audit log for changes

## Troubleshooting

### Issue: Form doesn't save
**Solution**: Check browser console for validation errors. Ensure all required fields are filled.

### Issue: List doesn't load
**Solution**: Verify backend inventory service is running at `http://localhost:3006`

### Issue: Permission errors
**Solution**: Ensure user has `PRODUCT_TYPE_READ` or `MANAGE_PRODUCT_TYPE` permissions.

### Issue: Translation missing
**Solution**: Check that translation keys exist in all three language files (vi.json, en.json, es.json).

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify backend API is accessible
3. Review network requests in browser DevTools
4. Check backend logs for server-side errors

## Related Modules

- **Product Management**: Uses product types to categorize products
- **Inventory Management**: Product types define inventory item structures
- **Warehouse Management**: Related to storage and categorization
