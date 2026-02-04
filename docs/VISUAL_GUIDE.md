# Product List View - Visual Guide

## Desktop View Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Product Management - Toolbar                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [🔍 Search...        ]  [Filter: All ▼]  [Sort: Name (A-Z) ▼]             │
│                                                                             │
│                                           100 products  [➕] [🔄] [⋮]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Table View                                                                  │
├───┬──────────┬─────────────────┬──────────┬────────────┬──────┬──────────┬─┤
│☐ │ SKU      │ Name            │ Type     │ Category   │ Unit │ Status   │⚡│
├───┼──────────┼─────────────────┼──────────┼────────────┼──────┼──────────┼─┤
│☐ │ PROD-001 │ Laptop Dell XPS │ Electron.│ IT         │ piece│ ●Active  │⚙│
│☐ │ PROD-002 │ Mouse Wireless  │ Electron.│ IT         │ piece│ ●Active  │⚙│
│☐ │ PROD-003 │ Office Chair    │ Furniture│ Furniture  │ piece│ ⚫Draft   │⚙│
│☐ │ PROD-004 │ Coffee Beans    │ Food     │ Beverage   │ kg   │ ●Active  │⚙│
│☐ │ PROD-005 │ Green Tea       │ Beverage │ Beverage   │ box  │ ●Active  │⚙│
├───┴──────────┴─────────────────┴──────────┴────────────┴──────┴──────────┴─┤
│ ◀ 1  2  3  4  5 ▶                   Show: [100 ▼] per page                │
└─────────────────────────────────────────────────────────────────────────────┘

Toolbar Actions Menu (⋮):
├─ Export to CSV
├─ Import from CSV
├─ ─────────────
└─ Delete Selected (disabled if none selected)

Row Actions (⚙):
├─ 👁 View
├─ ✏️ Edit
└─ 🗑 Delete

Context Menu (Right-click on row):
├─ 👁 View
├─ ✏️ Edit
├─ ─────────────
└─ 🗑 Delete
```

## Mobile View Layout

```
┌───────────────────────────────┐
│ Product Management            │
├───────────────────────────────┤
│ 🔍  🔽  ⇅  ➕  ⋮            │
├───────────────────────────────┤
│                               │
│ ┌───────────────────────────┐ │
│ │ Laptop Dell XPS           │ │
│ │ Dell XPS 13               │ │
│ │ SKU: PROD-001             │ │
│ │                           │ │
│ │ Type: Electronics         │ │
│ │ Unit: piece               │ │
│ │ Category: IT              │ │
│ │                           │ │
│ │ ●Active                   │ │
│ │                           │ │
│ │ [View] [Edit] [🗑]        │ │
│ └───────────────────────────┘ │
│                               │
│ ┌───────────────────────────┐ │
│ │ Mouse Wireless            │ │
│ │ Logitech MX Master        │ │
│ │ SKU: PROD-002             │ │
│ │                           │ │
│ │ Type: Electronics         │ │
│ │ Unit: piece               │ │
│ │ Category: IT              │ │
│ │                           │ │
│ │ ●Active                   │ │
│ │                           │ │
│ │ [View] [Edit] [🗑]        │ │
│ └───────────────────────────┘ │
│                               │
├───────────────────────────────┤
│ ◀ Page 1 of 10  [100 ▼] ▶   │
└───────────────────────────────┘

Expandable Search (when 🔍 clicked):
┌───────────────────────────────┐
│ [Search products...     ] [✕] │
└───────────────────────────────┘
```

## UI Components Used

### PrimeNG Components
- **p-toolbar**: Desktop and mobile toolbars
- **p-inputgroup**: Search input with icon
- **p-select**: Filter and sort dropdowns
- **p-button**: Action buttons
- **p-menu**: Dropdown menus for actions
- **p-table**: Desktop data table
- **p-contextMenu**: Right-click context menu
- **p-tag**: Status badges
- **p-confirmDialog**: Delete confirmation
- **p-tooltip**: Button tooltips

### Custom Components
- **core-pagination**: Pagination controls

## Color Scheme

### Status Colors
- **Active**: Green (success)
- **Inactive**: Gray (secondary)
- **Draft**: Blue (info)
- **Discontinued**: Red (danger)

### Theme Support
- Light mode (default)
- Dark mode (automatic based on system preference)

## Responsive Breakpoints

- **Desktop**: > 768px - Full table view with all features
- **Tablet**: 768px - 1024px - Compact table view
- **Mobile**: < 768px - Card list view

## Interaction Patterns

### Desktop
1. **Search**: Type in search box → Auto-search with debounce → URL updates → API call → Results update
2. **Filter**: Click dropdown → Select option → URL updates → API call → Results update
3. **Sort**: Click dropdown → Select option → URL updates → API call → Results update
4. **Pagination**: Click page number or size → URL updates → API call → Results update
5. **Select**: Click checkbox → Update selection count → Enable/disable bulk actions
6. **Delete**: Click delete → Show confirmation → API call → Refresh list → Show toast
7. **Context Menu**: Right-click row → Show menu → Select action → Execute

### Mobile
1. **Search**: Click search icon → Expand search panel → Type → Auto-search → Results update
2. **Filter/Sort**: Click icon → Show menu → Select option → API call → Results update
3. **Card Actions**: Tap View/Edit/Delete → Execute action
4. **Pagination**: Swipe or tap page controls → API call → Results update

## URL State Pattern

Format: `/product/:search/:filter/:sort/:page/:limit`

Examples:
- Default: `/product/-/all/[name,asc]/1/100`
- With search: `/product/laptop/all/[name,asc]/1/100`
- Filtered: `/product/-/active/[name,asc]/1/100`
- Sorted: `/product/-/all/[sku,desc]/1/100`
- Page 2: `/product/-/all/[name,asc]/2/100`
- 50 per page: `/product/-/all/[name,asc]/1/50`

## Data Flow

```
User Action
    ↓
