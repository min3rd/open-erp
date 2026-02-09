# Testing the Mobile Navigation Fix

## Quick Test Guide

### Prerequisites
Before testing, you need a running environment. Follow these steps:

#### 1. Backend Setup
```bash
cd /home/runner/work/open-erp/open-erp/open-erp-backend

# Install dependencies
npm i

# Start Docker containers for database
npm run docker:dev:up

# Seed database with test data
npm run db:seed:all --drop --confirm --org-count 100 --warehouse-count 100 --user-count 100 --seed-superadmin-password 123456aA@

# Start required backend services (in separate terminals)
npm run auth:dev      # Port 3001
npm run user:dev      # Port 3002
npm run config:dev    # Port 3004
# Add other services as needed
```

#### 2. Frontend Setup
```bash
cd /home/runner/work/open-erp/open-erp/open-erp-web

# Install dependencies
npm i

# Start the Angular application
npm start

# Application will be available at http://localhost:4200
```

### Testing Steps

#### Step 1: Login
1. Open browser and navigate to http://localhost:4200
2. Login with: `superadmin@example.com` / `123456aA@`
3. Navigate to Management section

#### Step 2: Test Desktop View (Before Resize)
1. Keep browser window at full width (>= 1024px)
2. Observe: Vertical sidebar on left with all navigation items
3. This is the `management-nav` component (desktop version)

Expected items (example):
- 👥 User Management
- 📦 Product Management
- 📁 Product Category
- 🏢 Organization Management
- 🏭 Warehouse Management
- 📊 Navigation Management
- ... (depends on user permissions)

#### Step 3: Test Mobile View (Main Test)
1. Resize browser window to < 1024px width
   - Or use browser DevTools: F12 → Device Toolbar (Ctrl+Shift+M)
   - Select a mobile device (e.g., iPhone 12, Pixel 5)
2. Observe: Horizontal tabs appear at the top
3. This is the `management-header-tabs` component (mobile version)

**BEFORE FIX:**
```
┌─────────────────────────────────┐
│  Management                     │
├─────────────────────────────────┤
│  [👥 User]                      │  ← Only one tab
└─────────────────────────────────┘
```

**AFTER FIX:**
```
┌────────────────────────────────────────────────┐
│  Management                                    │
├────────────────────────────────────────────────┤
│  [👥 User] [📦 Prod] [🏢 Org] [🏭 Ware] ...   │
│  ← scroll left/right →                        │
└────────────────────────────────────────────────┘
```

#### Step 4: Verify Navigation
1. Click each tab to navigate to different sections
2. Verify active tab is highlighted (blue bottom border)
3. Verify all tabs are tappable/clickable
4. If many tabs: verify horizontal scrolling works

#### Step 5: Test with Different Users (Optional)
1. Logout and login with users having different permissions
2. Verify only permitted navigation items appear
3. Test with user having minimal permissions (should show fewer tabs)

### Expected Behavior

✅ **Correct Behavior:**
- All navigation items visible on mobile (same as desktop)
- Active tab highlighted with blue border
- Icons displayed correctly
- Tabs scrollable horizontally if overflow
- Navigation respects user permissions
- Clicking tabs navigates to correct sections

❌ **Incorrect Behavior (Bug):**
- Only "User Management" tab visible
- Other sections not accessible on mobile
- User stuck with limited navigation

### Browser Testing

Test in multiple browsers:
- ✅ Chrome/Edge (Desktop)
- ✅ Chrome/Edge (Mobile Emulation)
- ✅ Firefox (Desktop)
- ✅ Firefox (Responsive Design Mode)
- ✅ Safari (Desktop)
- ✅ Safari (iOS Simulator)

### Developer Tools Testing

#### Chrome DevTools:
```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Select: Responsive or specific device
Dimensions: < 1024px width triggers mobile view
```

#### Firefox DevTools:
```
F12 → Responsive Design Mode (Ctrl+Shift+M)
Select: Responsive or specific device
Dimensions: < 1024px width triggers mobile view
```

### Viewport Breakpoint

The key breakpoint is defined in:
```typescript
// open-erp-web/src/app/private/modules/management/management.ts
private checkMobileView(): void {
  if (typeof window !== 'undefined') {
    this.isMobile.set(window.innerWidth < 1024);
  }
}
```

- **Desktop**: `width >= 1024px` → Shows `management-nav` (sidebar)
- **Mobile**: `width < 1024px` → Shows `management-header-tabs` (horizontal tabs)

### Network Tab Verification

Check that navigation is loaded from API:

1. Open DevTools → Network tab
2. Filter: XHR
3. Look for: `GET /v1/navigations/module/nav-management?format=tree`
4. Verify: Response contains all navigation items with user's permissions

Response example:
```json
{
  "data": {
    "item": {
      "items": [
        { "id": "user", "label": "User Management", "icon": "pi pi-users", ... },
        { "id": "product", "label": "Product Management", "icon": "pi pi-box", ... },
        ...
      ],
      "total": 10
    }
  }
}
```

### Console Verification

Check browser console (F12 → Console):
- ✅ No errors related to navigation
- ✅ No "Command execution not implemented" warnings (unless commands are configured)

### Accessibility Testing

Test keyboard navigation:
1. Use Tab key to navigate between tabs
2. Use Enter/Space to activate tabs
3. Use Arrow keys for navigation (if supported)
4. Verify screen reader announces active tab correctly

### Performance Testing

Check that the component:
- ✅ Loads quickly
- ✅ Doesn't cause layout shifts
- ✅ Smooth scrolling on mobile
- ✅ No memory leaks (subscriptions cleaned up on destroy)

## Common Issues & Solutions

### Issue: "No navigation items appear"
**Solution:** 
- Check backend services are running
- Check user has permissions
- Check browser console for API errors

### Issue: "Only one tab appears"
**Solution:** 
- Verify you pulled latest code with the fix
- Clear browser cache
- Check you're in mobile view (width < 1024px)

### Issue: "Tabs don't scroll"
**Solution:**
- Verify window width is < 1024px
- Check if there are enough items to overflow
- Test with more navigation items

### Issue: "Active tab not highlighted"
**Solution:**
- Check routerLinkActive is working
- Verify router navigation is successful
- Check CSS classes are applied

## Rollback (If Needed)

If the fix causes issues:

```bash
cd /home/runner/work/open-erp/open-erp
git checkout main
cd open-erp-web
npm start
```

Then report the issue with:
- Browser and version
- Window dimensions
- Console errors
- Network request failures
- Screenshots

## Success Criteria

The fix is successful if:
- ✅ Mobile view shows ALL navigation items (not just User)
- ✅ Same items as desktop view
- ✅ Navigation respects permissions
- ✅ Active state works correctly
- ✅ No console errors
- ✅ No regression on desktop view
- ✅ Unit tests pass
- ✅ No security vulnerabilities
