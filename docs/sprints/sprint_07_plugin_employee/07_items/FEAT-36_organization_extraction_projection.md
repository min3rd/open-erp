# [FEAT-36] Tách organization khỏi Core & scope projection

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-36 / Feature / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — cutover C6 hoàn tất 2026-11-01: Core projection-only, legacy org module/bảng/permission drop (V7.0.7), backend 254/254 PASS / 0.5 / 2026-11-01 |
| Owner / reviewer | Developer + Architect / QA |
| Đầu vào | [CONF-S07-001 1.0](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md), [ADR-S07-001](../05_solutions/02_ADR-S07-001_two_layer_assignment_projection.md), [ADR-S07-002](../05_solutions/03_ADR-S07-002_organization_extraction_cutover.md), [DES-DB-S07-001](../06_designs/db/01_DES-DB-S07-001_employee_organization_schema.md) |
| Đọc trước / đọc tiếp | Task con bên dưới |

## 1. Mục tiêu

Tách branch/department/access membership khỏi Core thành plugin `organization` always-on; Core đọc `core_user_scope` + manager edge + department closure; cutover big-bang có backup/rollback.

**In-scope:** plugin organization, schema/migration, API `/api/v1/org/*`, projection, cutover, quyền/entity mới, UI org.
**Out-scope:** employee HR assignment (FEAT-37), tenant switcher (FEAT-38), payroll.

## 2. AC & truy vết

| AC | Given/When/Then | Design | Test |
| :--- | :--- | :--- | :--- |
| AC-30 | Organization giữ branch/department + access membership; Core projection; non-employee membership | ADR-001/002, DES-DB | PASS — plugin CRUD app thật (TR 1.7/1.8) + projection tests |
| AC-31 | Big-bang backfill đủ, checksum khớp, rollback được | ADR-002, DES-DB | PASS — copy/verify PASS dev (TR 1.2); drop-legacy QA dev PASS (TR 1.14); V7.0.7 drop schema-wide; rollback = restore dump theo runbook |
| AC-32 | Namespace/quyền/entity mới; consumer migrate | ADR-002, DES-API | PASS — migration V7.0.1/V7.0.2 + V7.0.7 xóa permission cũ; UI redirect; backend 254/254 |
| AC-36 | Non-employee có access membership | ADR-001 | PASS — branch access CRUD app thật (TR 1.7) |
| AC-15 | Branch manager data scope đúng từ projection | DES-ARCH | PASS — `ScopeProjectionServiceTest` + branch scope app thật (TR 1.14) |

## 3. Task con

| ID/link | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| [TASK-426](TASK-426_organization_plugin_scaffold_schema_seed.md) | Developer | Design | `plugins/organization/**` | **Done (QA)** — scaffold/schema/bootstrap idempotent trên tenant thật |
| [TASK-427](TASK-427_organization_api_projection_outbox.md) | Developer | 426 | `plugins/organization/**` | **Done (QA)** — CRUD/outbox/projection sender + BUG-175 fixed |
| [TASK-428](TASK-428_core_projection_security_cutover.md) | Developer | 426/427 | `src/backend/**`, `scripts/**` | **Done (QA)** — cutover C6: projection-only, legacy drop, 254/254 test |
| [TASK-429](TASK-429_organization_ui_permissions_registry.md) | Developer | 427 | `plugins/organization/web/**`, migrations | **Done (QA)** — WC screen/permission migration + Core org UI removed |

## 4. Bàn giao

- Baseline: design 0.2 + cutover C6.
- Output: plugin build, API contract, projection rebuild, cutover script/migration, UI; QA đã verify app thật + 254/254 backend test.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo FEAT/TASK từ design approved; chưa code | Architect/PM; CONF 1.0 |
| 0.2 | 2026-10-30 | Organization plugin + projection + security fallback + WC | Developer |
| 0.3 | 2026-10-30 | Permission migration V7.0.1/V7.0.2, cutover script/runbook, projection test PASS | Developer |
| 0.4 | 2026-10-30 | Cutover copy/verify trên tenant dev PASS; BUG-169 reconcile code conflict | QA; TR-S07-001 1.2 |
| 0.5 | 2026-11-01 | Cutover C6 hoàn tất (V7.0.7, Core projection-only, xóa modules/organization); backend 254/254 PASS; tất cả AC PASS theo chỉ đạo hoàn tất deferred | Developer; TR-S07-001 1.17 |
