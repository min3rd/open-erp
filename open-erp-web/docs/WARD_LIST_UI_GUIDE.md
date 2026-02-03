# Ward List Grouping and Sorting - Visual Summary

## Desktop View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏠 Open ERP - Ward Management                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Toolbar:                                                                │
│ [Province ▾] [District ▾] [Sort: Name A→Z ▾] [🔍 Search...] [+] [⋮]   │
├─────────────────────────────────────────────────────────────────────────┤
│ Ward List (Left)                │ Map (Right)                          │
│                                 │                                      │
│ ▼ Hà Nội (2 wards)             │  ┌─────────────────────────────┐   │
│   ├─ 00001 | Phúc Xá           │  │                              │   │
│   └─ 00004 | Trúc Bạch         │  │      [MAP VISUALIZATION]     │   │
│                                 │  │                              │   │
│ ▼ Hồ Chí Minh (1 ward)         │  │     Selected Ward Geometry   │   │
│   └─ 26734 | Tân Định          │  │                              │   │
│                                 │  └─────────────────────────────┘   │
│                                 │                                      │
│ [Page 1 of 5] [Items per page: 100 ▾]                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile View

```
┌─────────────────────────────────┐
│ 🔍 ⟳ + ⋮                        │
├─────────────────────────────────┤
│ [Province ▾]                    │
│ [District ▾]                    │
│ [Sort: Name A→Z ▾]              │
│ [🔍 Search...] [✕]              │
├─────────────────────────────────┤
│                                 │
│ ▼ Hà Nội (2 wards)              │
│ ├─────────────────────────────┤ │
│ │ Phúc Xá          00001  ⋮  │ │
│ │ Ward name in English       │ │
│ │ District: 001              │ │
│ ├─────────────────────────────┤ │
│ │ Trúc Bạch        00004  ⋮  │ │
│ │ Ward name in English       │ │
│ │ District: 001              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ▼ Hồ Chí Minh (1 ward)          │
│ ├─────────────────────────────┤ │
│ │ Tân Định        26734  ⋮   │ │
│ │ Ward name in English       │ │
│ │ District: 760              │ │
│ └─────────────────────────────┘ │
│                                 │
│ [« Page 1 of 5 »]               │
└─────────────────────────────────┘
```

## Key UI Elements

### 1. Province Grouping
- **Group Header**: Clickable bar with chevron icon
  - ▶ Collapsed state
  - ▼ Expanded state
- **Province Name**: Displayed prominently (e.g., "Hà Nội")
- **Ward Count**: Shows number of wards in parentheses
- **Default State**: All groups expanded on load

### 2. Sorting Control
- **Location**: Toolbar (between filters and search)
- **Type**: Dropdown select
- **Options**:
  - Name (A → Z) - ascending
  - Name (Z → A) - descending
- **Default**: Name (A → Z)
- **Persistence**: Saved in URL query parameter

### 3. Interaction Flow

**Group Toggle:**
```
Click "▼ Hà Nội (2 wards)" → Collapses → "▶ Hà Nội (2 wards)"
Click again → Expands → "▼ Hà Nội (2 wards)"
```

**Sort Change:**
```
Select "Name (Z → A)" 
→ URL updates to ?sort=name:desc
→ Wards re-ordered within each group
→ Groups remain in same order
```

**Navigation:**
```
Filter by Province: 01 (Hà Nội)
+ Sort: Name (Z → A)
→ URL: /wards/01/all-districts/all/1/100?sort=name:desc
→ Shows only Hà Nội group with wards sorted Z→A
```

## Technical Highlights

### Data Flow
```
Route Activated
    ↓
Resolvers Load Data
│  ├─ wardListResolver (with sort param)
│  ├─ provinceListResolver (all provinces)
│  └─ districtListResolver (all districts)
    ↓
Component Receives via route.data
    ↓
Computed Signal: wardsByProvince
│  ├─ Groups wards by provinceCode
│  ├─ Looks up province names
│  └─ Returns array of groups
    ↓
Template Renders
│  ├─ Desktop: Grouped table
│  └─ Mobile: Grouped cards
```

### State Management
```typescript
// Signals
sortOrder = signal<'name:asc' | 'name:desc'>('name:asc');
expandedGroups = signal<Set<string>>(new Set());
provinces = signal<Province[]>([]);
wards = signal<Ward[]>([]);

// Computed
wardsByProvince = computed(() => {
  // Groups wards by province with name lookup
});

sortOptions = computed(() => [
  { label: 'Name (A → Z)', value: 'name:asc' },
  { label: 'Name (Z → A)', value: 'name:desc' }
]);
```

## Accessibility Features

✅ **Unique IDs**: Every interactive element
   - `ward-list-group-toggle-01`
   - `ward-list-sort-select`
   - `ward-list-row-12345`

✅ **ARIA Attributes**:
   - `aria-expanded="true"` on group toggles
   - `aria-label="Toggle group Hà Nội"`

✅ **Keyboard Navigation**:
   - Tab through all controls
   - Enter/Space to toggle groups
   - Arrow keys in dropdowns

✅ **Screen Reader Support**:
   - Descriptive labels
   - Status announcements
   - Proper heading hierarchy
