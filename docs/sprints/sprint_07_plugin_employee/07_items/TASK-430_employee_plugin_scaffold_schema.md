# [TASK-430] Employee plugin scaffold + schema

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-430 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — schema/build/tests PASS; migration employee đã apply runtime PostgreSQL thật theo plugin lifecycle 7 bước (TR mục 2.6) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-11-02 / CONF 1.0, DES-DB 0.2; TR-S07-001 1.18 |
| depends_on / blocks / parent | FEAT-36/TASK-428 / TASK-431 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`; working tree |

## 1. Mục tiêu

Plugin `open-erp-employee` zero-DB, always-on; schema employee_profile/assignment/contract/reporting/history/change request/field config/approval config/document/onboarding/campaign/consent/privacy/outbox.

## 2. Thao tác

- [x] Scaffold template 2.0; manifest always-on; permissions `employee:*`; platforms.
- [x] Migration V1.0.0 theo DES-DB; btree_gist; exclusion/unique/index.
- [x] Entity Registry `Employee`, `EmployeeAssignment`, `EmployeeReportingRelationship`, `EmployeeContract`, `EmployeeDocument`, `EmployeeChangeRequest`.
- [x] Seed field config mặc định; outbox.
- [x] Test schema/unique/overlap/tenant isolation; build plugin.

## 3. Tiêu chí & kiểm chứng

- [x] AC-01/03/05/21 schema; 16 entities, 23 permissions; assignment/reporting overlap guards.
- [x] Plugin build/test PASS; manifest validate PASS.
- [x] Migration runtime trên PostgreSQL thật (plugin lifecycle 7 bước khi upgrade 1.1.22).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn -pl employee -am test` | **Pass** | 6 tests |
| CLI validate | **Pass** | id=employee, entities=16, permissions=23 |
| Migration runtime | **Pass** | TR-S07-001 mục 2.6: upgrade tenant QA 7 bước OK (TC-40.2) sau cutover C6 |

## 4. Bàn giao

Files: `plugins/employee/**` scaffold/schema. Chuyển TASK-431 (API).

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 1.0 | 2026-10-30 | Plugin employee scaffold/schema 16 entities; build/test/validate PASS; migration runtime pending | Developer |
| 1.1 | 2026-11-02 | Đồng bộ trạng thái stale: migration runtime đã PASS theo TR mục 2.6 (upgrade 7 bước) — Done (QA) | Developer; TR-S07-001 1.18 |
