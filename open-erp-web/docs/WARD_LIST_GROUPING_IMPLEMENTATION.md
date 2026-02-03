# Ward List Grouping and Sorting Implementation

## Summary

This implementation adds province-based grouping and name-based sorting to the ward list screen, with data preloaded via Angular route resolvers.

## Features Implemented

### 1. Route Resolvers
- ✅ **Ward List Resolver**: Updated to accept and pass `sort` parameter from query params (default: `name:asc`)
- ✅ **Province List Resolver**: Updated to fetch all provinces (limit: 1000) for proper grouping
- ✅ **District List Resolver**: Updated to fetch all districts (limit: 10000) for filtering
- ✅ All data is loaded via resolvers before route activation (no direct API calls in component init)

### 2. Province Grouping
- ✅ **Group by Province Code**: Wards are grouped by `provinceCode`
- ✅ **Display Province Names**: Group headers show province names (e.g., "Hà Nội") instead of codes
- ✅ **Unknown Province Handling**: Shows `Unknown (code)` for missing provinces with console warning
- ✅ **Collapsible Groups**: Each province group can be expanded/collapsed
- ✅ **Default State**: All groups expanded by default
- ✅ **Ward Count**: Each group header shows the number of wards in that province

### 3. Sorting
- ✅ **Sort Control**: Dropdown added to toolbar (desktop and mobile)
- ✅ **Sort Options**: 
  - Name (A → Z) - ascending
  - Name (Z → A) - descending
