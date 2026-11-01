# [FEAT-38] Tenant switcher trên user menu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-38 / Feature / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — switcher web/mobile + employee contribution; app thật switch 2 chiều + unsaved guard PASS / 0.5 / 2026-11-01 |
| Owner / reviewer | Developer + Architect / QA |
| Đầu vào | [CONF-S07-001 1.0](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) (Q47–Q52), [ADR-S07-003](../05_solutions/04_ADR-S07-003_tenant_switcher_header.md), [DES-API](../06_designs/api/01_DES-API-S07-001_employee_organization_auth_api.md), [DES-UI](../06_designs/ui/01_DES-UI-S07-001_employee_organization_ui.md) |
| Đọc trước / đọc tiếp | Task con bên dưới |

## 1. Mục tiêu

Chuyển tenant đang làm việc từ user menu: UI contribution của employee, auth/session ở Core; thu hồi session cũ, clear cache/plugin/manifest, reload dữ liệu.

**In-scope:** endpoint switch, tenant list, PluginContext, user-menu slot, shared component, cache invalidation, mobile.
**Out-scope:** multi-tab nhiều tenant session; HR duyệt mobile.

## 2. AC & truy vết

| AC | Nội dung | Design | Test |
| :--- | :--- | :--- | :--- |
| AC-33 | Switch validate membership, cấp token mới, revoke session cũ | ADR-003/DES-API | PASS — `AuthResourceApiTest` + app thật |
| AC-34 | Clear cache/tenant state/plugin/manifest; employee reload | ADR-003/DES-UI | PASS — full reload, app thật |
| AC-35 | User menu item, guarded unsaved, a11y, single-tenant hide | DES-UI | PASS — switcher/contribution PASS; unsaved guard PASS app thật (TR 1.13) |
| AC-19 | Mobile switcher/390×844 | DES-UI | PASS — Ionic 390×844 |

## 3. Task con

| ID/link | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| [TASK-437](TASK-437_auth_switch_tenant_endpoint.md) | Developer | Design | `src/backend/**` | **Done (QA)** — endpoint/me tenants/revoke + test |
| [TASK-438](TASK-438_plugin_context_user_menu_switcher.md) | Developer | 437 | `src/frontend/shared/**`, `plugins/employee/web/**` | **Done (QA)** — shared switcher + employee contribution + mobile |

## 4. Bàn giao

- Baseline: design 0.2; auth hiện có select-tenant.
- Output: endpoint, tenant list, context callback, user-menu slot, shared component, cache clear.
- Chưa chạy test; QA session/tenant isolation sau implementation.
- Blocker: TASK-438 cần TASK-437; employee header contribution từ FEAT-37.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo FEAT/TASK từ design approved; chưa code | Architect/PM; CONF 1.0 |
| 0.2 | 2026-10-30 | Endpoint + shared switcher/UserMenu | Developer |
| 0.3 | 2026-10-30 | Auth test PASS, employee contribution + mobile switcher, builds PASS; browser pending | Developer |
| 0.4 | 2026-10-30 | App thật switch 2 chiều PASS; BUG-164 refresh/mapping resolved | QA; TR-S07-001 1.2 |
| 0.5 | 2026-11-01 | AC-35 chuyển PASS theo TR 1.13 (unsaved guard); TASK-437/438 Done (QA) | Developer; TR-S07-001 1.17 |
