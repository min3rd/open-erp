# Architecture Diagram - Mobile Navigation Fix

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Management Module Layout                     │
│                  (management.ts / management.html)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ window.innerWidth check
                              │
                 ┌────────────┴─────────────┐
                 │                          │
         width < 1024px              width >= 1024px
                 │                          │
                 ▼                          ▼
    ┌─────────────────────────┐  ┌─────────────────────────┐
    │ management-header-tabs  │  │    management-nav       │
    │      (MOBILE VIEW)      │  │   (DESKTOP VIEW)        │
    │  ┌───────────────────┐  │  │  ┌───────────────────┐  │
    │  │ Horizontal Tabs   │  │  │  │ Vertical Sidebar  │  │
    │  │ Scrollable        │  │  │  │ Collapsible       │  │
    │  │ Touch-friendly    │  │  │  │ Full navigation   │  │
    │  └───────────────────┘  │  │  └───────────────────┘  │
    └────────┬────────────────┘  └────────┬────────────────┘
             │                             │
             │    Both use same data source │
             │                             │
             └────────────┬────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────────┐
          │      NavigationService                │
          │  (navigation-service.ts)              │
          │                                       │
          │  • loadModuleNavigation()             │
          │  • getModuleNavigation$()             │
          │  • Caches navigation data             │
          └───────────────┬───────────────────────┘
                          │
                          │ HTTP GET
                          ▼
          ┌───────────────────────────────────────┐
          │   Backend Navigation API              │
          │   /v1/navigations/module/             │
          │   nav-management?format=tree          │
          │                                       │
          │   Returns navigation items            │
          │   filtered by user permissions/ACL    │
          └───────────────────────────────────────┘
```

## Data Flow (Before Fix)

```
DESKTOP:
┌──────────┐      ┌────────────┐      ┌──────────┐
│ User     │─────▶│ management │─────▶│ Dynamic  │
│ w>=1024  │      │    -nav    │      │ Nav Items│
└──────────┘      └──────┬─────┘      └──────────┘
                         │
                         ▼
                  NavigationService
                         │
                         ▼
                    Backend API
                         │
                         ▼
                  ✅ Shows ALL items


MOBILE (BEFORE FIX):
┌──────────┐      ┌────────────┐      ┌──────────┐
│ User     │─────▶│ management │─────▶│ Hardcoded│
│ w<1024   │      │-header-tabs│      │ "User"   │
└──────────┘      └────────────┘      └──────────┘
                                           │
                                           ▼
                                    ❌ Only 1 tab
                                    ❌ Ignores API
                                    ❌ Ignores permissions
```

## Data Flow (After Fix)

```
DESKTOP:
┌──────────┐      ┌────────────┐      ┌──────────┐
│ User     │─────▶│ management │─────▶│ Dynamic  │
│ w>=1024  │      │    -nav    │      │ Nav Items│
└──────────┘      └──────┬─────┘      └──────────┘
                         │
                         ▼
                  NavigationService
                         │
                         ▼
                    Backend API
                         │
                         ▼
                  ✅ Shows ALL items


MOBILE (AFTER FIX):
┌──────────┐      ┌────────────┐      ┌──────────┐
│ User     │─────▶│ management │─────▶│ Dynamic  │
│ w<1024   │      │-header-tabs│      │ Nav Items│
└──────────┘      └──────┬─────┘      └──────────┘
                         │
                         ▼
                  NavigationService
                         │
                         ▼
                    Backend API
                         │
                         ▼
                  ✅ Shows ALL items
                  ✅ Same as desktop
                  ✅ Respects permissions
