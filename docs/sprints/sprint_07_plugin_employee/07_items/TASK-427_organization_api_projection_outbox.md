# [TASK-427] Organization API + projection outbox

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-427 / Task / Sprint 07 |
| Severity / trạng thái | Critical / **Done (QA)** — CRUD/outbox/projection sender hoàn tất; BUG-175 outbox JSON fixed; org CRUD app thật PASS (TR 1.7/1.8) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-API 0.2, ADR-001 |
| depends_on / blocks / parent | TASK-426 / TASK-428, TASK-429 / FEAT-36 |
| Write scope / baseline | `plugins/organization/**`; working tree |

## 1. Mục tiêu

API `/api/v1/org/*` cho branch/department/membership/branch-access/org-chart; outbox cập nhật Core projection; idempotent/retry.

## 2. Thao tác

- [x] Resource/DTO/service cho branch/department/membership/branch-access; 4 response templates.
- [x] Permission `organization:*`; data scope; validate branch/department, manager cycle, primary.
- [x] Outbox `MEMBERSHIP_UPSERTED/REMOVED`, `DEPARTMENT_TREE_CHANGED`; client gọi internal Core API.
- [x] Idempotency/version; retry/backoff; trạng thái lỗi (BUG-175 fixed — outbox payload JSON).
- [x] Test API + outbox + tenant isolation (app thật TR 1.7/1.8: org CRUD + branch access PASS).

## 3. Tiêu chí & kiểm chứng

- [x] AC-30/36; API contract chính; không trả message tiếng Việt.
- [x] Outbox rows `MEMBERSHIP_UPSERTED/REMOVED`, `DEPARTMENT_TREE_CHANGED`, `BRANCH_UPSERTED`; sender/retry qua TASK-428.
- [x] Validation code/status/date/primary/cycle; unit test validation PASS.
- [x] Tests API/outbox runtime với gateway thật (TR 1.7/1.8: admin_org_* PASS, 0 console error).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| CLI validate | **Pass** | `id=org-structure, entities=5, permissions=10` |
| `mvn -pl organization -am test` | **Pass** | HealthTest + OrganizationValidationTest |
| API/outbox gateway test | **Pass** | TR-S07-001 1.7/1.8 org CRUD app thật + BUG-175 fixed |

## 4. Bàn giao

Files: `plugins/organization/**` (DTO request, service CRUD/validation/outbox, resource endpoints, queries). Đã build/test/validate; chưa chạy API/outbox trên gateway. Blocker: TASK-428 projection sender/cutover. Chuyển TASK-428/429.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | CRUD branch/department/membership/branch-access, validation/cycle/primary, outbox rows; test/validate PASS; sender pending TASK-428 | Developer |
| 0.3 | 2026-11-01 | Đánh dấu Done (QA): CRUD app thật + BUG-175 fixed (TR 1.7/1.8); đồng bộ trạng thái stale | Developer/PM |
