# User Audit Log Screen - Component Structure

## Component Hierarchy

```
User Detail Drawer (Detail Component)
├── Tabs
│   ├── General
│   ├── Roles Assignment
│   ├── Reset Password
│   └── Audit Logs (NEW) ← Our Implementation
│       ├── Toolbar
│       │   ├── Title
│       │   └── Search Input
│       ├── Content Area
│       │   ├── Desktop View (≥768px)
│       │   │   └── PrimeNG Table
│       │   │       ├── Sortable Headers
│       │   │       ├── Data Rows
│       │   │       └── Built-in Paginator
│       │   └── Mobile View (<768px)
│       │       ├── Card List
│       │       └── Custom Paginator
│       └── Detail Drawer (Nested)
│           ├── Header
│           ├── Content
│           │   ├── Basic Information
│           │   ├── Network Information
│           │   ├── Payload Viewer
│           │   └── Metadata Viewer
│           └── Footer
```

## Data Flow

```
Route Activation
    ↓
userActivityLogsResolver (Resolver)
    ↓
Fetch Initial Page (20 items)
    ↓
Component Initialization
    ↓
Display Table/Cards
    ↓
User Interactions:
├── Search → Debounced (300ms) → API Call
├── Sort → Update State → API Call
├── Page Change → Update Page → API Call
└── View Detail → Fetch Log Detail → Open Drawer
```

## State Management

### Component Signals
```typescript
// Data
user: Signal<UserDetail | null>
activityLogs: Signal<UserActivityLog[]>
selectedLog: Signal<UserActivityLog | null>

// UI State
isLoading: Signal<boolean>
isDetailDrawerOpen: Signal<boolean>
isLoadingDetail: Signal<boolean>
isMobile: Signal<boolean>

// Pagination
currentPage: Signal<number>
pageSize: Signal<number>
totalRecords: Signal<number>

// Search & Sort
searchQuery: Signal<string>
sortField: Signal<string>
sortOrder: Signal<'asc' | 'desc'>

// Computed
totalPages: Computed<number>
```

## API Integration

### List Endpoint
```http
GET /admin/users/:userId/audit-logs
Query Parameters:
  - page: number (1-based)
  - limit: number (20, 50, 100)
  - search: string (optional)
  - sortField: string (optional)
  - sortOrder: 'asc' | 'desc' (optional)

Response:
{
  data: UserActivityLog[]
  total: number
  page: number
  limit: number
}
```

### Detail Endpoint
```http
GET /admin/users/audit-logs/:logId

Response: UserActivityLog
```

## Responsive Breakpoints

| Breakpoint | Width | View Mode | Features |
|------------|-------|-----------|----------|
| Mobile | <768px | Card List | Essential info, tap to view |
| Desktop | ≥768px | Table | Full columns, inline actions |

## Translation Keys Structure

```
auditLogs
├── title
├── searchPlaceholder
├── empty
├── table
│   └── label
├── columns
│   ├── action
│   ├── entity
│   ├── timestamp
│   ├── ipAddress
│   ├── status
│   └── actions
├── status
│   ├── success
│   └── failure
├── actions
│   ├── view
│   ├── viewDetail
│   └── close
├── pagination
│   ├── showing
│   ├── to
│   ├── of
│   ├── page
│   ├── previous
│   └── next
└── detail
    ├── title
    ├── loading
    ├── action
    ├── entity
    ├── description
    ├── timestamp
    ├── status
    ├── networkInfo
    ├── ipAddress
    ├── userAgent
    ├── payload
    └── metadata
```

## Component Methods

### Lifecycle
- `constructor()` - Mobile detection setup
- `ngOnInit()` - Initialize data, setup subscriptions
- `ngOnDestroy()` - Cleanup subscriptions

### Data Loading
- `loadActivityLogs()` - Fetch logs from API
- `onLazyLoad(event)` - Handle table lazy load
- `onViewDetail(log)` - Fetch and display log detail

### User Interactions
- `onSearch(event)` - Handle search input
- `onPageChange(page)` - Navigate pages
- `onPageSizeChange(size)` - Change page size
- `onCloseDetail()` - Close detail drawer

### Utilities
- `formatTimestamp(timestamp)` - Format date/time
- `formatDate(timestamp)` - Format date only
- `formatTime(timestamp)` - Format time only
- `stringifyJson(obj)` - Format JSON
- `getStatusSeverity(status)` - Get tag color
- `checkViewport()` - Detect mobile/desktop

## Accessibility Features

### Keyboard Navigation
- Tab order: Search → Table rows → Actions → Pagination
- Enter key: Activate buttons and view details
- Arrow keys: Navigate table cells (native table behavior)

### Screen Reader Support
- ARIA labels on all interactive elements
- ARIA role="button" on clickable cards
- Status announcements for loading states
- Semantic HTML structure

### Visual Indicators
- Focus outlines on interactive elements
- Loading spinners with text
- Color-coded status with sufficient contrast
- Icon + text combinations (not color alone)

## Performance Optimizations

1. **Change Detection**: OnPush strategy
2. **Search Debouncing**: 300ms delay
3. **Lazy Loading**: Server-side pagination
4. **Computed Values**: Memoized calculations
5. **Viewport Detection**: Single event listener
6. **RxJS Memory**: Proper subscription cleanup

## Error Handling

- API errors logged to console
- Fallback to existing log data on detail fetch failure
- Empty states for no data
- Loading states during async operations
- Graceful degradation

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features (supported by Angular 21)
- CSS Grid and Flexbox for layout
- No IE11 support required
