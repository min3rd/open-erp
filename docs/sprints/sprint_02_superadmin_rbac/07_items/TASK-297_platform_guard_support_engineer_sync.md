# [TASK-297] Đồng Bộ Guard Platform Web/Mobile Với Backend Cho SUPPORT_ENGINEER

- **Mã Công Việc**: TASK-297
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: backend `PlatformRoleRequiredFilter` cho phép cả `SUPER_ADMIN` lẫn `SUPPORT_ENGINEER` vào `/api/v1/platform/**`, nhưng `platformRoleGuard` Web/Mobile vẫn chỉ chấp nhận `SUPER_ADMIN` → SUPPORT_ENGINEER bị khóa khỏi portal (không đồng bộ với backend).
- Quyết định Solution Architect: cho phép cả 2 platform roles vào portal; `SUPPORT_ENGINEER` là **read-only** — ẩn/vô hiệu các hành động bị backend từ chối (impersonation, grant/disable/enable/revoke admin, khóa/mở khóa tenant/user, break-glass, cập nhật quota).
- Tài liệu thiết kế: [DES-02-UI](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md) §7.1.1; [SOL-01](../05_solutions/SOL-01_superadmin_architecture_and_security.md) §1.2.7; [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §3.12.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [x] Web: `platformRoleGuard` chấp nhận `SUPER_ADMIN`/`SUPPORT_ENGINEER` (claim `platform_role` + `groups` khớp); thêm `platformSuperAdminGuard` cho `/platform/admins`.
- [x] Web: `PlatformTopbar` hiển thị badge động theo vai trò, ẩn mục menu `Quản Trị Super Admin` với SUPPORT_ENGINEER.
- [x] Web: ẩn nút Hạn mức/Truy cập đại diện/Khóa-Mở khóa (Tenant list), Khóa-Mở khóa/Break-glass (User list) với SUPPORT_ENGINEER; bổ sung `AuthService.platformRole/isPlatformAdmin/isPlatformSuperAdmin`.
- [x] Mobile: `platform-role.guard.ts` + `jwt.util.ts` + `auth.service.ts` chấp nhận cả 2 vai trò; màn Emergency ẩn nút khóa/mở khóa và hiển thị nhãn read-only với SUPPORT_ENGINEER.
- [x] i18n vi/en parity 100% cho các key mới (badge vai trò, nhãn read-only Web/Mobile).
- [x] Cập nhật DES-02-UI §2.1, §6, §7.1.1, §7.2 ghi rõ quyết định đồng bộ.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [x] SUPPORT_ENGINEER vào được `/platform/tenants|users|health|audit-logs` (Web) và `/platform/emergency` (Mobile) nhưng không thấy hành động bị backend chặn.
- [x] `/platform/admins` vẫn chỉ SUPER_ADMIN (menu ẩn + route guard chặn).
- [x] i18n parity 100%; Web build PASS; Mobile build PASS; không chạm `src/backend`.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] QA dual-mode browser test (Web desktop + Mobile 390x844 emulation): SUPPORT_ENGINEER read-only, 0 console error.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-19)
- Web: `web/src/app/core/guards/platform-role.guard.ts` (+`platformSuperAdminGuard`), `core/services/auth.service.ts`, `features/platform/platform-topbar/*`, `features/platform/tenants/*`, `features/platform/users/*`, `app.routes.ts`; `npm run build` PASS.
- Mobile: `core/jwt.util.ts`, `core/auth.service.ts`, `core/guards/platform-role.guard.ts`, `pages/platform/emergency/*`; `npm run build` PASS.
- i18n: thêm `PLATFORM_ROLE_BADGE_SUPER_ADMIN`, `PLATFORM_ROLE_BADGE_SUPPORT_ENGINEER`, `PLATFORM_SUPPORT_READ_ONLY_HINT` (Web) và `PLATFORM_EMERGENCY_READ_ONLY_HINT` (Mobile) — parity vi/en 634/634 (Web), 441/441 (Mobile).
- Quyết định lock/unlock tenant: theo SOL-01 §1.2.7 và DES-API §3.x, SUPPORT_ENGINEER **không được** khóa/mở khóa tenant, không cập nhật quota, không break-glass → ẩn toàn bộ nhóm hành động này (khớp backend non-GET 403).
