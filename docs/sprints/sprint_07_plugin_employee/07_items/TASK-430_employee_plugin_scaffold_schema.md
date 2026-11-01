# [TASK-430] Employee plugin scaffold + schema

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-430 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (dev)** — schema/build/tests PASS; runtime migration pending |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / CONF 1.0, DES-DB 0.2 |
| depends_on / blocks / parent | FEAT-36/TASK-428 / TASK-431 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`; working tree |

## 1. Mục tiêu

Plugin `open-erp-employee` zero-DB, always-on; schema employee_profile/assignment/contract/reporting/history/change request/field config/approval config/document/onboarding/campaign/consent/privacy/outbox.

## 2. Thao tác

- [ ] Scaffold template 2.0; manifest always-on; permissions `employee:*`; platforms.
- [ ] Migration V1.0.0 theo DES-DB; btree_gist; exclusion/unique/index.
- [ ] Entity Registry `Employee`, `EmployeeAssignment`, `EmployeeReportingRelationship`, `EmployeeContract`, `EmployeeDocument`, `EmployeeChangeRequest`.
- [ ] Seed field config mặc định; outbox.
- [ ] Test schema/unique/overlap/tenant isolation; build plugin.

## 3. Tiêu chí & kiểm chứng

- [x] AC-01/03/05/21 schema; 16 entities, 23 permissions; assignment/reporting overlap guards.
- [x] Plugin build/test PASS; manifest validate PASS.
- [ ] Migration runtime trên PostgreSQL thật (Docker chưa chạy).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn -pl employee -am test` | **Pass** | 6 tests |
| CLI validate | **Pass** | id=employee, entities=16, permissions=23 |
| Migration runtime | Not Run | Docker/Postgres chưa chạy |

## 4. Bàn giao

Files: `plugins/employee/**` scaffold/schema. Chuyển TASK-431 (API).

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 1.0 | 2026-10-30 | Plugin employee scaffold/schema 16 entities; build/test/validate PASS; migration runtime pending | Developer |
