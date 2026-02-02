# Administrative Unit Management Module - TreeTable Documentation

## Overview
This document describes the implementation of the Administrative Unit Management module for Open ERP Web, featuring a hierarchical TreeTable interface for managing Vietnamese administrative divisions (Tỉnh/Thành → Quận/Huyện → Phường/Xã).

## Access URL
```
/private/modules/management/administrative-unit
```

Default route redirects to:
```
/private/modules/management/administrative-unit/all/1/100
```

## Architecture

### Module Structure
```
src/app/private/modules/management/administrative-unit/
├── administrative-unit.ts           # Main component wrapper
├── administrative-unit.routes.ts    # Routing configuration
├── administrative-unit.types.ts     # TypeScript interfaces and types
├── list/
│   ├── list.ts                      # List component logic
│   └── list.html                    # List component template
├── form/
│   ├── form.ts                      # Form component logic
│   └── form.html                    # Form component template
├── services/
│   └── administrative-unit.service.ts # Service for API interactions
└── resolvers/
    ├── admin-unit-tree.resolver.ts  # Resolver for tree data
    └── admin-unit-detail.resolver.ts # Resolver for single unit
```

## Key Features

### 1. Hierarchical TreeTable View

#### Desktop Layout (≥768px)
- **Split View**: Two-panel layout with resizable splitter
  - Left panel: TreeTable with hierarchical data
  - Right panel: Interactive map showing selected unit geometry
- **TreeTable Features**:
  - Lazy loading of children nodes (districts load when province is expanded, wards load when district is expanded)
  - Row selection
  - Context menu for actions
  - Expand/collapse nodes
  - Visual indicators for node type (Province/District/Ward)

#### Mobile Layout (<768px)
- **Card-based List**: Touch-friendly card layout
- **Expandable Search**: Collapsible search panel
- **Responsive Actions**: Touch-optimized buttons (≥44px)

### 2. CRUD Operations

#### Create
- Create Province (root level)
- Create District (as child of Province)
- Create Ward (as child of District)
- Parent pre-filled when creating child

#### Read
- View mode with read-only form
- Display on map if geometry exists

#### Update
- Edit mode with form validation
- Cascading dropdowns for parent selection

#### Delete
- Confirmation dialog
- Cascade considerations (backend handles)

### 3. Context Menu Actions
- **View**: Open detail view in drawer
- **Edit**: Open edit form in drawer
- **Create Child**: Create a child unit (district under province, ward under district)
- **Delete**: Delete with confirmation

### 4. Data Types

```typescript
enum AdminUnitType {
  PROVINCE = 'province',
  DISTRICT = 'district',
  WARD = 'ward',
}

interface AdministrativeUnit {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: AdminUnitType;
  parentCode?: string;
  provinceCode?: string;
  districtCode?: string;
  region?: string;
  geometry?: GeoJSON.Geometry;
  population?: number;
  note?: string;
  // ... additional fields
}
```

### 5. Service Layer

The service integrates with three backend endpoints:
- `/v1/provinces` - Province CRUD operations
- `/v1/districts` - District CRUD operations  
- `/v1/wards` - Ward CRUD operations

Key methods:
- `getTreeData()` - Get provinces as root nodes
- `loadChildren()` - Lazy load children for a node
- `getUnit()` - Get single unit by code and type
- `createUnit()` / `updateUnit()` / `deleteUnit()` - CRUD operations

### 6. Routing Pattern

Routes follow a structured pattern with state persistence:
- Base path: `/administrative-unit`
- List route: `/:filter/:page/:limit`
- Detail routes: `/:type/:code/view` or `/:type/:code/edit`
- Create child route: `/new/:parentType/:parentCode`

Example routes:
- `/administrative-unit/all/1/100` - List all provinces (page 1, limit 100)
- `/administrative-unit/hanoi/1/100` - Search for "hanoi"
- `/administrative-unit/province/P01/view` - View province P01
- `/administrative-unit/new/province/P01` - Create district under province P01

## Internationalization (i18n)

