# Mobile User List Implementation

## Overview
This document describes the mobile optimization implementation for the user list screen.

## Changes Made

### 1. Responsive Detection
- Added `isMobile` signal that tracks viewport width
- Breakpoint set at 768px (mobile < 768px, desktop >= 768px)
- Viewport detection runs on window resize events
- Implementation in `list.ts`:
  ```typescript
  protected readonly isMobile = signal(false);
  
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
  ```

### 2. Mobile Toolbar (< 768px)
**Features:**
- Icon-only buttons to save space
- Scope toggle shows only icons (globe/building)
- Search icon button that opens expandable search panel
- Refresh button for reloading user list
- Add user button (plus icon)
- Actions overflow menu (ellipsis icon)

**Accessibility:**
- All buttons have `aria-label` attributes
- Tooltips on hover
- Touch targets >= 44x44px

### 3. Expandable Search (Mobile)
**Features:**
- Triggered by search icon button in toolbar
- Slides down below toolbar when opened
- Input has autofocus when opened
- Close button (X) to dismiss search
- Clears search query on close

**Implementation:**
```typescript
protected readonly isSearchOpen = signal(false);

protected toggleSearch(): void {
  this.isSearchOpen.set(!this.isSearchOpen());
}

protected closeSearch(): void {
  this.isSearchOpen.set(false);
  this.searchQuery.set('');
  // Navigate to clear search results
}
```

### 4. Mobile List View
**Layout:**
- Card-based design instead of table
- Each card contains:
  - Large circular avatar with user initials
  - User's full name (bold, larger font)
  - Email address (smaller, gray text)
  - Phone number (if available)
  - Status tag (colored: success/warn/danger)
  - Actions menu button (ellipsis)

**Features:**
- Tap on card navigates to user detail
- Skeleton loading states (5 animated placeholders)
- Empty states with icons and messages
- Proper spacing and touch targets
- Menu button opens action menu per user

**Accessibility:**
- Semantic HTML structure
- ARIA labels on interactive elements
- Touch targets >= 44x44px
- Screen reader friendly

### 5. Mobile Pagination
**Simplified Design:**
- Previous button (left chevron icon)
- Page indicator: "1-10 of 234" format
- Items per page dropdown (10/25/50)
- Next button (right chevron icon)

**Features:**
- Previous disabled on first page
- Next disabled on last page
- Compact layout fits in footer
- Touch-friendly button sizes

**Implementation:**
```typescript
protected onPreviousPage(): void {
  if (this.currentPage() > 1) {
    const newPage = this.currentPage() - 1;
    this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
      relativeTo: this.route,
    });
  }
}

protected onNextPage(): void {
  if (this.currentPage() < this.totalPages()) {
    const newPage = this.currentPage() + 1;
    this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
      relativeTo: this.route,
    });
  }
}
```

### 6. Desktop View (>= 768px)
**Unchanged Behavior:**
- Full table layout with all columns
- Toolbar with full-width scope toggle and search
- Standard PrimeNG paginator with detailed controls
- Context menu on right-click
- All existing functionality preserved

### 7. Translations
Added mobile-specific translations to both `en.json` and `es.json`:
```json
{
  "userList": {
    "search": {
      "openSearch": "Open search",
      "closeSearch": "Close search"
    },
    "refreshButton": {
      "label": "Refresh user list",
      "tooltip": "Refresh"
    },
    "mobileList": {
      "itemActions": "User actions"
    },
    "pagination": {
      "previous": "Previous page",
      "next": "Next page",
      "showing": "{first}–{last} of {total}"
    }
  }
}
```

### 8. Component Structure
**Template Organization:**
```html
<div class="flex flex-auto h-full">
  <div class="flex h-full flex-col w-full">
    <!-- Desktop Toolbar -->
    @if (!isMobile()) { ... }
    
    <!-- Mobile Toolbar -->
    @if (isMobile()) { 
      <!-- Icon-only buttons -->
      <!-- Expandable search panel -->
    }
    
    <!-- Content Area -->
    <div id="user-list-content" class="flex-1 overflow-auto">
      <!-- Desktop Table -->
      @if (!isMobile()) { <p-table>...</p-table> }
      
      <!-- Mobile List -->
      @if (isMobile()) { 
        <!-- Card-based user list -->
      }
    </div>
    
    <!-- Footer Pagination -->
    <div class="border-t ...">
      <!-- Desktop Paginator -->
      @if (!isMobile()) { <p-paginator>...</p-paginator> }
      
      <!-- Mobile Paginator -->
      @if (isMobile()) { 
        <!-- Prev/Next + Items selector -->
      }
    </div>
  </div>
</div>
```

## Testing

### Unit Tests Added
- `should detect mobile viewport correctly`
- `should show mobile toolbar when in mobile view`
- `should toggle search input on mobile`
- `should close search and clear query on mobile`
- `should render mobile list view when in mobile mode`
- `should show mobile pagination with prev/next buttons`
- `should disable previous button on first page`
- `should disable next button on last page`
- `should navigate to previous/next page when buttons clicked`
- `should get user initials correctly`
- `should refresh users when refresh button clicked`

### Manual Testing Checklist
- [ ] Mobile viewport (< 768px) shows mobile layout
- [ ] Desktop viewport (>= 768px) shows desktop layout
- [ ] Search icon opens/closes search panel
- [ ] Search input receives focus when opened
- [ ] User list renders as cards on mobile
- [ ] Cards are tappable and navigate to detail
- [ ] Menu button on each card works
- [ ] Previous/Next pagination works
- [ ] Items per page selector works
- [ ] All buttons have proper touch targets (>= 44x44px)
- [ ] ARIA labels are present
- [ ] Screen reader announcements work

## Accessibility Features
1. **ARIA Labels**: All interactive elements have descriptive aria-label attributes
2. **Touch Targets**: All buttons are minimum 44x44px for mobile usability
3. **Keyboard Navigation**: All interactive elements are keyboard accessible
4. **Screen Reader**: Status announcements via aria-live regions
5. **Focus Management**: Search input receives focus when opened
6. **Semantic HTML**: Proper heading levels, landmarks, and structure

## Performance Considerations
1. **Conditional Rendering**: Only renders mobile OR desktop layout, not both
2. **Lazy Loading**: Routes are lazy loaded
3. **Signal-based State**: Uses Angular signals for reactive updates
4. **Debounced Search**: Search input uses debouncing (via route navigation)

## Browser Compatibility
- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Window resize events for responsive detection

## Known Limitations
1. E2E tests not implemented (requires test environment setup)
2. Budget warnings in production build (unrelated to this feature)
3. Requires authentication to view user list page

## Future Enhancements
1. Add pull-to-refresh on mobile
2. Add infinite scroll as alternative to pagination
3. Add filter panel for mobile
4. Add batch actions for selected users on mobile
5. Add swipe gestures for actions
