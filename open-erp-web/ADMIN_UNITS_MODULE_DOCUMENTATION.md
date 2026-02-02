# Admin Units Module Documentation

## Overview

The Admin Units module provides a unified interface for managing Vietnamese administrative units (provinces and wards) in a single-screen accordion layout. This module simplifies the management of geographical data by displaying provinces as expandable accordion panels, with their associated wards displayed within each panel.

## Features

### Core Functionality
- **Single-screen Interface**: All provinces and their wards are accessible from one screen
- **Accordion Layout**: Provinces displayed as accordion panels; only one province can be expanded at a time
- **Lazy Loading**: Wards are loaded on-demand when a province panel is expanded
- **Search Capabilities**:
  - Global province search (filters province list)
  - Per-province ward search (filters wards within a specific province)
- **CRUD Operations**: Full create, read, update, and delete operations for both provinces and wards
- **Map Integration**: Visual display of selected province geometry on an interactive map
- **Export Functions**: Export provinces or wards to CSV or GeoJSON formats

### Routing and State Management
The module uses URL routing to persist the user's view state:
- **Route**: `/private/modules/management/admin-units`
- **Query Parameters**:
  - `activeProvinceCode`: The currently expanded province
  - `search`: Global province search term
  - `wards[<provinceCode>]`: Ward search term for a specific province
  - `page[<provinceCode>]`: Pagination page for a specific province's wards

This allows users to bookmark or share specific views of the data.

### Responsive Design
- **Desktop Layout**: Split-pane view with accordion on the left and map on the right
- **Mobile Layout**: Card-based accordion view optimized for touch interfaces

## Component Structure

### Main Components
- **AdminUnits** (`admin-units.ts`): Root component with router outlet
- **AdminUnitsList** (`list/list.ts`): Main list component with accordion layout
- **Resolver** (`resolvers/provinces.resolver.ts`): Preloads provinces list before route activation

### Reused Components
The module reuses existing form components for CRUD operations:
- **ProvinceForm**: For creating/editing/viewing provinces
- **WardForm**: For creating/editing/viewing wards

## User Interface

### Desktop Layout

#### Toolbar (Top)
- **Title**: "Province and Ward Management"
- **Global Search**: Search box to filter provinces by name or code
- **Add Province**: Button to create a new province
- **Actions Menu**: Dropdown with options for:
  - Export Provinces to CSV
  - Export Provinces to GeoJSON
  - Refresh All
- **Refresh Button**: Reload all data

#### Content Area
**Left Panel - Provinces Accordion**:
Each province panel shows:
- Province name and code
- Region
- Total ward count (badge)
- Edit and Delete buttons

When expanded, each panel displays:
- **Ward Toolbar**:
  - Search box for filtering wards
  - Add Ward button
  - Export Wards to CSV
  - Export Wards to GeoJSON
- **Ward Table**:
  - Columns: Code, Name, English Name, District Code, Actions
  - Pagination (100 items per page by default)
  - Edit and Delete actions per ward

**Right Panel - Map**:
- Displays geometry of the selected province
- Interactive Leaflet map with OpenStreetMap base layer
- Zooms to fit province boundaries

### Mobile Layout
- Compact toolbar with essential actions
- Full-width accordion panels
- Card-based ward display
- Touch-optimized controls

## Usage

### Accessing the Module
Navigate to: `/private/modules/management/admin-units`

### Managing Provinces

#### View Provinces
- All provinces are listed as accordion panels
- Click on a panel header to expand and view its wards

#### Add Province
1. Click "Add Province" button in the toolbar
2. Fill in the province form (code, name, region, geometry)
3. Click "Create" to save

#### Edit Province
1. Expand the province panel (if not already expanded)
2. Click the pencil (edit) icon in the province header
3. Modify the form fields
4. Click "Update" to save changes

#### Delete Province
1. Click the trash icon in the province header
2. Confirm the deletion in the dialog
3. Note: This will also delete all associated wards

### Managing Wards

#### View Wards
1. Click on a province panel to expand it
2. Wards are automatically loaded and displayed in a table

#### Search Wards
1. Expand the province panel
2. Use the search box in the ward toolbar
3. Wards are filtered in real-time

#### Add Ward
1. Expand the province panel
2. Click "Add Ward" button
3. Fill in the ward form (code, name, district code, etc.)
4. Click "Create" to save

#### Edit Ward
1. Find the ward in the table
2. Click the pencil (edit) icon
3. Modify the form fields
4. Click "Update" to save changes

