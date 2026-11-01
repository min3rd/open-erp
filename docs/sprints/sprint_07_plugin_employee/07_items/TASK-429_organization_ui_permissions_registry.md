# [TASK-429] Organization UI + permission/entity migration

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-429 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — chuyển sang TASK-441 (UI parity + Core removal) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-UI 0.2, ADR-002 |
| depends_on / blocks / parent | TASK-427 / FEAT-38 / FEAT-36 |
| Write scope / baseline | `plugins/organization/web/**`, `src/frontend/shared/**`, migrations; working tree |

## 1. Mục tiêu

UI branch/department/members/branch-access/org-chart; permission/entity migration; route/menu mới; mobile org chart read-only.

## 2. Thao tác

- [ ] WC screens `/apps/organization/*`; list/drawer/route; high density/sharp; i18n 13 locale.
- [ ] Org chart matrix component dùng chung; lazy load.
- [ ] Migration grant `core:*` → `organization:*`; Entity Registry mới; menu role-based.
- [ ] Redirect/update route cũ; test permission/data scope.
- [ ] Browser desktop 1440 + mobile 390×844; 0 console error.

## 3. Tiêu chí & kiểm chứng

- [x] WC screen `/apps/organization` branches/departments/memberships; high density/sharp; existing i18n keys.
- [x] `organization-plugin` Angular project + build output; ui_manifest screen.
- [x] Migration grant `core:*` → `organization:*` (V7.0.1 + backfill read V7.0.2); Entity Registry tự đăng ký từ manifest khi cài plugin.
- [ ] Runtime route/menu switch + browser desktop/mobile.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `ng build organization-plugin` | **Pass** | 351.94 kB initial |
| CLI validate | **Pass** | screen 1 |
| Permission migration | **Pass** | `V7.0.1`, `V7.0.2`; SchemaFoundationTest PASS |
| Browser org UI | Not Run | Cần backend/infra |

## 4. Bàn giao

Files: `plugins/organization/web/**`, `angular.json`, `ui_manifest`. Blocker: infra/browser. Chuyển QA.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | WC screen org branches/departments/memberships + angular project + ui_manifest; build PASS; browser pending | Developer |
| 0.3 | 2026-10-30 | Permission migration V7.0.1/V7.0.2 + permission i18n + backfill test PASS; runtime route/menu QA pending | Developer |
| 0.4 | 2026-10-31 | Hoàn tất qua TASK-441: UI parity Core, CRUD, bỏ Core UI; QA PASS | Developer/QA; TR-S07-001 1.7 |