```

## Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  ManagementHeaderTabs Component Lifecycle (After Fix)       │
└─────────────────────────────────────────────────────────────┘

1. Component Created
   │
   ├─▶ constructor()
   │   └─▶ Inject dependencies
   │       ├─ NavigationService
   │       ├─ Router
   │       └─ ChangeDetectorRef
   │
2. Component Initialized
   │
   ├─▶ ngOnInit()
   │   │
   │   ├─▶ Subscribe to getModuleNavigation$('nav-management')
   │   │   └─▶ Update items[] when data changes
   │   │       └─▶ Trigger change detection
   │   │
   │   ├─▶ Call loadModuleNavigation('nav-management')
   │   │   └─▶ Fetch from API if not cached
   │   │       └─▶ Backend filters by user permissions
   │   │           └─▶ Returns navigation items
   │   │
   │   └─▶ Subscribe to router events
   │       └─▶ Update active states on route change
   │
3. Component Renders
   │
   ├─▶ Template processes items[]
   │   │
   │   └─▶ @for (item of items; track item.id)
   │       │
   │       └─▶ Render each tab:
   │           ├─ Icon (if present)
   │           ├─ Label
   │           ├─ Badge (if present)
   │           ├─ Active state
   │           └─ Router link
   │
4. User Interaction
   │
   ├─▶ User clicks tab
   │   └─▶ Router navigates
   │       └─▶ Route change event
   │           └─▶ Active state updates
   │               └─▶ Change detection triggered
   │
5. Component Destroyed
   │
   └─▶ ngOnDestroy()
       └─▶ Unsubscribe all subscriptions
           └─▶ Prevent memory leaks
```

## Template Structure (After Fix)

```html
<header id="management-header-tabs">
  │
  └── <div id="management-tabs-container" class="px-2">
      │
      └── <nav id="management-tabs-nav" class="overflow-x-auto">
          │
          └── @for (item of items; track item.id)
              │
              └── @if (item.routerLink && !item.disabled)
                  │
                  └── <a [id]="'management-tab-' + item.id"
                         [routerLink]="item.routerLink"
                         routerLinkActive="active-styles"
                         class="tab-styles">
                      │
                      ├── @if (item.icon)
                      │   └── <i [class]="item.icon"></i>
                      │
                      ├── <span>{{ item.label }}</span>
                      │
                      └── @if (item.badge)
                          └── <span class="badge">{{ item.badge }}</span>
```

