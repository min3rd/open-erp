# Warehouse Management Module - Documentation

## Overview
This document describes the implementation of the Warehouse Management module for Open ERP Web, featuring a split-view interface with a list (40%) and interactive map (60%) for managing warehouse locations.

## Access URL
```
/private/modules/management/warehouse
```

Default route redirects to:
```
/private/modules/management/warehouse/all/-/1/100
```

### Route Pattern
```
/private/modules/management/warehouse/:scope/:search/:page/:limit
```

**Parameters:**
- `scope`: Filter scope - `all`, `org`, `nearby`, or `org:<orgId>`
- `search`: Search query or `-` for no search
- `page`: Current page number (1-based)
- `limit`: Items per page (100, 500, 1000, 10000)

## Desktop Layout (≥768px)

### Structure
```
┌──────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                         │
│  [Scope ▼] [Search Input] [Count] [+] [🔄] [⋮]                 │
├──────────────────────┬───────────────────────────────────────────┤
│                      │                                           │
│   WAREHOUSE LIST     │         MAP                               │
│   (40%)              │      (OpenStreetMap + Satellite)          │
│                      │                                           │
│  ┌─────────────────┐ │   Selected warehouse marker               │
│  │☐│Code│Name│Org │ │   displayed with custom icon              │
│  ├─────────────────┤ │                                           │
│  │☐│WH01│Main│Org1│ │   Auto-zoom to warehouse location         │
│  │☐│WH02│Sub │Org2│ │                                           │
│  └─────────────────┘ │   Marker clustering for dense areas       │
│                      │                                           │
│  [Pagination]        │                                           │
└──────────────────────┴───────────────────────────────────────────┘
```

### Components

#### Toolbar
- **Scope Selector** (Dropdown): Filter warehouses by scope
  - All Warehouses
  - My Organization
  - Nearby
- **Search Input**: Filter by name, code, or address
- **Result Count**: Shows total number of warehouses
- **Add Button** (+): Opens drawer to create new warehouse
- **Refresh Button** (🔄): Reload current page
- **Actions Menu** (⋮):
  - Export to CSV
  - Export to GeoJSON
  - Import Warehouses
  - Delete Selected (disabled if no selection)

#### Warehouse List (Left Pane - 40%)
- **Table Columns**:
  - Checkbox (for multi-select)
  - Code (e.g., WH001, WH002)
  - Name (e.g., Main Warehouse, Distribution Center)
  - Organization (organization name)
  - Address (warehouse address)
  - Actions (context menu button)

- **Interactions**:
  - Click row: Select warehouse and show on map
  - Right-click row: Show context menu (View/Edit/Delete)
  - Click action button: Show menu for that row
  - Check checkboxes: Enable bulk delete action

- **Pagination**: Custom pagination component at bottom
  - Options: 100, 500, 1000, 10000 items per page
  - Shows current page and total pages

#### Map (Right Pane - 60%)
- **Base Layers**:
  - OpenStreetMap tiles (default)
  - Satellite imagery
- **Features**:
  - Shows warehouse markers with custom icons
  - Marker popup shows: code, name, organization, address
  - Click marker: Opens popup and highlights row in table
  - Marker clustering for dense point areas
  - Auto-zooms to fit selected warehouse or all warehouses
  - Default center: Vietnam (15.9749°N, 108.2515°E)
  - Zoom controls included
  - Layer switcher (OpenStreetMap / Satellite)

## Mobile Layout (<768px)

### Structure
```
┌─────────────────────────────┐
│  TOOLBAR (compact)          │
│  [🔍] [🔄] [+] [⋮]         │
├─────────────────────────────┤
│  Search Panel (expandable)  │
├─────────────────────────────┤
│                             │
│   WAREHOUSE CARDS           │
│                             │
│  ┌─────────────────────────┐│
│  │ Main Warehouse          ││
│  │ WH001                   ││
│  │ 📍 123 Main St          ││
│  │ 🏢 Organization A       ││
│  │                     [⋮] ││
│  └─────────────────────────┘│
│                             │
│  [Pagination]               │
└─────────────────────────────┘
```

### Components

#### Mobile Toolbar
- **Search Button** (🔍): Toggles search input panel
- **Refresh Button** (🔄): Reload list
- **Add Button** (+): Create new warehouse
- **Actions Menu** (⋮): Same as desktop

#### Warehouse Cards
- Shows warehouse information in card format:
  - Name (bold)
  - Code
  - Organization icon + name
  - Address icon + address
  - Action menu button
- Click card: Selects warehouse
- Click action menu: Show context menu

## Form / Drawer

### Create Mode
Route: `/private/modules/management/warehouse/all/-/1/100/new`

### Edit Mode
Route: `/private/modules/management/warehouse/all/-/1/100/:id/edit`

### View Mode
Route: `/private/modules/management/warehouse/all/-/1/100/:id/view`

### Form Fields
1. **Warehouse Code** (required)
   - Input text
   - Unique identifier
   - Example: WH001, DC-HCM

2. **Warehouse Name** (required)
   - Input text
   - Display name
   - Example: Main Distribution Center

3. **Address**
   - Textarea (3 rows)
   - Physical location
   - Example: 123 Main Street, District 1, Ho Chi Minh City

4. **Type**
   - Input text
   - Warehouse classification
   - Example: Distribution Center, Storage, Hub

5. **Status**
   - Input text
   - Current operational status
   - Example: Active, Inactive, Under Construction

### Form Actions
- **Save Button**: Create/Update warehouse (hidden in view mode)
- **Cancel Button**: Close drawer without saving (hidden in view mode)
- **Close Button**: Close drawer (shown in view mode only)

## API Integration

### Base URL
```
http://localhost:3007/v1/warehouses
```

### Endpoints

