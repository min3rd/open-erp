# Navigation Management Module

This module provides a comprehensive interface for managing application navigation items (global and module-specific). It allows administrators to create, view, edit, delete, and organize navigation menu items with support for drag-and-drop reordering and hierarchical structures.

## Features

### Core Functionality

- **Two-Pane Layout**: Split view showing global navigation on the left and module navigation on the right
- **Tree View**: Hierarchical display of navigation items with expand/collapse functionality
- **CRUD Operations**: Full Create, Read, Update, Delete support for navigation items
- **Drag & Drop**: Reorder navigation items and move between parents (desktop only)
- **Responsive Design**: Desktop two-pane layout, mobile single-column with tab switcher

### Navigation Item Properties

Each navigation item supports the following properties:

- **label** (required): Display text for the menu item
- **icon**: PrimeIcons class name (e.g., `pi pi-home`)
- **subtitle**: Optional secondary text
- **routerLink**: Internal Angular route
- **url**: External link (overrides routerLink)
- **scope**: `global` or `module`
- **moduleKey**: Required when scope is `module`
- **order**: Display order (lower numbers first)
- **disabled**: Whether the item is clickable
- **visible**: Whether the item is shown
- **separator**: Display as a separator line
- **permissions**: Include/exclude permissions for visibility control
- **badge**: Badge text or number
- **tooltip**: Tooltip text
- **shortcut**: Keyboard shortcut
- **class**: Custom CSS classes
- **command**: JavaScript function to execute
- **meta**: Additional metadata (JSON)

## Backend API Integration

This module integrates with the navigation controller endpoints from the `open-erp-backend` config service:

### Base URL

```
{API_URI_CONFIG}/v1/navigations
```

### Endpoints

#### Get Global Navigation

```
GET /navigations/global?includeHidden=true
```

Returns all global navigation items.

#### Get Module Navigation

```
GET /navigations/module/:moduleKey?includeHidden=true
```

Returns navigation items for a specific module.

#### Get Single Navigation Item

```
GET /navigations/:id
```

Returns details for a specific navigation item by ID.

#### Create Navigation Item

```
POST /navigations
Body: CreateNavigationItemDto
```

Creates a new navigation item.

#### Update Navigation Item

```
PATCH /navigations/:id
Body: UpdateNavigationItemDto
```

Updates an existing navigation item.

#### Delete Navigation Item

```
DELETE /navigations/:id
```

Deletes a navigation item and all its children.

#### Reorder Navigation Items

```
POST /navigations/reorder
Body: { items: ReorderNavigationItemDto[] }
```

Reorders multiple navigation items.

#### Move Navigation Item

```
POST /navigations/move
Body: MoveNavigationItemDto
```

Moves a navigation item to a new parent or scope.

#### Preview Navigation with Permissions

```
POST /navigations/preview/global
POST /navigations/preview/module/:moduleKey
Body: { permissions: string[] }
```

Previews navigation filtered by specific permissions.

## Architecture

### Components

#### Navigation Component (`navigation.ts`)

Main component that orchestrates the navigation management interface.

- Manages state for global and module navigation
- Handles tree node selection and editing
- Provides mobile/desktop responsive layouts

#### Navigation Editor Component (`navigation-editor.component.ts`)

Form component for creating and editing navigation items.

- Reactive form with validation
- Support for all navigation item properties
- Permission management (include/exclude lists)

### Services

#### NavigationManagementService (`navigation-management.service.ts`)

Handles all API communication and caching.

- Fetches global and module navigation
- Performs CRUD operations
- Manages client-side cache with BehaviorSubjects
- Handles reordering and moving operations

### DTOs

All data transfer objects are defined in `dto/navigation-item.dto.ts`:

- `NavigationItemDto`: Full navigation item structure
- `CreateNavigationItemDto`: Data for creating items
- `UpdateNavigationItemDto`: Data for updating items
- `ReorderNavigationItemDto`: Data for reordering operations
- `MoveNavigationItemDto`: Data for moving operations
- `PermissionSet`: Permission testing data

## Usage

### Accessing the Module

Navigate to `/management/navigation` in the application.

### Creating a Navigation Item