## API Request/Response Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Component calls NavigationService                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. NavigationService checks cache                               │
│     • If cached: Return immediately                              │
│     • If not cached: Make HTTP request                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. HTTP GET Request                                             │
│                                                                  │
│  GET /v1/navigations/module/nav-management?format=tree          │
│  Headers:                                                        │
│    Authorization: Bearer <token>                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. Backend Processing                                           │
│     • Authenticate user                                          │
│     • Check user permissions/ACL                                 │
│     • Filter navigation items                                    │
│     • Build tree structure                                       │
│     • Return filtered items                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. HTTP Response                                                │
│                                                                  │
│  {                                                               │
│    "data": {                                                     │
│      "item": {                                                   │
│        "items": [                                                │
│          {                                                       │
│            "id": "user",                                         │
│            "label": "User Management",                           │
│            "icon": "pi pi-users",                                │
│            "routerLink": "/management/user",                     │
│            "order": 1                                            │
│          },                                                      │
│          {                                                       │
│            "id": "product",                                      │
│            "label": "Product Management",                        │
│            "icon": "pi pi-box",                                  │
│            "routerLink": "/management/product",                  │
│            "order": 2                                            │
│          }                                                       │
│          // ... more items based on permissions                 │
│        ],                                                        │
│        "total": 10                                               │
│      }                                                           │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. NavigationService processes response                         │
│     • Unwrap API response                                        │
│     • Map to MenuItem[]                                          │
│     • Cache result                                               │
│     • Emit to subscribers                                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. Component receives items                                     │
│     • Update items[]                                             │
│     • Trigger change detection                                   │
│     • Template re-renders                                        │
│     • Tabs appear on screen                                      │
└──────────────────────────────────────────────────────────────────┘
```

## Comparison: Before vs After

```
┌────────────────────────────────────────────────────────────────┐
│                    BEFORE FIX                                  │
├────────────────────────────────────────────────────────────────┤
│  Component: management-header-tabs.ts                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ export class ManagementHeaderTabs {                      │ │
│  │   router = inject(Router);                               │ │
│  │                                                          │ │
│  │   isActive(route: string): boolean {                     │ │
│  │     return this.router.isActive(route, {...});          │ │
│  │   }                                                      │ │
│  │ }                                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Template: management-header-tabs.html                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ <a routerLink="user" ...>                                │ │
│  │   <i class="pi pi-users"></i>                            │ │
│  │   <span>User</span>                                      │ │
│  │ </a>                                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Result: ❌ Only shows User Management                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                     AFTER FIX                                  │
├────────────────────────────────────────────────────────────────┤
│  Component: management-header-tabs.ts                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ export class ManagementHeaderTabs                        │ │
│  │   implements OnInit, OnDestroy {                         │ │
│  │                                                          │ │
│  │   private navigationService = inject(NavigationService); │ │
│  │   private router = inject(Router);                       │ │
│  │   private cdr = inject(ChangeDetectorRef);              │ │
│  │                                                          │ │
│  │   items: MenuItem[] = [];                               │ │
│  │                                                          │ │
│  │   ngOnInit(): void {                                     │ │
│  │     // Subscribe to navigation data                     │ │
│  │     this.navigationService                              │ │
│  │       .getModuleNavigation$('nav-management')           │ │
│  │       .subscribe((items) => {                           │ │
│  │         this.items = items || [];                       │ │
│  │         this.cdr.markForCheck();                        │ │
│  │       });                                               │ │
│  │                                                          │ │
│  │     // Load navigation from API                         │ │
│  │     this.navigationService                              │ │
│  │       .loadModuleNavigation('nav-management')           │ │
│  │       .subscribe();                                     │ │
│  │   }                                                      │ │
│  │                                                          │ │
│  │   ngOnDestroy(): void {                                  │ │
│  │     // Cleanup subscriptions                            │ │
│  │   }                                                      │ │
│  │ }                                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Template: management-header-tabs.html                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ @for (item of items; track item.id) {                   │ │
│  │   @if (item.routerLink && !item.disabled) {             │ │
│  │     <a [routerLink]="item.routerLink" ...>              │ │
│  │       @if (item.icon) {                                 │ │
│  │         <i [class]="item.icon"></i>                     │ │
│  │       }                                                 │ │
│  │       <span>{{ item.label }}</span>                     │ │
│  │       @if (item.badge) {                                │ │
│  │         <span>{{ item.badge }}</span>                   │ │
│  │       }                                                 │ │
│  │     </a>                                                │ │
│  │   }                                                     │ │
│  │ }                                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Result: ✅ Shows ALL navigation items dynamically             │
└────────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Window                              │
│                                                                 │
│  Width >= 1024px (Desktop)                                      │
│  ┌───────────┬───────────────────────────────────────────────┐ │
│  │           │                                               │ │
│  │ Sidebar   │          Content Area                         │ │
│  │  Nav      │                                               │ │
│  │           │                                               │ │
│  │ • User    │                                               │ │
│  │ • Product │                                               │ │
│  │ • Org     │                                               │ │
│  │ • Ware    │          (Page Content)                       │ │
│  │ • ...     │                                               │ │
│  │           │                                               │ │
│  │           │                                               │ │
│  └───────────┴───────────────────────────────────────────────┘ │
│                                                                 │
│  Component: management-nav (vertical sidebar)                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Browser Window                              │
│                                                                 │
│  Width < 1024px (Mobile)                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [User] [Product] [Org] [Ware] ... ← scroll →             │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │                                                           │ │
│  │                                                           │ │
│  │                  Content Area                             │ │
│  │                                                           │ │
│  │               (Page Content)                              │ │
│  │                                                           │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Component: management-header-tabs (horizontal tabs)            │
└─────────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- ✅ = Working correctly
- ❌ = Bug/Issue
- → = Data flow direction
- ├─ = Parent-child relationship
- │ = Vertical connection
- ▼ = Process flow
