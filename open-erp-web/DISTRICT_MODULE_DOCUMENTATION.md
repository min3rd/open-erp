# District Management Module Documentation

## Overview
This document describes the implementation of the District Management screen in the Open ERP web application. The module provides a complete CRUD interface for managing districts (Quận/Huyện) with support for multilingual names, geographic data, and filtering by province.

## Architecture

### Module Structure
```
src/app/private/modules/management/district/
├── district.ts                  # Main component wrapper
├── district.html                # Main component template
├── district.routes.ts           # Routing configuration
├── district.types.ts            # TypeScript interfaces and types
├── list/
│   ├── list.ts                  # List component logic
│   └── list.html                # List component template
├── form/
│   ├── form.ts                  # Form component logic
│   └── form.html                # Form component template
├── services/
│   └── district.service.ts     # Service for API interactions
└── resolvers/
    ├── district-list.resolver.ts    # Resolver for list data
    └── district-detail.resolver.ts  # Resolver for single district
```

## Key Features

### 1. District List View (`list.ts`, `list.html`)

#### Desktop Layout
- **Split View**: Two-panel layout with resizable splitter
  - Left panel: Data table with pagination
  - Right panel: Interactive map showing selected district geometry
- **Toolbar**: Search input and province filter dropdown
- **Actions Menu**: Export (CSV/GeoJSON) and Import options

#### Mobile Layout
- **Card-based List**: Touch-friendly card layout
- **Expandable Search**: Collapsible search panel with province filter
- **Responsive Pagination**: Simplified pagination controls

#### Features
- **Server-side Filtering**: Filter districts by province
- **Text Search**: Search by district name or code
- **Pagination**: Configurable page size (10, 20, 50, 100 items)
- **Export**: CSV and GeoJSON export with current filters
- **Map Integration**: Display district geometry on interactive map
- **Context Menu**: Right-click actions (View, Edit, Delete)

### 2. District Form (`form.ts`, `form.html`)

#### Modes
- **Create**: Add new district
- **Edit**: Modify existing district
- **View**: Read-only display

#### Form Fields
- **Code** (required): Unique district code
- **Name Vietnamese** (required): District name in Vietnamese
- **Name English** (required): District name in English  
- **Province** (required): Parent province selection
- **Population** (optional): District population
- **Note** (optional): Additional notes
- **Geometry** (optional): Geographic boundary/centroid

#### Features
- **Province Dropdown**: Select parent province from all available provinces
- **Geometry Editor**: Visual editor for geographic data
- **Map Preview**: Real-time preview of district location
- **Validation**: Client-side validation with error messages
- **Multilingual**: Full i18n support for all text

### 3. Service Layer (`district.service.ts`)

#### API Integration
All endpoints use the backend common-service API at `/v1/districts`:

```typescript
// CRUD Operations
getDistricts(params)       // GET  /v1/districts
getDistrict(id)            // GET  /v1/districts/:id
createDistrict(dto)        // POST /v1/districts
updateDistrict(id, dto)    // PATCH /v1/districts/:id
deleteDistrict(id)         // DELETE /v1/districts/:id

// Export Operations
exportToCSV(params)        // POST /v1/districts/export/csv
exportToGeoJSON(params)    // POST /v1/districts/export/geojson
importDistricts(file)      // POST /v1/districts/import
```

#### API Envelope Support
The service handles both:
- **New API envelope format**: `{ success, data: { items, page, ... }, meta, ... }`
- **Legacy format**: Direct data response

### 4. Data Types (`district.types.ts`)

#### District Interface
```typescript
interface District {
  id: string;
  code: string;
  name: {
    vi: string;  // Vietnamese name
    en: string;  // English name
  };
  provinceId: string;
  provinceName?: string;
  provinceCode?: string;
  population?: number;
  centroid?: Geometry;      // GeoJSON Point
  bbox?: number[];          // Bounding box
  geometry?: Geometry;      // GeoJSON geometry
  note?: string;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
```

#### Query Parameters
```typescript
interface GetDistrictsParams {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 10)
  search?: string;      // Text search query
  provinceId?: string;  // Filter by province
}
```

## Routing

### URL Structure
```
/management/district/:filter/:page/:limit
```

- **filter**: Search query or 'all'
- **page**: Current page number
- **limit**: Items per page

### Child Routes
```
/management/district/all/1/10/new              # Create new district
/management/district/all/1/10/:code/view       # View district details
/management/district/all/1/10/:code/edit       # Edit district
```

## Internationalization (i18n)

### Supported Languages
- English (en)
- Spanish (es)

### Translation Keys
All user-facing text uses Transloco translation keys under:
- `districtList.*`: List view translations
- `districtForm.*`: Form translations

Examples:
```json
{
  "districtList": {
    "title": "District Management",
    "search": {
      "placeholder": "Search by name, code..."
    },
    "table": {
      "nameVi": "Name (Vietnamese)",
      "province": "Province"
    }
  }
}
```

## Accessibility

### WCAG AA Compliance
- **Unique IDs**: All interactive elements have unique IDs
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: Meets minimum contrast requirements
- **Touch Targets**: Minimum 44px for mobile interactions