1. Click the **+** button in the toolbar
2. Fill in the required fields (label, scope)
3. If scope is "module", select the module key
4. Optionally configure icon, router link, permissions, etc.
5. Click **Save**

### Editing a Navigation Item

1. Select an item in the tree view
2. Click the **Edit** button (pencil icon) in the toolbar
3. Modify the desired fields
4. Click **Save**

### Deleting a Navigation Item

1. Select an item in the tree view
2. Click the **Delete** button (trash icon) in the toolbar
3. Confirm the deletion
4. Note: All child items will also be deleted

### Organizing Navigation

- **Desktop**: Drag and drop items to reorder or move between parents
- **Mobile**: Use the editor to change parent or order values

### Switching Between Global and Module

- **Desktop**: Both panes are visible; select a module item in global navigation to load its module navigation
- **Mobile**: Use the tab selector to switch between global and module views

## Internationalization

All user-facing text is managed through Transloco. Translation keys are defined in:

- `public/i18n/en.json` (English)
- `public/i18n/es.json` (Spanish)

Translation namespace: `navigationManagement.*`

## Accessibility

The module follows WCAG AA standards:

- All interactive elements have unique IDs (kebab-case naming)
- Proper ARIA attributes for tree navigation
- Keyboard navigation support
- Screen reader announcements via aria-live regions
- Focus management for dialogs and forms

### Key IDs

- `navigation-management-container`: Main container
- `navigation-management-toolbar`: Toolbar
- `navigation-management-add-button`: Add button
- `navigation-management-edit-button`: Edit button
- `navigation-management-delete-button`: Delete button
- `navigation-management-global-pane`: Global navigation pane
- `navigation-management-module-pane`: Module navigation pane
- `navigation-management-global-tree`: Global tree component
- `navigation-management-module-tree`: Module tree component
- `navigation-management-status`: Screen reader status region

## Testing

### Unit Tests

- `navigation.spec.ts`: Tests for main navigation component
- `navigation-management.service.spec.ts`: Tests for service

Run tests:

```bash
npm test
```

### Test Coverage

The test suite covers:

- Component initialization
- API integration (mocked HTTP requests)
- Navigation item CRUD operations
- Tree node selection and conversion
- Mobile/desktop layout switching
- Cache management
- Error handling
- Accessibility features

## Styling

The module uses:

- **Tailwind CSS**: Utility classes for layout and styling
- **PrimeNG**: Component library for tree, form controls, dialogs
- **PrimeIcons**: Icon library for navigation icons

No inline styles are used; all styling is done via Tailwind utility classes.

## Future Enhancements

Planned features not yet implemented:

- [ ] Drag-and-drop with keyboard support (current implementation is mouse-only)
- [ ] Navigation preview component showing live render
- [ ] Permission testing dialog for simulating user roles
- [ ] Audit information display (createdBy, updatedBy, timestamps)
- [ ] Undo/redo functionality
- [ ] Bulk operations (move multiple items, delete multiple)
- [ ] Import/export navigation configuration (JSON/YAML)
- [ ] Navigation templates/presets

## Developer Notes

### Adding New Navigation Properties

To add a new property to navigation items:

1. Update `NavigationItemDto` in `dto/navigation-item.dto.ts`
2. Add the field to the editor form in `navigation-editor.component.ts`
3. Add the form control to the template in `navigation-editor.component.html`
4. Update translation keys in `en.json` and `es.json`
5. Update unit tests to cover the new property

### Extending the Service

The `NavigationManagementService` uses RxJS BehaviorSubjects for caching. When adding new endpoints:

1. Add the method to the service
2. Handle cache invalidation appropriately
3. Add error handling following the existing pattern
4. Write unit tests for the new functionality

## References

- Backend API Controller: [navigation.controller.ts](https://github.com/min3rd/open-erp-backend/blob/develop/apps/config-service/src/controllers/navigation.controller.ts)
- PrimeNG Tree Component: [https://www.primeng.org/tree](https://www.primeng.org/tree)
- Angular Reactive Forms: [https://angular.io/guide/reactive-forms](https://angular.io/guide/reactive-forms)
- Transloco i18n: [https://ngneat.github.io/transloco/](https://ngneat.github.io/transloco/)

## License

This module is part of the Open ERP web application and follows the project's license.
