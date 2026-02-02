# Province-Ward Accordion Screen - Visual Guide

## Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Province and Ward Management                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  [Search provinces...] [Search] [X]  [+ Add Province] [⋮ Actions] [↻]  │
├───────────────────────────────┬─────────────────────────────────────────┤
│ PROVINCES (Accordion)         │ MAP                                     │
├───────────────────────────────┤                                         │
│ ▼ Hà Nội (Code: 01)          │                                         │
│   Region: Northern            │   ┌─────────────────────────────────┐  │
│   [150 wards] [✏️] [🗑️]        │   │                                 │  │
│   ┌───────────────────────────┤   │      Province Geometry          │  │
│   │ [Search wards...] [🔍]    │   │      (Interactive Map)          │  │
│   │ [+ Add Ward] [CSV] [JSON] │   │                                 │  │
│   ├───────────────────────────┤   │         🗺️                      │  │
│   │ Code │ Name    │ District │   │                                 │  │
│   ├──────┼─────────┼──────────┤   │                                 │  │
│   │00001 │ Phúc Xá │ Ba Đình │   │                                 │  │
│   │00004 │ Trúc... │ Ba Đình │   └─────────────────────────────────┘  │
│   │...   │ ...     │ ...     │                                         │
│   └───────────────────────────┘                                         │
│                                                                          │
│ ▶ Hồ Chí Minh (Code: 79)                                               │
│   Region: Southern                                                      │
│   [250 wards] [✏️] [🗑️]                                                  │
│                                                                          │
│ ▶ Đà Nẵng (Code: 48)                                                   │
│   Region: Central                                                       │
│   [80 wards] [✏️] [🗑️]                                                   │
│                                                                          │
└──────────────────────────────┴──────────────────────────────────────────┘
```

## Mobile Layout

```
┌─────────────────────────────────┐
│ Province and Ward Management    │
│ [+] [↻]                         │
├─────────────────────────────────┤
│ [Search provinces...] [🔍] [X]  │
├─────────────────────────────────┤
│ ▼ Hà Nội                        │
│   01 | Northern                │
│   ┌─────────────────────────┐  │
│   │ Loading wards... 🔄     │  │
│   │                         │  │
│   │ ┌─────────────────────┐ │  │
│   │ │ Phúc Xá             │ │  │
│   │ │ 00001 | Ba Đình     │ │  │
│   │ │ [✏️] [🗑️]             │ │  │
│   │ └─────────────────────┘ │  │
│   │                         │  │
│   │ ┌─────────────────────┐ │  │
│   │ │ Trúc Bạch           │ │  │
│   │ │ 00004 | Ba Đình     │ │  │
│   │ │ [✏️] [🗑️]             │ │  │
│   │ └─────────────────────┘ │  │
│   └─────────────────────────┘  │
│                                 │
│ ▶ Hồ Chí Minh                  │
│   79 | Southern                │
│                                 │
│ ▶ Đà Nẵng                      │
│   48 | Central                 │
└─────────────────────────────────┘
```

## User Interaction Flow

### 1. Initial View
```
User lands on /private/modules/management/admin-units
↓
Resolver preloads all provinces
↓
Accordion shows all provinces (collapsed)
↓
Map shows placeholder (no province selected)
```

### 2. Expanding a Province
```
User clicks "Hà Nội" panel header
↓
Panel expands, others collapse
↓
URL updates: ?activeProvinceCode=01
↓
Ward service fetches wards for province 01
↓
Ward table displays with pagination
↓
Map updates to show Hà Nội geometry
```

### 3. Searching Wards
```
User types "Phúc" in ward search box
↓
URL updates: ?activeProvinceCode=01&wards[01]=Phúc
↓
Ward service re-fetches with search filter
↓
Table updates to show filtered results
```

### 4. Global Province Search
```
User types "Hồ Chí Minh" in global search
↓
URL updates: ?search=Hồ Chí Minh
↓
Province list filtered client-side
↓
Only matching provinces shown
```

### 5. Creating a Ward
```
User expands Hà Nội panel
↓
Clicks "+ Add Ward"
↓
Route navigates to: .../ward/new?provinceCode=01
↓
WardForm drawer opens (reused component)
↓
User fills form and saves
↓
Ward created, route returns to list
↓
Ward table refreshes automatically
```

## State Persistence Examples

### Bookmark 1: Viewing Hà Nội with ward search
```
URL: /private/modules/management/admin-units
     ?activeProvinceCode=01
     &wards[01]=Phúc

