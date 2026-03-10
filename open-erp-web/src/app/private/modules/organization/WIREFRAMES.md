# Organization Module - Layout Wireframes

## Desktop Layout - Sidebar Mode (Full Width: 256px)

```
┌────────────────────┬─────────────────────────────────────────────┐
│  Organization  [<] │                                             │
├────────────────────┤         Content Area                        │
│                    │                                             │
│  ┌──────────────┐  │   ┌──────────────────────────────────┐    │
│  │ 📄 Register  │  │   │                                  │    │
│  │ Organization │  │   │  Register Organization Form      │    │
│  └──────────────┘  │   │                                  │    │
│                    │   │  - Organization Name             │    │
│  ┌──────────────┐  │   │  - Tax ID                        │    │
│  │ ℹ️  View      │  │   │  - Address                       │    │
│  │ Information  │  │   │  - Contact Details               │    │
│  └──────────────┘  │   │                                  │    │
│                    │   │  [Submit] [Cancel]               │    │
│                    │   │                                  │    │
│                    │   └──────────────────────────────────┘    │
│                    │                                             │
└────────────────────┴─────────────────────────────────────────────┘
    256px (Sidebar)              Flexible Content Area
```

**Features:**

- Full navigation labels visible
- Toggle button ([<]) collapses to narrow mode
- Active route highlighted with primary color background
- Hover states on navigation items
- Icons + Text for each navigation item

---

## Desktop Layout - Narrow Mode (Width: 56px)

```
┌───┬───────────────────────────────────────────────────────────┐
│[>]│                                                           │
├───┤              Content Area                                 │
│   │                                                           │
│ 📄 │    ┌──────────────────────────────────────┐            │
│   │    │                                      │            │
│ ℹ️  │    │   View Organization Information      │            │
│   │    │                                      │            │
│   │    │   Organization Name: Acme Corp       │            │
│   │    │   Tax ID: 123-456-789                │            │
│   │    │   Address: 123 Main St               │            │
│   │    │   Status: Active                     │            │
│   │    │                                      │            │
│   │    │   [Edit] [Archive]                   │            │
│   │    │                                      │            │
│   │    └──────────────────────────────────────┘            │
│   │                                                           │
└───┴───────────────────────────────────────────────────────────┘
 56px               Flexible Content Area
(Icon Only)
```

**Features:**

- Icon-only navigation (space-efficient)
- Toggle button ([>]) expands to sidebar mode
- Tooltips appear on hover: "Register Organization", "View Information"
- Active route highlighted
- Maintains all functionality in compact form

---

## Mobile Layout - Header Tabs (< 1024px)

```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌────────────────┐               │
│  │ 📄 Register     │  │ ℹ️ Information  │               │
│  └─────────────────┘  └────────────────┘               │
│  ═════════════════                                      │
│   (Active Tab)                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│    ┌────────────────────────────────────────┐          │
│    │                                        │          │
│    │   Register Organization                │          │
│    │                                        │          │
│    │   Organization Name                   │          │
│    │   ┌──────────────────────────────┐    │          │
│    │   └──────────────────────────────┘    │          │
│    │                                        │          │
│    │   Tax ID                               │          │
│    │   ┌──────────────────────────────┐    │          │
│    │   └──────────────────────────────┘    │          │
│    │                                        │          │
│    │   ┌────────┐                           │          │
│    │   │ Submit │                           │          │
│    │   └────────┘                           │          │
│    │                                        │          │
│    └────────────────────────────────────────┘          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Features:**

- Tab bar at top for navigation between Register and Information views
- Active tab indicated with underline in primary color
- Full-width tabs for easy touch interaction (44px min height)
- No sidebar navigation visible on mobile
- Content area fills remaining space
- Responsive form fields stack vertically

---

## Color Scheme (PrimeNG Default)

- **Background**:
  - Light mode: surface-0 (#ffffff)
  - Dark mode: surface-900 (#1a1a1a)
- **Border**:
  - Light mode: surface-200 (#e5e7eb)
  - Dark mode: surface-700 (#404040)
- **Text**:
  - Light mode: surface-900 (#1a1a1a)
  - Dark mode: surface-0 (#ffffff)
- **Primary (Active)**:
  - Light mode: primary-700 with primary-100 background
  - Dark mode: primary-300 with primary-900/20 background
- **Hover**: surface-100 (light) / surface-800 (dark)

---

## Transitions & Animations

- **Sidebar Width**: `transition-all duration-300` (300ms smooth transition)
- **Tab Switch**: Instant route change with content fade-in
- **Hover States**: 150ms ease-in-out
- **Mobile Menu**: Slide-in animation from left (fade + transform)

---

## Component Hierarchy

```
Organization (Layout Root)
├── OrganizationHeaderTabs (Mobile < 1024px)
│   ├── Tab: Register → /modules/organization/new
│   └── Tab: Information → /modules/organization/detail
│
├── OrganizationNav (Desktop ≥ 1024px)
│   ├── Header (Title + Toggle Button)
│   └── Navigation Items
│       ├── Register Organization → /modules/organization/new
│       └── View Information → /modules/organization/detail
│
└── RouterOutlet (Content Area)
    └── Detail Component (handles both new & detail views)
```

---

## Interaction States

### Navigation Items

1. **Default**: Gray text, transparent background
2. **Hover**: Slightly darker background (surface-100/800)
3. **Active**: Primary color text + tinted background
4. **Focus**: Visible focus ring (keyboard navigation)
5. **Disabled**: Reduced opacity (future use)

### Toggle Button

1. **Default**: Secondary color, rounded
2. **Hover**: Darker secondary shade
3. **Active**: Pressed state with scale
4. **Focus**: Focus ring visible

### Tabs (Mobile)

1. **Default**: Gray text, 2px transparent bottom border
2. **Hover**: Darker text
3. **Active**: Primary text + 2px primary bottom border
4. **Focus**: Focus ring

---

## Responsive Behavior

### Breakpoint: 1024px

**Desktop (≥ 1024px)**:

- Show OrganizationNav sidebar
- Hide OrganizationHeaderTabs
- Sidebar can toggle between narrow (56px) and sidebar (256px)
- Content area flexes to fill remaining space

**Mobile (< 1024px)**:

- Hide OrganizationNav sidebar
- Show OrganizationHeaderTabs
- Full-width content area
- Vertical stacking of form elements

### Window Resize Handling

The layout automatically adapts when resizing the browser window:

- Resize listener attached to window
- `isMobile` signal updated based on `window.innerWidth < 1024`
- Components reactively update based on `isMobile` state
- No page reload required