All user-facing text is translatable through Transloco with keys in:
- `public/i18n/en.json` - English translations
- `public/i18n/es.json` - Spanish translations
- `public/i18n/vi.json` - Vietnamese translations

Translation key namespace: `administrativeUnit.*`

## Accessibility

- All interactive elements have unique `id` attributes following kebab-case naming convention
- Keyboard navigation support for tree navigation
- ARIA labels and attributes for screen reader support
- Focus management in drawer
- Color contrast meets WCAG AA standards
- Touch targets ≥44px on mobile

## Backend Integration

The module integrates with the `common-service` backend API:
- Base URL: `${API_URI_COMMON}/v1`
- Uses API envelope format with `unwrap()` utility
- Supports lazy loading for performance with large datasets
- Cascading queries: provinces → districts → wards

## Map Integration

- Uses the shared `MapComponent` from `src/core/components/map`
- Displays geometry of selected node
- Auto-zooms to fit bounds
- Supports both full geometry and simplified geometry
- OpenStreetMap base layer with satellite view option

## Performance Optimizations

1. **Lazy Loading**: Children nodes are only loaded when parent is expanded
2. **Pagination**: Root level (provinces) supports pagination
3. **Signal-based State**: Uses Angular signals for reactive updates
4. **OnPush Change Detection**: Minimizes change detection cycles
5. **Simplified Geometry**: Uses `geometrySimplified` field when available for better map performance

## Future Enhancements

1. **Export Functionality**: Implement CSV and GeoJSON export
2. **Bulk Operations**: Multi-select and bulk delete
3. **Drag & Drop**: Reorder or move units between parents
4. **Advanced Filters**: Filter by region, population, etc.
5. **Geometry Editor**: Draw/edit boundaries directly on map
6. **Import**: Upload CSV/GeoJSON files to import units
7. **Audit Trail**: Show change history for each unit

## Technical Stack

- **Framework**: Angular 21
- **UI Library**: PrimeNG 21 (TreeTable, Drawer, Toolbar, etc.)
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet 1.9.4 (via shared MapComponent)
- **i18n**: Transloco
- **State**: Angular Signals
- **Forms**: Reactive Forms

## Testing Considerations

### Unit Tests
- AdministrativeUnitService: API integration and tree transformation
- AdministrativeUnitList component: Tree interactions, lazy loading
- AdministrativeUnitForm component: Form validation, cascading dropdowns

### Integration Tests
1. Load provinces as root nodes
2. Expand province to load districts
3. Expand district to load wards
4. Create new district under province
5. Create new ward under district
6. Edit existing unit
7. Delete unit with confirmation
8. Search and filter operations
9. Map interaction with selected node

### Backend Integration Testing
To test with the backend:
1. Clone and run `open-erp-backend` repository
2. Ensure common-service is running on port 3006
3. Test full CRUD workflows
4. Verify lazy loading behavior
5. Test cascading relationships

## Usage Example

1. Navigate to `/private/modules/management/administrative-unit`
2. The list loads with provinces as root nodes
3. Click expand icon (▶) on a province to load its districts
4. Click expand icon on a district to load its wards
5. Click a row to select it and view on map
6. Right-click or use action button for context menu
7. Click "Create Child" to add a district or ward
8. Fill form with required details and save
9. New child appears under parent in tree

## IDs for Testing/Accessibility

### Desktop
- `administrative-unit-toolbar`
- `administrative-unit-search`
- `administrative-unit-add-button`
- `administrative-unit-refresh-button`
- `administrative-unit-treetable`
- `administrative-unit-row-{code}`
- `administrative-unit-map`

### Mobile
- `administrative-unit-toolbar-mobile`
- `administrative-unit-search-mobile`
- `administrative-unit-mobile-list`
- `administrative-unit-mobile-item-actions-{code}`

### Form
- `administrative-unit-form-drawer`
- `administrative-unit-form-code`
- `administrative-unit-form-name`
- `administrative-unit-form-province`
- `administrative-unit-form-district`
- `administrative-unit-form-submit-button`
