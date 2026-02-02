# Mobile User List - Visual Layout Guide

## Desktop Layout (>= 768px)

```
┌─────────────────────────────────────────────────────────────┐
│ Toolbar                                                      │
│ [Global|Org] [🔍 Search..................] [+] [⋮]         │
├─────────────────────────────────────────────────────────────┤
│ Content Area (Table)                                         │
│ ┌───┬────┬──────────┬────────────┬───────┬────────┬────────┐│
│ │☐  │ 👤 │ Name     │ Email      │ Phone │ Status │ Login  ││
│ ├───┼────┼──────────┼────────────┼───────┼────────┼────────┤│
│ │☐  │ 👤 │ John Doe │ john@...   │ +84.. │ Active │ 2h ago ││
│ │☐  │ 👤 │ Jane ... │ jane@...   │ +84.. │ Active │ 1d ago ││
│ │...│ ...│ ...      │ ...        │ ...   │ ...    │ ...    ││
│ └───┴────┴──────────┴────────────┴───────┴────────┴────────┘│
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                   │
│ ◄ 1 2 [3] 4 5 ►  [Items per page: 10 ▼] Showing 21-30 of 234│
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout (< 768px)

### Toolbar (Collapsed)
```
┌─────────────────────────────┐
│ [🌐|🏢] [🔍] [🔄] [+] [⋮]   │
└─────────────────────────────┘
```

### Toolbar (Search Expanded)
```
┌─────────────────────────────┐
│ [🌐|🏢] [🔍] [🔄] [+] [⋮]   │
├─────────────────────────────┤
│ [Search users............ ✕] │
└─────────────────────────────┘
```

### Content Area (Card List)
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ 👤  John Doe     [Active]│ │
│ │     john@example.com    │ │
│ │     +84 900 000 001  [⋮]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤  Jane Smith [Inactive]│ │
│ │     jane@example.com    │ │
│ │     +84 900 000 002  [⋮]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤  Bob Wilson   [Active]│ │
│ │     bob@example.com     │ │
│ │     +84 900 000 003  [⋮]│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Pagination Footer
```
┌─────────────────────────────┐
│                             │
│  [◄]  1-10 of 234  [►]     │
│       [10 items ▼]          │
│                             │
└─────────────────────────────┘
```

## Responsive Breakpoint

```
         < 768px              >= 768px
┌──────────────────┐  │  ┌──────────────────┐
│  Mobile Layout   │  │  │  Desktop Layout  │
│                  │  │  │                  │
│  • Icon toolbar  │  │  │  • Full toolbar  │
│  • Card list     │  │  │  • Table view    │
│  • Simple paging │  │  │  • Full paging   │
└──────────────────┘  │  └──────────────────┘
        MOBILE        │        DESKTOP
```

## Interactive Elements

### Mobile Toolbar Buttons
```
[🌐|🏢]  → Scope toggle (Global/Organization)
[🔍]     → Toggle search panel
[🔄]     → Refresh user list
[+]      → Add new user
[⋮]      → Actions menu
```

### Mobile Card Actions
```
Tap card → Navigate to user detail
Tap [⋮]  → Open context menu
           • View Details
           • Edit
           • Block User
           • Revoke Session
```

### Mobile Pagination
```
[◄]        → Previous page (disabled on page 1)
1-10 of 234 → Current range display
[10 ▼]     → Items per page selector
[►]        → Next page (disabled on last page)
```

## Touch Targets

All interactive elements meet WCAG 2.1 Level AA requirements:
- Minimum size: 44x44 pixels
- Adequate spacing between targets
- Clear visual feedback on tap/hover

## Color Coding (Status Tags)

```
Active    → Green  (success)
Inactive  → Yellow (warn)
Blocked   → Red    (danger)
Other     → Gray   (secondary)
```

## Loading States

### Mobile Skeleton
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ ⚫  ▓▓▓▓▓▓▓▓▓▓        │ │
│ │     ▓▓▓▓▓▓▓▓          │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⚫  ▓▓▓▓▓▓▓▓▓▓        │ │
│ │     ▓▓▓▓▓▓▓▓          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## Empty States

### No Results (Mobile)
```
┌─────────────────────────────┐
│                             │
│           🔍                │
│                             │
│   No users found matching   │
│      "search query"         │
│                             │
└─────────────────────────────┘
```

### No Users (Mobile)
```
┌─────────────────────────────┐
│                             │
│           👥                │
│                             │
│   No users available        │
│                             │
└─────────────────────────────┘
```