Result when opened:
- Hà Nội panel expanded
- Wards filtered by "Phúc"
- Map shows Hà Nội geometry
```

### Bookmark 2: Searching for southern provinces
```
URL: /private/modules/management/admin-units
     ?search=southern

Result when opened:
- Province list filtered by "southern"
- All panels collapsed
- Map shows placeholder
```

### Bookmark 3: Multiple states combined
```
URL: /private/modules/management/admin-units
     ?activeProvinceCode=79
     &search=hồ
     &wards[79]=quận
     &page[79]=2

Result when opened:
- Province list filtered by "hồ"
- Hồ Chí Minh panel expanded
- Wards filtered by "quận"
- Ward table on page 2
- Map shows Hồ Chí Minh geometry
```

## Component Architecture

```
AdminUnits (root)
  │
  └─ RouterOutlet
       │
       ├─ AdminUnitsList (main component)
       │    │
       │    ├─ Toolbar
       │    │    ├─ Global Search
       │    │    ├─ Add Province Button
       │    │    ├─ Actions Menu
       │    │    └─ Refresh Button
       │    │
       │    ├─ Accordion (PrimeNG)
       │    │    │
       │    │    └─ For each Province:
       │    │         ├─ Panel Header
       │    │         │    ├─ Province Info
       │    │         │    └─ Edit/Delete Buttons
       │    │         │
       │    │         └─ Panel Content
       │    │              ├─ Ward Toolbar
       │    │              │    ├─ Ward Search
       │    │              │    ├─ Add Ward Button
       │    │              │    └─ Export Buttons
       │    │              │
       │    │              └─ Ward Table (PrimeNG)
       │    │                   └─ Ward Rows with Actions
       │    │
       │    └─ Map Component (core-map)
       │         └─ Leaflet Map with Province Geometry
       │
       └─ RouterOutlet (for forms)
            │
            ├─ ProvinceForm (drawer/modal)
            │    └─ Create/Edit/View Province
            │
            └─ WardForm (drawer/modal)
                 └─ Create/Edit/View Ward
```

## Data Flow

```
[Route Activated]
     ↓
[Resolver]
     ↓ preloads
[Province List]
     ↓ stored in
[Component Signal: provinces]
     ↓ computed
[Filtered Provinces] (based on globalSearch signal)
     ↓ rendered as
[Accordion Panels]
     ↓ on expand
[Load Wards] (API call with provinceCode)
     ↓ stored in
[Component Signal: provinceWards Map]
     ↓ rendered as
[Ward Table]

Meanwhile:
[Active Province]
     ↓ computed
[Selected Geometry]
     ↓ passed to
[Map Component]
```

## Signal State Management

```typescript
// State Signals
provinces = signal<Province[]>([])
activeProvinceCode = signal<string | null>(null)
globalSearch = signal<string>('')
provinceWards = signal<Map<string, Ward[]>>(new Map())
provinceWardSearch = signal<Map<string, string>>(new Map())
loading = signal<boolean>(false)

// Computed Signals
filteredProvinces = computed(() => {
  return provinces().filter(p => 
    p.name.includes(globalSearch()) || 
    p.code.includes(globalSearch())
  )
})

activeProvince = computed(() => {
  return provinces().find(p => 
    p.code === activeProvinceCode()
  )
})

selectedGeometry = computed(() => {
  return activeProvince()?.geometry || null
})
```

## Key Technologies Used

- **Angular 21+**: Framework
- **Signals**: Reactive state management
- **PrimeNG 21**: UI components
  - Accordion
  - Table
  - Toolbar
  - Button
  - Menu
  - Toast
  - ConfirmDialog
- **Tailwind CSS 4**: Styling
- **Leaflet**: Map visualization
- **Transloco**: Internationalization
- **RxJS**: Async operations

## Responsive Breakpoints

```
Desktop (≥ 768px):
- Split pane layout
- Full feature set
- Toolbar with all actions

Mobile (< 768px):
- Single column
- Card-based accordion
- Compact toolbar
- Touch-optimized controls
```
