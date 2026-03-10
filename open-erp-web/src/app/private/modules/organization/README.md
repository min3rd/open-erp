# Organization Module Layout

## Overview

The Organization module features a responsive layout with desktop sidebar navigation and mobile header tabs.

## Architecture

### Components

#### 1. OrganizationLayoutService (`services/organization-layout.service.ts`)

Service responsible for managing the layout state:

- **Navigation Mode**: `narrow` (icon-only) or `sidebar` (full labels)
- **Mobile State**: Tracks whether the viewport is mobile (<1024px) or desktop (≥1024px)
- **Mobile Menu**: Controls visibility of mobile menu
- **Persistence**: Stores navigation mode preference in localStorage (`organization.nav.mode`)

**Key Methods:**

- `toggleNavMode()` - Toggle between narrow and sidebar modes
- `setNavMode(mode)` - Set navigation mode explicitly
- `setIsMobile(isMobile)` - Update mobile state
- `toggleMobileMenu()` - Toggle mobile menu visibility

#### 2. OrganizationNav (`components/organization-nav.ts`)

Desktop sidebar navigation component:

- **Narrow Mode** (56px width):
  - Icon-only navigation items
  - Tooltips on hover/focus
  - Toggle button to expand to sidebar mode
- **Sidebar Mode** (256px width):
  - Full labels with icons
  - Toggle button to collapse to narrow mode

**Navigation Items:**

- Register Organization (`/modules/organization/new`)
- View Information (`/modules/organization/detail`)

**Accessibility Features:**

- Proper ARIA labels and expanded states
- Keyboard accessible navigation
- Focus ring visible on all interactive elements
- Tooltips for narrow mode items

#### 3. OrganizationHeaderTabs (`components/organization-header-tabs.ts`)

Mobile header tabs component:

- Tab-based navigation for mobile devices
- Active tab highlighting based on current route
- Touch-friendly 44x44px minimum touch targets

**Tabs:**

- Register (links to `/modules/organization/new`)
- Information (links to `/modules/organization/detail`)

#### 4. Organization (`organization.ts`)

Main layout component that orchestrates the responsive behavior:

- Detects viewport size and updates `isMobile` signal
- Shows OrganizationHeaderTabs on mobile (<1024px)
- Shows OrganizationNav on desktop (≥1024px)
- Provides RouterOutlet for child route content

## Responsive Breakpoints

- **Mobile**: < 1024px (shows header tabs)
- **Desktop**: ≥ 1024px (shows sidebar navigation)

## Routing

The organization module uses child routes:

```typescript
{
  path: '',
  component: Organization,
  children: [
    { path: 'new', component: Detail },      // Register organization
    { path: 'detail', component: Detail },   // View information
    { path: 'edit', component: Detail },     // Edit (future use)
  ]
}
```

## LocalStorage Keys

- `organization.nav.mode`: Stores user's preferred navigation mode (`'narrow'` or `'sidebar'`)

## Internationalization

Translation keys are defined in `public/i18n/en.json` and `public/i18n/es.json`:

```json
{
  "organization": {
    "title": "Organization",
    "navigation": {
      "register": "Register Organization",
      "detail": "View Information",
      "toggleNavMode": "Toggle navigation mode",
      "toggleMenu": "Toggle menu"
    },
    "tabs": {
      "register": "Register",
      "info": "Information"
    }
  }
}
```

## Testing

All components and services have comprehensive unit tests:

- `organization-layout.service.spec.ts` - 12 tests
- `organization.spec.ts` - 5 tests
- `organization-nav.spec.ts` - 4 tests
- `organization-header-tabs.spec.ts` - 3 tests

Total: **24 tests** covering layout behavior, navigation modes, and responsive functionality.

## Usage Example

### Desktop - Sidebar Mode

```
┌─────────────────────────────────────────┐
│ Organization              [<]           │ Header with toggle
├─────────────────────────────────────────┤
│                                         │
│  📄 Register Organization               │ Navigation items
│  ℹ️  View Information                    │ with full labels
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Desktop - Narrow Mode

```
┌─────────────────────────────────────────┐
│ [>]                                     │ Header with toggle
├─────────────────────────────────────────┤
│                                         │
│ 📄                                      │ Icon-only
│ ℹ️                                       │ with tooltips
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Mobile - Header Tabs

```
┌─────────────────────────────────────────┐
│ [Register] | [Information]               │ Tab navigation
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         Content Area                    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## PrimeNG Components Used

- ButtonModule (toggle buttons, navigation)
- TooltipModule (narrow mode tooltips)
- CardModule (content display)

## Accessibility Compliance

✓ Keyboard navigation support
✓ Screen reader friendly (ARIA labels and roles)
✓ Proper focus management
✓ Touch targets ≥ 44x44px
✓ Color contrast meets WCAG AA standards
✓ Semantic HTML structure

## Future Enhancements

- Add floating action button (FAB) for mobile quick access
- Implement drag-to-reorder navigation items
- Add keyboard shortcuts for navigation
- Support custom navigation item icons
