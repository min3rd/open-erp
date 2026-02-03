# User List Management Screen - Implementation Documentation

## Overview
This document describes the implementation of the user list management screen located at `/management/user`.

## Features Implemented

### 1. **User List Component** (`src/app/private/modules/management/user/list/`)
A fully functional user management interface with the following capabilities:

#### Layout Structure
- **Fixed Toolbar** (Top): Contains search, scope toggle, and action buttons
- **Scrollable Content** (Middle): Displays user table with pagination
- **Fixed Footer** (Bottom): Pagination controls and page size selector

#### Core Features

##### Search Functionality
- Real-time search with 300ms debounce
- Searches across: name, email, phone, username
- Automatically resets to page 1 when search query changes

##### Scope Toggle
- **Global Scope**: Shows all users in the system
- **Organization Scope**: Shows only users in the current organization
- Integrated with `OrganizationContextService` for organization context

##### Pagination
- Server-side pagination support
- Configurable page sizes: 10, 25, 50, 100
- URL-based pagination (page and limit parameters in route)
- Page state persists when changing scope

##### User Table
- Displays: Avatar, Full Name, Username, Email, Phone, Status, Last Login
- Checkbox selection (single and multiple)
- Sortable columns
- Responsive design (adapts to mobile and desktop)
- Row highlighting on hover

##### Bulk Actions Menu
- **Download CSV**: Export users to CSV file
- **Import Users**: Placeholder for future implementation
- **Block Selected**: Block multiple selected users
- **Revoke Login Sessions**: Revoke sessions for selected users

##### Status Display
- Color-coded status tags:
  - Active: Green (success)
  - Inactive: Orange (warn)
  - Blocked: Red (danger)

### 2. **User Service** (`src/core/services/user-service.ts`)
Backend API integration service with the following methods:

- `getUsers(params)`: Fetch users with pagination and filtering
- `blockUsers(userIds)`: Block multiple users
- `revokeLoginSessions(userIds)`: Revoke login sessions
- `exportToCSV(params)`: Export users to CSV

**Note**: Currently uses mock data. Replace with actual API calls when backend is ready.

### 3. **Accessibility Features**

#### Required Element IDs (All Implemented)
- `user-list-toolbar` - Main toolbar container
- `user-list-search` - Search input field
- `user-list-add-button` - Add new user button
- `user-list-actions-button` - Actions menu button
- `user-list-scope-toggle` - Scope selection toggle
- `user-list-content` - Scrollable content area
- `user-list-table` - User data table
- `user-list-row-{id}` - Individual table rows
- `user-list-pagination` - Pagination component
- `user-list-page-size` - Page size selector
- `user-list-status` - ARIA live region for announcements

#### ARIA Attributes
- `aria-label` on all interactive elements
- `aria-live="polite"` region for status updates
- `aria-atomic="true"` for complete message reading
- `role="status"` for screen reader announcements
- Proper form labels linked with `for/id` attributes

#### Keyboard Navigation
- Full keyboard support via PrimeNG components
- Tab navigation through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for table navigation

## Technical Stack

### Technologies Used
- **Angular 21**: Standalone components with signals
- **PrimeNG 21**: UI component library
- **Tailwind CSS**: Utility-first styling
- **RxJS**: Reactive programming for data streams

### Design Patterns
- **Signals**: For reactive state management
- **Computed**: For derived state
- **inject()**: For dependency injection (no constructor injection)
- **OnPush Change Detection**: For performance optimization
- **Debouncing**: For search input optimization

## Routing

### Route Structure
```
/management/user/:filter/:page/:limit
```

### Examples
- `/management/user/all/1/10` - All users, page 1, 10 items per page
- `/management/user/all/2/25` - All users, page 2, 25 items per page

The component reads pagination parameters from the URL and updates the URL when pagination changes.

## State Management

