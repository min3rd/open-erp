# Walkthrough - Sprint 1 Deliverables (TSK-1.7, BUG-1.8, BUG-1.11 & BUG-1.12)

## Changes Made

### Backend (`open-erp-services`)
- **TSK-1.7 (Regular User Login)**:
  - Added unit test cases for the `login` and `selectTenant` methods in [auth.service.spec.ts](../../open-erp-services/src/features/auth/auth.service.spec.ts), testing all logical branches (successful login with single/multiple tenants, invalid credentials, not activated account, unauthorized tenant access, selectTenant delegation).
  - Mocked the `bcrypt` module globally in the test file to avoid read-only properties modification errors (`TypeError: Cannot redefine property: compare`).

- **BUG-1.8 (Tenant Not Found on Login)**:
  - Updated `AuthService.activate` in [auth.service.ts](../../open-erp-services/src/features/auth/auth.service.ts) to query the database for the associated tenant and return the tenant's subdomain.
  - Modified `AuthController.activate` in [auth.controller.ts](../../open-erp-services/src/features/auth/auth.controller.ts) to return the subdomain in the API response payload under `data`.

- **BUG-1.11 (TypeScript Compilation Error)**:
  - Imported [SelectTenantDto](../../open-erp-services/src/features/auth/dto/select-tenant.dto.ts) and updated the type signature of `dto` in the `selectTenant` method inside [auth.service.ts](../../open-erp-services/src/features/auth/auth.service.ts). This resolves the TypeScript compilation error where `password?: string` (optional in the inline type) was not assignable to `password: string` (required in `LoginDto`).

### Frontend (`open-erp-web`)
- **BUG-1.8 (Dynamic Redirection)**:
  - Updated frontend `AuthService.activate` signature in [auth.service.ts](../../open-erp-web/src/app/core/services/auth.service.ts) to support the returned `data: { subdomain: string }` structure.
  - Refactored `ActivateComponent` redirect logic and `goToLogin()` method in [activate.component.ts](../../open-erp-web/src/app/features/auth/activate/activate.component.ts) to read the subdomain and construct absolute redirect paths (e.g. `http://company.localhost:4200/login` on local dev or `https://company.open-erp.9ms.io.vn/login` on production).

### Mobile Frontend (`open-erp-mobile`)
- **BUG-1.12 (Mobile Layout/Theme Issue)**:
  - Updated [global.scss](../../open-erp-mobile/src/global.scss) to import `@ionic/angular/css/palettes/dark.class.css` instead of system-based `dark.system.css`. This shifts Ionic components to class-based dark mode palette detection.
  - Updated [app.component.ts](../../open-erp-mobile/src/app/app.component.ts) to load the saved theme settings from `localStorage` on boot and apply both `dark` and `ion-palette-dark` classes to the root element.
  - Updated [login.page.ts](../../open-erp-mobile/src/app/auth/login/login.page.ts), [register.page.ts](../../open-erp-mobile/src/app/auth/register/register.page.ts), and [register-user.page.ts](../../open-erp-mobile/src/app/auth/register-user/register-user.page.ts) to toggle/apply both `dark` and `ion-palette-dark` classes to sync Ionic components styling with Tailwind CSS.

### Project Documentation
- Updated the Sprint 1 dashboard [README.md](../../docs/05_project_management/sprint_1/README.md) to mark **TSK-1.7**, **BUG-1.11**, and **BUG-1.12** as Completed.
- Created detailed bug resolution reports:
  - [bug_11_compile_error.md](../../docs/05_project_management/sprint_1/bugs/bug_11_compile_error.md)
  - [bug_12_mobile_theme_issue.md](../../docs/05_project_management/sprint_1/bugs/bug_12_mobile_theme_issue.md)

---

## What Was Tested

### Compilation and Build
- Validated clean TypeScript compilation of backend services.
- Validated successful build and bundling of the Angular web application workspace.

### Automated Tests
- Ran NestJS unit tests in `open-erp-services` with `npm test`, achieving 100% success rate with 27 passed tests:
  ```bash
  PASS src/app.controller.spec.ts
  PASS src/features/org/department.service.spec.ts
  PASS src/features/auth/auth.service.spec.ts
  Test Suites: 3 passed, 3 total
  Tests:       27 passed, 27 total
  ```

### Manual Verification
- Verified that activating the account on `localhost:4200/activate` successfully returns the subdomain.
- Verified that the browser is dynamically redirected to `http://company.localhost:4200/login` upon successful activation, solving the `TENANT_NOT_FOUND` login exception.
- Verified that the mobile dark/light mode toggle works cohesively, applying themes to both Ionic UI components and Tailwind custom views correctly without mixing colors.

