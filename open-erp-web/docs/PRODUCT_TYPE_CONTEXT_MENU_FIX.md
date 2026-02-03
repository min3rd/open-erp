# Context Menu Translation Fix

## Issue
Context menu was displaying translation keys (e.g., "productTypeList.actions.view") instead of the actual translated text.

![Context Menu Issue](https://github.com/user-attachments/assets/2ea2d1cc-6c1b-45a4-828e-e2142ab59972)

## Root Cause
Menu items were defined using `computed()` signals:

```typescript
protected readonly contextMenuItems = computed<MenuItem[]>(() => [
  {
    label: this.translocoService.translate('productTypeList.actions.view'),
    icon: 'pi pi-eye',
    command: () => this.onView(),
  },
  // ...
]);
```

**Problem**: The `computed()` function evaluates the translation once when the computed is created. When the language changes, the computed signal doesn't re-evaluate because it doesn't track changes to the translation service's internal state.

## Solution
Changed from `computed()` to getters, following the warehouse module pattern:

```typescript
protected get contextMenuItems(): MenuItem[] {
  return [
    {
      label: this.translocoService.translate('productTypeList.actions.view'),
      icon: 'pi pi-eye',
      command: () => this.onView(),
    },
    // ...
  ];
}
```

**Why this works**: Getters are re-evaluated every time they're accessed. Angular's change detection triggers when:
1. User changes language → TranslocoService state changes
2. Menu is shown → Template accesses the getter
3. Getter calls `translate()` → Returns current translation

## Changes Made (Commit 4042ab9)

### TypeScript (list.ts)
- ✅ Changed `actionMenuItems` from `computed()` to getter
- ✅ Changed `contextMenuItems` from `computed()` to getter  
- ✅ Changed `mobileMenuItems` from `computed()` to getter

### Template (list.html)
- ✅ Changed `[model]="actionMenuItems()"` to `[model]="actionMenuItems"`
- ✅ Changed `[model]="contextMenuItems()"` to `[model]="contextMenuItems"`
- ✅ Changed `[model]="mobileMenuItems()"` to `[model]="mobileMenuItems"`

## Verification

### Expected Behavior
1. **Desktop**: Right-click on any row → Menu shows translated labels
2. **Mobile**: Tap ellipsis button → Menu shows translated labels
3. **Language switching**: Change language → All menus update with new translations

### Translation Keys Used
```typescript
// Context menu
productTypeList.actions.view
productTypeList.actions.edit
productTypeList.actions.delete

// Action menu
productTypeList.actions.exportCSV
productTypeList.actions.bulkDelete

// Mobile menu
productTypeList.scope.all
productTypeList.scope.active
productTypeList.scope.inactive
```

### Translations Available
- **Vietnamese (vi)**: "Xem", "Chỉnh sửa", "Xóa", etc.
- **English (en)**: "View", "Edit", "Delete", etc.
- **Spanish (es)**: "Ver", "Editar", "Eliminar", etc.

## Pattern to Follow

### ✅ DO: Use getters for dynamic content
```typescript
protected get menuItems(): MenuItem[] {
  return [{
    label: this.translocoService.translate('key'),
    command: () => this.action()
  }];
}
```

### ❌ DON'T: Use computed() for translations
```typescript
protected readonly menuItems = computed<MenuItem[]>(() => [{
  label: this.translocoService.translate('key'), // Won't update!
  command: () => this.action()
}]);
```

### Why?
- **Getters**: Re-evaluated on every access → Always fresh translations
- **Computed**: Cached until dependencies change → Translation service is not tracked

## Related Files
- `list.ts`: Menu item definitions
- `list.html`: Menu component bindings
- `vi.json`, `en.json`, `es.json`: Translation files

## Consistency with Codebase
This fix aligns with the **warehouse module** pattern:
- `warehouse/list/list.ts` uses `get contextMenuItems()` 
- `warehouse/list/list.ts` uses `getRowMenuItems()` method
- Both ensure translations are always current

## Testing Checklist
- [x] Desktop context menu shows translations
- [x] Mobile row menu shows translations
- [x] Mobile hamburger menu shows translations
- [x] Action menu shows translations
- [x] Language switching updates all menus
- [x] TypeScript compilation succeeds
- [x] No runtime errors in console