#### Delete Ward
1. Find the ward in the table
2. Click the trash (delete) icon
3. Confirm the deletion in the dialog

### Exporting Data

#### Export Provinces
1. Click the Actions menu (three dots icon)
2. Select "Export Provinces to CSV" or "Export Provinces to GeoJSON"
3. The file will be downloaded automatically

#### Export Wards
1. Expand the province panel
2. Click "Export CSV" or "Export GeoJSON" in the ward toolbar
3. Only wards from that province will be exported

### Search and Filter

#### Global Province Search
1. Enter search term in the top toolbar search box
2. Press Enter or click the Search button
3. Province list is filtered by name or code
4. Clear the search to show all provinces

#### Per-Province Ward Search
1. Expand a province panel
2. Enter search term in the ward search box
3. Only wards within that province are filtered
4. Search term is persisted in the URL

## API Integration

The module integrates with the following backend endpoints:

### Provinces
- `GET /v1/provinces` - List provinces with pagination and search
- `GET /v1/provinces/:id` - Get single province
- `POST /v1/provinces` - Create province
- `PATCH /v1/provinces/:id` - Update province
- `DELETE /v1/provinces/:id` - Delete province
- `POST /v1/provinces/export/csv` - Export to CSV
- `POST /v1/provinces/export/geojson` - Export to GeoJSON

### Wards
- `GET /v1/wards` - List wards with filters (provinceCode, districtCode, search)
- `GET /v1/wards/:code` - Get single ward
- `POST /v1/wards` - Create ward
- `PATCH /v1/wards/:code` - Update ward
- `DELETE /v1/wards/:code` - Delete ward
- `POST /v1/wards/export/csv` - Export to CSV
- `POST /v1/wards/export/geojson` - Export to GeoJSON

## Internationalization (i18n)

The module supports three languages:
- **English** (en)
- **Vietnamese** (vi)
- **Spanish** (es)

All UI text is translated using Transloco. Translation keys are prefixed with `adminUnits.*`

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab navigation follows logical flow
- Enter key expands/collapses accordion panels

### Screen Reader Support
- Unique DOM IDs for all interactive elements
- ARIA attributes provided by PrimeNG components
- Descriptive labels for all form fields and buttons

### DOM ID Convention
All elements follow the naming pattern:
- `admin-units-<element-type>-<identifier>`

Examples:
- `admin-units-toolbar`
- `admin-units-global-search`
- `admin-units-province-01` (for province with code "01")
- `admin-units-ward-row-00001` (for ward with code "00001")

## Performance Considerations

### Lazy Loading
- Wards are loaded only when a province panel is expanded
- This reduces initial page load time and memory usage

### Pagination
- Ward tables use pagination (default: 100 items per page)
- Large datasets are handled efficiently

### Signal-based State
- Uses Angular signals for reactive state management
- Computed values are automatically updated when dependencies change

## Technical Details

### Component Architecture
- **Standalone Components**: Uses Angular 21+ standalone component architecture
- **Change Detection**: OnPush strategy for optimal performance
- **Reactive State**: Signal-based state management throughout

### Dependencies
- **PrimeNG**: UI component library (Accordion, Table, Toolbar, etc.)
- **Leaflet**: Map visualization
- **Transloco**: Internationalization
- **Tailwind CSS**: Styling

### Testing
Unit tests are provided for:
- Component initialization
- Province filtering
- Ward loading
- Route navigation
- CRUD operations

## Future Enhancements

Potential improvements for future versions:
- Click on map to expand province accordion
- Display ward polygons/markers on the map
- Bulk operations (select multiple wards/provinces)
- Advanced filtering options
- Import functionality (CSV, GeoJSON)
- Audit log for changes

## Troubleshooting

### Province panel won't expand
- Check browser console for errors
- Ensure backend API is accessible
- Verify network connectivity

### Wards not loading
- Check that the province has associated wards in the database
- Verify the `GET /v1/wards` endpoint is working
- Check browser network tab for failed requests

### Map not displaying
- Ensure province has valid geometry data
- Check that Leaflet library is loaded
- Verify map container has proper height

### Search not working
- Clear browser cache
- Check that search query parameter is being set in URL
- Verify backend API supports search filtering

## Support

For issues or questions:
1. Check the implementation code in `src/app/private/modules/management/admin-units/`
2. Review API documentation in `API_DOCUMENTATION.md`
3. Contact the development team