- ✅ **Default Sort**: Name ascending
- ✅ **Client-Side Sorting**: Applied on current page (backend doesn't support sort param yet)
- ✅ **Vietnamese Locale**: Uses `localeCompare` with 'vi-VN' locale for proper Vietnamese sorting
- ✅ **URL State**: Sort order persisted in query parameter `?sort=name:asc`

### 4. UI/UX
- ✅ **Desktop View**: Sort dropdown in toolbar, grouped table with collapsible headers
- ✅ **Mobile View**: Sort dropdown in search panel, grouped card layout
- ✅ **Unique IDs**: All interactive elements have unique IDs for testing and accessibility
- ✅ **ARIA Attributes**: Proper `aria-expanded` and `aria-label` on group toggles
- ✅ **Visual Feedback**: Chevron icons indicate group expansion state

### 5. Internationalization
- ✅ **English**: All new UI text translated
- ✅ **Spanish**: All new UI text translated
- ✅ **Translation Keys Added**:
  - `wardList.sort.label`
  - `wardList.sort.nameAsc`
  - `wardList.sort.nameDesc`
  - `wardList.grouping.toggleGroup`
  - `wardList.grouping.wards`

### 6. Component Architecture
- ✅ **Read from route.data**: Component gets provinces from `route.data`, not direct API call
- ✅ **Computed Signals**: `wardsByProvince` computed from wards and provinces
- ✅ **Helper Methods**: `getProvinceName()` and `getWardCount()` for template use
- ✅ **State Management**: Sort order and group expansion tracked in signals

### 7. Testing
- ✅ **Unit Tests Created**: Comprehensive test suite for:
  - Province grouping logic
  - Group expansion/collapse
  - Sort order management
  - Data loading from resolvers
  - Helper methods
  - Unknown province handling

## Implementation Notes

### Client-Side Sorting Limitation
The backend currently doesn't support a `sort` query parameter. As documented in the requirements:
- Current implementation applies sorting on **current page only**
- Sorting uses Vietnamese locale (`vi-VN`) for proper character ordering
- A TODO comment is added in `ward.service.ts` for future backend support

### Route Structure
The ward list route already supports complex filtering:
```
/wards/:provinceFilter/:districtFilter/:filter/:page/:limit?sort=name:asc
```

Example URLs:
- All wards, sorted A-Z: `/wards/all-provinces/all-districts/all/1/100?sort=name:asc`
- Hanoi wards, sorted Z-A: `/wards/01/all-districts/all/1/100?sort=name:desc`

### Performance Considerations
- Resolvers fetch all provinces (up to 1000) and districts (up to 10000) for complete grouping
- Grouping is performed via computed signals for efficiency
- Group expansion state stored in a Set for O(1) lookup

## Files Changed

1. **src/app/private/modules/management/ward/ward.types.ts**
   - Added `sort` parameter to `GetWardsParams`

2. **src/app/private/modules/management/ward/services/ward.service.ts**
   - Added client-side sorting logic
   - Added TODO comment for backend support

3. **src/app/private/modules/management/ward/resolvers/ward-list.resolver.ts**
   - Added sort parameter handling
   - Default sort: `name:asc`

4. **src/app/private/modules/management/ward/list/list.ts**
   - Added `sortOrder` and `expandedGroups` signals
   - Added `wardsByProvince` computed signal
   - Added `sortOptions` computed signal
   - Added helper methods: `getProvinceName()`, `getWardCount()`
   - Added sort and group methods: `onSortChange()`, `toggleGroup()`, etc.
   - Subscribe to query params for sort order

5. **src/app/private/modules/management/ward/list/list.html**
   - Added sort dropdown to desktop and mobile toolbars
   - Updated table to show province group headers
   - Added group toggle buttons with icons
   - Updated mobile list for grouping
   - All interactive elements have unique IDs

6. **src/app/private/modules/management/province/resolvers/province-list.resolver.ts**
   - Increased limit to 1000 to fetch all provinces

7. **src/app/private/modules/management/district/resolvers/district-list.resolver.ts**
   - Increased limit to 10000 to fetch all districts

8. **public/i18n/en.json** & **public/i18n/es.json**
   - Added translation keys for sort and grouping

9. **src/app/private/modules/management/ward/list/list.spec.ts**
   - Created comprehensive unit tests

## Accessibility Checklist

- ✅ All interactive elements have unique IDs
- ✅ Group toggle buttons have `aria-expanded` attribute
- ✅ Group toggle buttons have descriptive `aria-label`
- ✅ Keyboard navigation supported (native button elements)
- ✅ Focus management (native browser behavior)
- ✅ Screen reader friendly (descriptive labels and ARIA attributes)

## Browser Compatibility

- ✅ Desktop: Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile: iOS Safari, Chrome Mobile, Samsung Internet
- ✅ Responsive design with separate mobile and desktop layouts

## Future Enhancements

1. **Backend Sorting**: Add `?sort=name:asc|desc` support to backend API
2. **Persistent Group State**: Save expanded/collapsed state in URL or localStorage
3. **Additional Sort Options**: Sort by code, district, etc.
4. **Filter Within Groups**: Search/filter without losing grouping
5. **Server-Side Grouping**: Optimize for very large datasets

## Testing Backend Integration

To test with the backend:

```bash
# 1. Start backend (from backend repo)
cd /path/to/open-erp-backend
npm install
npm run docker:dev:up  # Start MongoDB
npm run start:common:dev  # Start common service on port 3004

# 2. Start frontend
cd /path/to/open-erp-web
npm start

# 3. Navigate to ward list
# http://localhost:4200/management/ward/all-provinces/all-districts/all/1/100?sort=name:asc

# 4. Verify:
# - Provinces load and wards are grouped by province name
# - Sort dropdown changes order
# - Groups can be expanded/collapsed
# - URL updates when sort changes
```

## Known Limitations

1. **Sorting**: Currently client-side only, applies to current page
2. **Large Datasets**: Loading all provinces/districts may be slow with very large datasets (>10,000 items)
3. **Group State**: Not persisted between page refreshes (design decision for simplicity)

## Security Considerations

- ✅ No new security vulnerabilities introduced
- ✅ All API calls use existing authentication
- ✅ No sensitive data exposed in URL parameters
- ✅ Input sanitization handled by Angular framework
- ✅ No XSS vulnerabilities (using Angular templates)
