# Walkthrough - Sprint 1 Deliverables (BUG-1.8)

## Changes Made

### Backend (`open-erp-services`)
- **BUG-1.8 (Tenant Not Found on Login)**:
  - Updated `AuthService.activate` in [auth.service.ts](../../open-erp-services/src/features/auth/auth.service.ts) to query the database for the associated tenant and return the tenant's subdomain.
  - Modified `AuthController.activate` in [auth.controller.ts](../../open-erp-services/src/features/auth/auth.controller.ts) to return the subdomain in the API response payload under `data`.

### Frontend (`open-erp-web`)
- **BUG-1.8 (Dynamic Redirection)**:
  - Updated frontend `AuthService.activate` signature in [auth.service.ts](../../open-erp-web/src/app/core/services/auth.service.ts) to support the returned `data: { subdomain: string }` structure.
  - Refactored `ActivateComponent` redirect logic and `goToLogin()` method in [activate.component.ts](../../open-erp-web/src/app/features/auth/activate/activate.component.ts) to read the subdomain and construct absolute redirect paths (e.g. `http://company.localhost:4200/login` on local dev or `https://company.open-erp.9ms.io.vn/login` on production).

### Project Documentation
- Added the **BUG-1.8** task to the Sprint 1 dashboard [README.md](../../docs/05_project_management/sprint_1/README.md).
- Created a detailed analysis and design documentation in [bug_08_tenant_not_found_on_login.md](../../docs/05_project_management/sprint_1/bug_08_tenant_not_found_on_login.md).

---

## What Was Tested

### Compilation and Build
- Validated clean TypeScript compilation of backend services.
- Validated successful build and bundling of the Angular web application workspace.

### Manual Verification
- Verified that activating the account on `localhost:4200/activate` successfully returns the subdomain.
- Verified that the browser is dynamically redirected to `http://company.localhost:4200/login` upon successful activation, solving the `TENANT_NOT_FOUND` login exception.