### ID Naming Convention
```
{component}-{element}-{qualifier}

Examples:
- district-list-toolbar
- district-form-code
- district-list-search-mobile
```

## State Management

### Signals-based Reactivity
All components use Angular signals for reactive state:

```typescript
// State signals
protected readonly districts = signal<District[]>([]);
protected readonly isLoading = signal(false);
protected readonly currentPage = signal(1);

// Computed signals
protected readonly totalPages = computed(() => 
  Math.ceil(this.totalRecords() / this.pageSize())
);
```

### Benefits
- **Fine-grained reactivity**: Only affected components update
- **Better performance**: OnPush change detection
- **Type safety**: Full TypeScript support
- **Simpler code**: No need for RxJS in components

## Integration Points

### Province Service Dependency
The district module depends on the Province service for:
- Loading province list for filter dropdown
- Displaying province names in district list

### Map Component
Integration with core map component for:
- Displaying district geometry/centroid
- Visual selection feedback
- Geographic data visualization

### Navigation Service
Dynamic navigation from backend config-service:
- Module navigation items loaded from API
- No hardcoded menu structure
- Flexible and maintainable

## Testing Considerations

### Unit Testing
Key areas to test:
- Service API calls and response handling
- Component state management
- Form validation
- Error handling

### Integration Testing
- CRUD operations flow
- Province filter functionality
- Pagination behavior
- Export/import operations

### E2E Testing
- Complete user workflows
- Mobile responsive behavior
- Accessibility compliance

## Performance Optimizations

1. **OnPush Change Detection**: All components use OnPush strategy
2. **Lazy Loading**: District module loaded on demand
3. **Resolvers**: Pre-fetch data before route activation
4. **Virtual Scrolling**: Can be added for large datasets
5. **Debounced Search**: Prevent excessive API calls

## Known Limitations

1. **Province Loading**: Currently loads all provinces (up to 1000) - acceptable for Vietnam's 63 provinces
2. **Import Feature**: UI placeholder only - backend implementation required
3. **Backend Dependency**: Requires common-service API endpoints to be functional
4. **Geometry Complexity**: Large/complex geometries may impact map performance

## Future Enhancements

1. **Advanced Filtering**: Additional filter options (population range, etc.)
2. **Bulk Operations**: Multi-select for batch actions
3. **Import Validation**: Preview and validate import data
4. **Audit Trail**: Track changes and history
5. **Export Templates**: Customizable export formats
6. **Offline Support**: PWA capabilities for offline access

## Dependencies

### Runtime Dependencies
- `@angular/core`: ^21.0.0
- `@angular/forms`: ^21.0.0
- `@angular/router`: ^21.0.0
- `primeng`: ^21.0.2
- `@jsverse/transloco`: ^8.2.0
- `leaflet`: ^1.9.4
- `@types/geojson`: ^7946.0.16

### Development Dependencies
- `typescript`: ~5.9.2
- `@angular/cli`: ^21.0.4

## API Contract

### Expected Backend Endpoints

#### GET /v1/districts
Query parameters:
- `page`: number
- `size`: number  
- `q`: string (search)
- `provinceId`: string

Response:
```json
{
  "success": true,
  "data": {
    "items": [District[]],
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### GET /v1/districts/:id
Response:
```json
{
  "success": true,
  "data": {
    "item": District
  }
}
```

#### POST /v1/districts
Body: `CreateDistrictDto`
Response: Single district item

#### PATCH /v1/districts/:id
Body: `UpdateDistrictDto`
Response: Updated district item

#### DELETE /v1/districts/:id
Response: 204 No Content

#### POST /v1/districts/export/csv
Query parameters: Same as GET list
Response: CSV file blob

#### POST /v1/districts/export/geojson
Query parameters: Same as GET list
Response: GeoJSON file blob

## Maintenance

### Adding New Fields
1. Update `District` interface in `district.types.ts`
2. Update DTOs if field is editable
3. Add form control in `form.ts`
4. Add input field in `form.html`
5. Add table column in `list.html` if needed
6. Add translation keys in `en.json` and `es.json`

### Modifying Filters
1. Update `GetDistrictsParams` interface
2. Add filter UI in toolbar (desktop) and search panel (mobile)
3. Update `loadDistricts()` method to include new filter
4. Add translation keys for filter labels

## Security Considerations

1. **XSS Prevention**: All user input is sanitized by Angular
2. **CSRF Protection**: Handled by backend
3. **Authorization**: Verify backend enforces permissions
4. **Input Validation**: Client-side validation + backend validation required
5. **SQL Injection**: Backend responsibility - use parameterized queries

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions
- Mobile Safari/Chrome: Latest 2 versions

## Conclusion

The District Management module provides a complete, production-ready solution for managing district data with a focus on:
- User experience (responsive, accessible, performant)
- Developer experience (maintainable, well-typed, documented)
- Internationalization (multilingual support)
- Integration (works seamlessly with existing modules)

For questions or issues, refer to the main repository documentation or contact the development team.