#### List Warehouses
```
GET /v1/warehouses?page=1&size=100&q=search&scope=all
```

#### Get Single Warehouse
```
GET /v1/warehouses/:id
```

#### Create Warehouse
```
POST /v1/warehouses
Content-Type: application/json

{
  "code": "WH001",
  "name": "Main Warehouse",
  "address": "123 Main St",
  "organizationId": "org-123",
  "type": "Distribution",
  "status": "Active",
  "geometry": { ... }
}
```

#### Update Warehouse
```
PATCH /v1/warehouses/:id
Content-Type: application/json

{
  "name": "Updated Name",
  ...
}
```

#### Delete Warehouse
```
DELETE /v1/warehouses/:id
```

#### Bulk Delete
```
POST /v1/warehouses/bulk-delete
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"]
}
```

#### Export CSV
```
GET /v1/warehouses/export/csv?q=search&scope=all
```

#### Export GeoJSON
```
GET /v1/warehouses/export/geojson?q=search&scope=all
```

#### Import Warehouses
```
POST /v1/warehouses/import
Content-Type: multipart/form-data

file: <CSV or GeoJSON file>
```

### API Response Format

The service supports both legacy format and new API envelope format:

**New Format (with envelope):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3
  }
}
```

**Legacy Format:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 100,
  "total": 250,
  "totalPages": 3
}
```

## Technical Implementation

### File Structure
```
warehouse/
├── warehouse.ts                    # Root component (router outlet)
├── warehouse.routes.ts             # Route configuration
├── warehouse.types.ts              # TypeScript interfaces
├── services/
│   └── warehouse.service.ts        # API service
├── resolvers/
│   ├── warehouse-list.resolver.ts  # List data resolver
│   └── warehouse-detail.resolver.ts# Detail data resolver
├── list/
│   ├── list.ts                     # List component
│   └── list.html                   # List template
└── form/
    ├── form.ts                     # Form component
    └── form.html                   # Form template
```

### Key Technologies
- **Angular 21**: Standalone components, Signals
- **PrimeNG 21**: UI components (Table, Select, Drawer, etc.)
- **Leaflet**: Interactive maps
- **Tailwind CSS**: Utility-first styling
- **Transloco**: i18n support (English, Vietnamese, Spanish)
- **RxJS**: Reactive programming

### State Management
- Angular Signals for reactive state
- `warehouses` signal: Current list of warehouses
- `selectedWarehouse` signal: Currently selected warehouse
- `selectedWarehousesArray`: Array for multi-select (PrimeNG binding)
- `isLoading` signal: Loading state
- `currentPage`, `pageSize`, `totalRecords`: Pagination state
- `searchQuery`, `currentScope`: Filter state
- `isMobile`: Responsive state

### Accessibility Features
- All interactive elements have unique IDs
- ARIA labels for buttons and inputs
- Keyboard navigation support
- Screen reader friendly
- Focus management for mobile search
- Context menus with proper ARIA attributes
- Confirmation dialogs for destructive actions

### Internationalization (i18n)
Translation keys are defined in:
- `/public/i18n/en.json` - English
- `/public/i18n/vi.json` - Vietnamese
- `/public/i18n/es.json` - Spanish

Key sections:
- `warehouseList.*` - List view translations
- `warehouseForm.*` - Form view translations

## User Workflows

### View Warehouses
1. Navigate to `/private/modules/management/warehouse`
2. List loads with default filters (all, page 1, 100 items)
3. Select scope from dropdown to filter
4. Enter search query to filter by name/code/address
5. Click warehouse row to view on map
6. Map shows marker and auto-zooms to location

### Create Warehouse
1. Click (+) Add button in toolbar
2. Drawer opens from right side
3. Fill in required fields (code, name)
4. Fill optional fields (address, type, status)
5. Click Save to create
6. Success message shown
7. Drawer closes and list refreshes

### Edit Warehouse
1. Click row action menu or right-click row
2. Select "Edit" from context menu
3. Drawer opens with populated fields
4. Modify fields as needed
5. Click Save to update
6. Success message shown
7. Drawer closes and list refreshes

### Delete Warehouse
1. Click row action menu or right-click row
2. Select "Delete" from context menu
3. Confirmation dialog appears
4. Click "Delete" to confirm or "Cancel" to abort
5. If confirmed, warehouse deleted
6. Success message shown
7. List refreshes

### Bulk Delete
1. Check checkboxes for warehouses to delete
2. Open Actions menu in toolbar
3. Select "Delete Selected"
4. Confirmation dialog shows count
5. Click "Delete" to confirm or "Cancel" to abort
6. If confirmed, all selected warehouses deleted
7. Success message shown with count
8. List refreshes

### Export Data
1. Open Actions menu in toolbar
2. Select "Export to CSV" or "Export to GeoJSON"
3. Browser downloads file with timestamp
4. File includes current filter results
5. Success message shown

### Search and Filter
1. Select scope from dropdown (all/org/nearby)
2. Enter search term in search input
3. URL updates: `/:scope/:search/:page/:limit`
4. List automatically refreshes
5. Map updates to show filtered results
6. Result count updates in toolbar

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Considerations
- Server-side pagination (100/500/1000/10000 items per page)
- Lazy loading of routes
- Marker clustering for map performance
- Debounced search input (handled by route navigation)
- Efficient change detection (OnPush strategy)
- Signal-based reactivity

## Future Enhancements
- [ ] Import functionality (file preview and validation)
- [ ] Advanced filtering (by organization, type, status)
- [ ] Map marker customization by type/status
- [ ] Heatmap view for warehouse density
- [ ] Warehouse capacity and inventory integration
- [ ] Routing and distance calculations between warehouses
- [ ] Geo-fencing and service areas
- [ ] Photo/document attachments
- [ ] Audit log and change history