### Component Signals
- `users` - Current page of users
- `selectedUsers` - Users selected via checkboxes
- `isLoading` - Loading state indicator
- `searchQuery` - Current search text
- `currentPage` - Current pagination page
- `pageSize` - Number of items per page
- `totalRecords` - Total number of users matching filters
- `scope` - Current scope (global/organization)

### Computed Values
- `totalPages` - Calculated from totalRecords and pageSize
- `hasSelection` - Whether any users are selected
- `currentOrganization` - Current organization from OrganizationContext

## Testing

### Unit Tests
Two test suites have been created:

1. **`list.spec.ts`**: Component logic tests
   - Component creation
   - DOM element IDs validation
   - Search functionality with debounce
   - Pagination
   - Scope switching
   - Bulk actions
   - Date formatting
   - Status severity mapping
   - Accessibility attributes

2. **`user-service.spec.ts`**: Service logic tests
   - Service creation
   - User fetching with pagination
   - Search filtering
   - Page size handling
   - Bulk operations (block, revoke sessions)
   - CSV export

## Integration with Existing Code

### Dependencies
- `OrganizationContextService`: For organization context
- `MessageService`: For toast notifications (PrimeNG)
- `Router/ActivatedRoute`: For navigation and route parameters

### Router Configuration
Already integrated into existing route structure:
- `management.routes.ts` → `user.routes.ts` → `List` component

## Mock Data

The `UserService` currently returns mock data with:
- 50 sample users
- Realistic names, emails, phone numbers
- Random avatars from pravatar.cc
- Various statuses (active, inactive, blocked)
- Realistic timestamps

## Future Enhancements

### When Backend is Ready
1. Replace mock data in `UserService` with actual API calls
2. Implement actual user import functionality
3. Add real-time user status updates via WebSocket
4. Add user role management
5. Add user activity logs

### Potential UI Improvements
1. Virtual scrolling for large datasets
2. Advanced filters (by role, status, date range)
3. Column customization (show/hide columns)
4. Export options (PDF, Excel)
5. Batch user creation/editing

## Performance Considerations

1. **Lazy Loading**: Component is lazy-loaded via routing
2. **OnPush Detection**: Minimizes change detection cycles
3. **Debounced Search**: Reduces API calls
4. **Server Pagination**: Handles large datasets efficiently
5. **Computed Signals**: Only recalculates when dependencies change

## Browser Compatibility

Tested and working on:
- Modern browsers supporting ES2022+
- Chrome, Firefox, Safari, Edge (latest versions)

## Accessibility Compliance

The implementation follows:
- **WCAG 2.1 Level AA** standards
- **AXE Core** accessibility guidelines
- Proper semantic HTML
- Keyboard-only navigation support
- Screen reader compatibility

## Code Quality

- TypeScript strict mode enabled
- All functions properly typed
- No `any` types used
- Consistent code style with Prettier
- Component follows Angular style guide

## Files Modified/Created

### Created
1. `src/core/services/user-service.ts` - User service with API integration
2. `src/core/services/user-service.spec.ts` - User service tests
3. `src/app/private/modules/management/user/list/list.spec.ts` - Component tests

### Modified
1. `src/app/private/modules/management/user/list/list.ts` - Main component logic
2. `src/app/private/modules/management/user/list/list.html` - Component template

## Usage Example

```typescript
// Navigate to user list
this.router.navigate(['/management/user', 'all', 1, 10]);

// Change page
this.router.navigate(['/management/user', 'all', 2, 10]);

// Change page size
this.router.navigate(['/management/user', 'all', 1, 25]);
```

## Contributing

When extending this component:
1. Maintain the existing ID naming convention
2. Ensure all interactive elements have proper ARIA labels
3. Test with keyboard-only navigation
4. Run AXE accessibility checks
5. Update tests accordingly
6. Follow the existing code style

## Support

For questions or issues related to this implementation, refer to:
- PrimeNG Documentation: https://primeng.org/
- Angular Documentation: https://angular.io/
- Tailwind CSS Documentation: https://tailwindcss.com/
