# Ward Management Module Documentation

## Overview
This document describes the implementation of the Ward Management screen in the Open ERP web application. The module provides a complete CRUD interface for managing wards (Phường/Xã) with support for multilingual names, geographic data, and filtering by province and district.

## Architecture

### Module Structure
```
src/app/private/modules/management/ward/
├── ward.ts                      # Main component wrapper
├── ward.html                    # Main component template
├── ward.routes.ts               # Routing configuration
├── ward.types.ts                # TypeScript interfaces and types
├── list/
│   ├── list.ts                  # List component logic
│   └── list.html                # List component template
├── form/
│   ├── form.ts                  # Form component logic
│   └── form.html                # Form component template
├── services/
│   └── ward.service.ts         # Service for API interactions
└── resolvers/
    ├── ward-list.resolver.ts    # Resolver for list data
    └── ward-detail.resolver.ts  # Resolver for single ward
```

## Key Features

### 1. Ward List View (`list.ts`, `list.html`)

#### Desktop Layout
- **Split View**: Two-panel layout with resizable splitter
  - Left panel: Data table with pagination
  - Right panel: Interactive map showing selected ward geometry
- **Toolbar**: Search input, province filter dropdown, and district filter dropdown
- **Actions Menu**: Export (CSV/GeoJSON) and Import options

#### Mobile Layout
- **Card-based List**: Touch-friendly card layout
- **Expandable Search**: Collapsible search panel with province and district filters
- **Responsive Pagination**: Simplified pagination controls

#### Features
- **Server-side Filtering**: Filter wards by province and district (cascading filters)
- **Text Search**: Search by ward name or code
- **Pagination**: Configurable page size (10, 20, 50, 100 items)
- **Export**: CSV and GeoJSON export with current filters
- **Map Integration**: Display ward geometry on interactive map
- **Context Menu**: Right-click actions (View, Edit, Delete)

### 2. Ward Form (`form.ts`, `form.html`)

#### Modes
- **Create**: Add new ward
- **Edit**: Modify existing ward
- **View**: Read-only display

#### Form Fields
- **Code** (required): Unique ward code
- **Province** (required): Parent province selection (dropdown)
- **District** (required): Parent district selection (dropdown, filtered by province)
- **Name Vietnamese** (required): Ward name in Vietnamese
- **Name English** (optional): Ward name in English  
- **Note** (optional): Additional notes
- **Is Legacy** (optional): Toggle for legacy wards
- **Geometry** (optional): Geographic boundary/centroid

#### Features
- **Cascading Dropdowns**: District dropdown is filtered based on selected province
- **Province & District Dropdowns**: Select parent province and district from all available options
- **Geometry Editor**: Visual editor for geographic data
- **Map Preview**: Real-time preview of ward location
- **Validation**: Client-side validation with error messages
- **Multilingual**: Full i18n support for all text (English, Vietnamese, Spanish)

### 3. Service Layer (`ward.service.ts`)

#### API Integration
All endpoints use the backend common-service API at `/v1/wards`:

```typescript
// CRUD Operations
getWards(params)         // GET  /v1/wards
getWard(code)            // GET  /v1/wards/:code
createWard(dto)          // POST /v1/wards
updateWard(code, dto)    // PATCH /v1/wards/:code
deleteWard(code)         // DELETE /v1/wards/:code

// Export Operations
exportToCSV(params)      // POST /v1/wards/export/csv
exportToGeoJSON(params)  // POST /v1/wards/export/geojson
importWards(file)        // POST /v1/wards/import
```

#### API Envelope Support
The service handles the new API envelope format: `{ success, data: { items, page, ... }, meta, ... }`

### 4. Data Types (`ward.types.ts`)

```typescript
interface Ward {
  id: string;
  code: string;
  name: string;              // Vietnamese name (primary)
  nameEn?: string;           // English name (optional)
  provinceCode: string;
  districtCode: string;
  sortOrder?: number;
  version?: string;
  isLegacy?: boolean;
  geometry?: Geometry;
  geometrySimplified?: Geometry;
  centroid?: { lat: number; lon: number };
  bbox?: number[];
  areaSqKm?: number;
  geometrySource?: string;
  geometryVersion?: number;
  geometryUpdatedAt?: string;
  geometryUpdatedBy?: string;
  geometryMeta?: Record<string, any>;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 5. Routing Configuration (`ward.routes.ts`)

Routes follow a structured pattern with support for filtering and pagination:
- Base path: `/management/ward`
- List route: `/:provinceFilter/:districtFilter/:filter/:page/:limit`
- Detail routes: `/:code/view` or `/:code/edit`
- Create route: `/new`

Example routes:
- `/management/ward/all-provinces/all-districts/all/1/100` - List all wards
- `/management/ward/P001/all-districts/all/1/100` - Filter by province P001
- `/management/ward/P001/D001/all/1/100` - Filter by province P001 and district D001
- `/management/ward/all-provinces/all-districts/search-term/1/100` - Search wards

### 6. Resolvers

#### WardListResolver
Preloads ward list data with pagination and filters before route activation.
Also loads province and district lists for filter dropdowns.

#### WardDetailResolver
Preloads single ward data for view/edit modes.

## Internationalization (i18n)

All user-facing text is translatable through Transloco with keys in:
- `public/i18n/en.json` - English translations
- `public/i18n/vi.json` - Vietnamese translations
- `public/i18n/es.json` - Spanish translations

Translation key namespaces:
- `wardList.*` - List view labels, messages, and actions
- `wardForm.*` - Form labels, validation messages, and buttons

## Accessibility

- All interactive elements have unique `id` attributes following kebab-case naming convention
- ARIA labels and attributes for screen reader support
- Keyboard navigation support
- Focus management for mobile search expansion
- Color contrast meets WCAG AA standards

## Integration with Backend

The module integrates with the `common-service` backend API:
- Base URL: `${API_URI_COMMON}/v1/wards`
- Uses API envelope format with `unwrap()` utility
- Supports pagination, filtering by province/district, and text search
- Export/Import functionality with CSV and GeoJSON formats

## Navigation

Ward management is accessible from the Management module navigation menu. Navigation items are loaded dynamically from the backend navigation service.

To add the ward management menu item, use the backend navigation management screen to create a new navigation item:
- **Label**: "Ward Management" / "Quản lý Phường/Xã"
- **Icon**: `pi pi-map-marker`
- **Router Link**: `/management/ward`
- **Module**: `management`
- **Order**: After district management

## Testing

### Unit Tests
Create unit tests for:
- WardService: CRUD operations and API integration
- WardList component: Filtering, pagination, and user interactions
- WardForm component: Form validation and submission

### Integration Tests
Test end-to-end workflows:
1. List wards with province and district filters
2. Create new ward with all required fields
3. Edit existing ward
4. Delete ward with confirmation
5. Export wards to CSV/GeoJSON
6. Search and filter operations

### Test with Backend
To test with the backend:
1. Clone and run `open-erp-backend` repository
2. Ensure common-service is running on correct port
3. Configure `API_URI_COMMON` in frontend constants
4. Test CRUD operations against real API
5. Verify data persistence and validation

## Future Enhancements

- **Bulk Operations**: Select multiple wards for batch actions
- **Import Functionality**: Upload CSV/GeoJSON files to import wards
- **Advanced Filtering**: Filter by area, geometry availability, etc.
- **Map Drawing**: Draw ward boundaries directly on the map
- **Audit Trail**: Show change history for each ward
- **Data Validation**: Server-side validation feedback
- **Performance**: Virtual scrolling for large lists
