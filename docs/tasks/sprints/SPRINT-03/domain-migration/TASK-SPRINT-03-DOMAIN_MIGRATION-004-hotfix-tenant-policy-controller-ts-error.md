# TASK-SPRINT-03-DOMAIN_MIGRATION-004: Hotfix TypeScript error trong tenant-policy.controller.ts

**Trạng thái:** 🟡 REVIEW
**Loại:** Hotfix / Backend
**Sprint:** 03
**Cluster:** domain-migration
**Ưu tiên:** Cao — blocking Platform Service compile
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-001

---

## Mô tả lỗi

File `apps/platform-service/src/controllers/tenant-policy.controller.ts` gặp lỗi TypeScript khi compile do config `isolatedModules: true` và `emitDecoratorMetadata: true` trong tsconfig.

```
error TS1272: A type referenced in a decorated signature must be imported with
'import type' or a namespace import when 'isolatedModules' and
'emitDecoratorMetadata' are enabled.

Line 29: ): TenantPolicy {
Line 45: ): TenantPolicy {
```

**Nguyên nhân:** `TenantPolicy` là interface/type, được dùng làm kiểu trả về trong 2 method có decorator (`@Get`, `@Patch`). Với `isolatedModules`, TypeScript không thể resolve type-only import lẫn với value import cùng một `import {}` statement.

---

## Yêu cầu fix

### Đọc file trước khi sửa
`e:\Minh\open-erp\open-erp-backend\apps\platform-service\src\controllers\tenant-policy.controller.ts`

### Cách fix

**Tách import value và import type:**

Thay đổi phần import từ:
```typescript
import {
  JwtAuthGuard,
  TenantGuard,
  SkipTenantCheck,
  TenantPolicyService,
  UpdateTenantPolicyDto,
  TenantPolicy,
} from '@shared/authz';
```

Thành:
```typescript
import {
  JwtAuthGuard,
  TenantGuard,
  SkipTenantCheck,
  TenantPolicyService,
  UpdateTenantPolicyDto,
} from '@shared/authz';
import type { TenantPolicy } from '@shared/authz';
```

Không thay đổi bất kỳ logic nào khác trong file.

---

## Tiêu chí hoàn thành

- [x] File đã được sửa đúng (tách `import type`)
- [x] Chạy `npx tsc -p apps/platform-service/tsconfig.json --noEmit` → 0 errors
- [x] Chạy `npx jest --testPathPatterns="platform-service" --no-coverage` → tất cả tests vẫn PASS
- [x] Cập nhật trạng thái task → 🟡 REVIEW
- [x] Cập nhật `docs/tasks/sprints/SPRINT-03/TASK-INDEX.md` → task 004 = 🟡 REVIEW

---

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-08
**Files đã sửa:**
- `apps/platform-service/src/controllers/tenant-policy.controller.ts` — tách `TenantPolicy` sang `import type`

**Kết quả tsc:**
```
npx tsc -p apps/platform-service/tsconfig.json --noEmit
→ 0 errors (no output)
```

**Kết quả jest:**
```
PASS  apps/platform-service/test/catalog-item.service.spec.ts
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        2.581 s
```

**Ghi chú:**
- File tsconfig thực tế là `tsconfig.json` (không phải `tsconfig.app.json`).
- Jest flag mới là `--testPathPatterns` (thay `--testPathPattern`).
