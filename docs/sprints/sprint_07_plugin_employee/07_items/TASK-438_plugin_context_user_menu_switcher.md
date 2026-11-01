# [TASK-438] PluginContext, user-menu slot & shared tenant switcher

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-438 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — switcher + employee contribution verified app thật 2 chiều |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / ADR-003 0.2, DES-UI 0.2 |
| depends_on / blocks / parent | TASK-437 / TASK-436 / FEAT-38 |
| Write scope / baseline | `src/frontend/shared/**`, `src/frontend/web/**`, `src/frontend/mobile/**`, `plugins/employee/web/**`; working tree |

## 1. Mục tiêu

Mở rộng `PluginContext` (`tenants`, `switchTenant`), slot `core.layout.user-menu.items`, shared `TenantSwitcherComponent`; employee contribution; clear cache/plugin/manifest.

## 2. Thao tác

- [x] Extend PluginContext/model + host Web/Mobile (`tenants`, `switchTenant`).
- [x] UserMenu slot + render contribution; fallback header action.
- [x] Employee WC user-menu item (`core.layout.user-menu.items`); guard unsaved chưa có (drawer đóng trước khi switch).
- [x] Host callback gọi TASK-437; replace session; full reload xóa cache/plugin/manifest.
- [ ] Browser desktop/mobile; 0 console error.

## 3. Tiêu chí & kiểm chứng

- [x] `PluginContext` thêm `tenants`, `switchTenant`; web host build context + reload.
- [x] Shared `TenantSwitcherComponent` + UserMenu, search/current/status, high density/sharp; mobile drawer.
- [x] Employee plugin user-menu contribution; browser QA PASS 2 chiều.
- [x] Auth switch runtime test.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run web:build` | **Pass** | 562.82 kB initial |
| `npm run mobile:build` | **Pass** | 997.26 kB initial |
| Plugin validate | **Pass** | employee contribution 1 |
| Browser switch test | **Pass** 2 chiều | [desktop_tenant_switcher.png](../08_testing/evidence/s07_qa_real/desktop_tenant_switcher.png), 0 console |

## 4. Bàn giao

Files: `plugin-host.model.ts`, `tenant-switcher.component.*`, `user-menu.*`, `topbar.*`, `auth.service.ts`, `plugin-context.service.ts`. Blocker: employee UI chưa xong; infra chưa chạy. Chuyển QA sau.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | PluginContext tenants/switch, shared TenantSwitcher, UserMenu/Topbar, AuthService switch; web build PASS; employee contribution/mobile pending | Developer |
| 0.3 | 2026-10-30 | Employee user-menu contribution, mobile drawer switcher + auth switch; web/mobile build PASS | Developer |
| 0.4 | 2026-10-30 | Browser switch 2 chiều PASS; tenant switch rate limit + audit; QA app thật | QA; TR-S07-001 1.5 |
