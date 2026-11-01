# [TASK-426] Scaffold plugin organization + schema + seed

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-426 / Task / Sprint 07 |
| Severity / trạng thái | Critical / **Done (QA)** — scaffold/schema/build/validate PASS; bootstrap HQ + 8 phòng ban chạy thật cho tenant QA/minhvv (TR 1.7/1.8) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / CONF 1.0, ADR-002, DES-DB 0.2 |
| depends_on / blocks / parent | Design / TASK-427 / FEAT-36 |
| Write scope / baseline | `plugins/organization/**`, migration manifest; working tree |

## 1. Mục tiêu

Tạo plugin `open-erp-org-structure` (key `org-structure`; `organization` bị CLI reserve) zero-DB, always-on; schema `plg_organization_branches`, `plg_organization_departments`, `plg_organization_memberships`, `plg_organization_branch_access`, `plg_organization_outbox`; seed `HQ`/`GENERAL`; đăng ký Entity Registry.

## 2. Thao tác

- [x] Scaffold plugin theo template 2.0; `plugin.json` always-on, platforms, permissions `organization:*`.
- [x] Migration V1.0.0 tạo bảng/index/constraint theo DES-DB.
- [x] Seeder idempotent `HQ` + `GENERAL` + membership owner cho tenant (bootstrap `/internal/tenant/bootstrap`).
- [x] Entity Registry `OrgBranch`, `OrgDepartment`, `OrgMembership`, `OrgBranchAccess`.
- [x] Unit test schema/seed/tenant isolation; build plugin.

## 3. Tiêu chí & kiểm chứng

- [x] AC-30/36 schema đúng; tenant_id bắt buộc.
- [x] Seeder chạy 2 lần không trùng; tenant mới có HQ/GENERAL (bootstrap idempotent chạy trên tenant QA + minhvv).
- [x] Backend tests PostgreSQL thật, không H2.
- [x] Manifest validate offline PASS.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `node tools/open-erp-cli/bin/open-erp.js validate` | **Pass** | `plugin.json OK (id=org-structure, entities=4, permissions=10)` |
| `mvn -f plugins/pom.xml -pl organization -am test` | **Pass** | HealthTest PASS; build plugin PASS |
| Bootstrap 2 lần không trùng | **Pass** | TR-S07-001 1.7/1.8: tenant defaults 8 phòng + luồng duyệt 2 bước trên QA/minhvv |

## 4. Bàn giao

Files: `plugins/organization/**` (POM, plugin.json, migration, model/DTO/service/resource, health test, README); `plugins/pom.xml` module. Baseline: working tree 2026-10-30. Đã chạy build/test/validate; seed runtime chưa chạy. Blocker: TASK-427/428 gateway. Người nhận: Architect review schema; chuyển TASK-427.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task từ design approved; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Scaffold plugin org-structure, schema, model/DTO/service/resource, bootstrap endpoint; CLI validate + Maven test PASS; seed runtime pending | Developer |
| 0.3 | 2026-11-01 | Đánh dấu Done (QA): bootstrap idempotent xác nhận trên tenant thật (TR 1.7/1.8); đồng bộ trạng thái stale theo chỉ đạo hoàn tất deferred | Developer/PM |
