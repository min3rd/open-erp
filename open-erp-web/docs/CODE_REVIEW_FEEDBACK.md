# Code Review Feedback - Future Improvements

## Date: 2026-01-23

## Summary
The implementation is complete and functional. The code review identified minor improvements for better maintainability and documentation. These are low-priority enhancements that can be addressed in future iterations.

## Suggested Improvements

### 1. Extract Constants to Shared Files ⚠️ Minor

**Current State:**
- `MAP_STYLES` constant defined in `map.component.ts`
- `DEFAULT_WARDS_PER_PROVINCE_LIMIT` defined in `ward-list.resolver.ts`

**Recommendation:**
Create shared constants files:
```typescript
// src/core/constants/map.constants.ts
export const MAP_STYLES = {
  background: { ... },
  primary: { ... },
  boundsPadding: [50, 50],
};

// src/core/constants/ui.constants.ts (or similar)
export const DEFAULT_WARDS_PER_PROVINCE_LIMIT = 10000;
```

**Benefits:**
- Centralized configuration
- Easier to update across multiple components
- Better discoverability

**Priority:** Low (current implementation works fine)

---

### 2. Add JSDoc Documentation ⚠️ Minor

**Missing Documentation:**

#### `activeProvinceCode` signal:
```typescript
/**
 * Active province code from route parameters.
 * When set, this province's group will be auto-expanded and its geometry
 * will be displayed as a background layer on the map.
 * Updated when navigating to /management/ward/:provinceCode
 */
protected readonly activeProvinceCode = signal<string | null>(null);
```

#### `onAccordionValueChange` method:
```typescript
/**
 * Handle accordion value change - only allow one province to be expanded at a time.
 * 
 * This implements the "single province open" UX requirement:
 * - When user expands a province, all other provinces are automatically closed
 * - Only the most recently selected province index is kept in expandedGroups
 * - Wards for the newly expanded province are lazy-loaded if not already loaded
 * - If all provinces are collapsed (empty values array), expandedGroups is cleared
 * 
 * @param value - Accordion value(s) from PrimeNG, can be number, string, array, or null
 */
protected onAccordionValueChange(value: ...) { ... }
```

**Priority:** Low (code is self-explanatory with current implementation)

---

### 3. Clarify Resolver Purpose ⚠️ Minor

**Current State:**
```typescript
/**
 * Resolver for ward list
 * Note: With the new route structure, wards are loaded lazily per province
 * This resolver is kept for backward compatibility but may not be used
 */
```

**Recommendation:**
Either:
1. **Remove the resolver** if it's truly not used
2. **Update documentation** to clarify exactly when/if it's still used
3. **Add TODO** with timeline for removal if keeping for compatibility

Example:
```typescript
/**
 * Ward List Resolver
 * 
 * @deprecated This resolver is not used in the new route structure
 * where wards are loaded lazily per province. It's kept for potential
 * future use cases (e.g., loading all wards for a specific route).
 * 
 * TODO: Remove in v2.0.0 if no use cases emerge
 */
```

**Priority:** Low (doesn't affect functionality)

---

## Priority Assessment

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Extract constants | Low | Low | P3 |
| Add JSDoc | Low | Low | P3 |
| Clarify resolver | Low | Low | P3 |

## Recommendation

**Current State:** ✅ Code is production-ready

**Action:** No immediate action required. These improvements can be included in:
- A future refactoring sprint
- When new features require touching these files
- When adding more map or ward management features

## Testing Impact

None. These are documentation and organization improvements that don't change functionality.

## Breaking Changes

None.