Component Method
    ↓
navigateWithParams()
    ↓
Angular Router
    ↓
Route Resolver (productListResolver)
    ↓
ProductService.getProducts()
    ↓
HTTP Client (with params)
    ↓
Backend API (/v1/products)
    ↓
Database Query
    ↓
JSON Response
    ↓
Service Mapping
    ↓
Resolver Returns Data
    ↓
Route Data Observable
    ↓
Component Signals Update
    ↓
Template Re-renders
```

## Performance Optimizations

1. **Server-side Operations**: All search, filter, sort, pagination done on server
2. **Route Resolvers**: Pre-load data before navigation
3. **Signals**: Reactive state management with fine-grained updates
4. **OnPush Change Detection**: Minimize unnecessary change detection cycles
5. **Lazy Loading**: Module loaded on demand
6. **Virtual Scrolling**: Not implemented (use pagination instead for better UX)

## Accessibility Features

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader compatible
- High contrast support
- Semantic HTML structure

## Internationalization

### Translation Keys Used

**English** (`en.json`):
- `productList.*` - List view labels and messages
- `productType.*` - Product type names
- `productStatus.*` - Status labels

**Vietnamese** (`vi.json`):
- `productList.*` - Nhãn và thông báo danh sách
- `productType.*` - Tên loại sản phẩm
- `productStatus.*` - Nhãn trạng thái

### Supported Languages
- 🇺🇸 English (en)
- 🇻🇳 Vietnamese (vi)

## Error Handling

### User-Visible Errors
- Network errors → Toast notification with error message
- Validation errors → Highlighted fields with error text
- Permission errors → Access denied message
- Not found → Empty state with helpful message

### Developer Errors
- Console logging for debugging
- Error boundary catching unhandled errors
- API response validation

## Testing Checklist

### Functional Tests
- [ ] List loads with sample data
- [ ] Search filters results correctly
- [ ] Status filter works for each option
- [ ] Sort changes order correctly
- [ ] Pagination navigates pages
- [ ] Page size changes affect results
- [ ] Single delete removes item
- [ ] Bulk delete removes selected items
- [ ] Import uploads and processes CSV
- [ ] Export downloads CSV file
- [ ] View button navigates (when implemented)
- [ ] Edit button navigates (when implemented)

### Responsive Tests
- [ ] Desktop view displays table
- [ ] Mobile view displays cards
- [ ] Search panel expands/collapses on mobile
- [ ] All features work on mobile
- [ ] Layout adjusts at breakpoints

### Internationalization Tests
- [ ] English translations display correctly
- [ ] Vietnamese translations display correctly
- [ ] Language switching works
- [ ] Date/number formats correct per locale

### Accessibility Tests
- [ ] Tab navigation works
- [ ] Screen reader announces elements
- [ ] ARIA labels present
- [ ] Focus visible
- [ ] Keyboard shortcuts work

## Known Issues & Limitations

1. **Form Not Implemented**: Create/Edit forms are TODO
2. **Export/Import**: Backend endpoints may need implementation
3. **Permissions**: Frontend doesn't hide actions based on permissions yet
4. **Column State**: Column preferences not persisted
5. **Offline Support**: No offline capability
6. **Real-time Updates**: No WebSocket for live updates

## Future Enhancements

1. **Advanced Features**
   - Multi-column filtering
   - Saved filter presets
   - Custom column sets
   - Export to Excel
   - Bulk edit
   - Drag-and-drop import

2. **UX Improvements**
   - Loading skeletons
   - Optimistic updates
   - Undo/redo
   - Keyboard shortcuts guide
   - Tour/onboarding

3. **Data Visualization**
   - Product statistics cards
   - Charts and graphs
   - Quick insights

4. **Integration**
   - Print product list
   - Share via link
   - Email reports
   - API webhook notifications
