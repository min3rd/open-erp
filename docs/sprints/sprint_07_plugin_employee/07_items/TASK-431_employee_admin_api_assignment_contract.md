# [TASK-431] Employee admin API: profile, assignment, contract, offboarding

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-431 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — admin API + last-admin/owner/platform guard verified app thật |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-API 0.2, ADR-001 |
| depends_on / blocks / parent | TASK-430 / TASK-432/434/435 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`; working tree |

## 1. Mục tiêu

API quản trị nhân viên: CRUD profile, link/unlink user, assignment effective-dated, contract, reporting relationship, history, offboarding guard.

## 2. Thao tác

- [x] DTO/service/resource; 4 response templates; permission/data scope.
- [x] Validate code unique, user member, branch/department, manager cycle, assignment overlap.
- [x] Sync access membership sang organization; outbox/projection; `scope_sync_status`.
- [x] Offboarding subordinates guard + exit date/reason; auto archive; last owner/admin/platform-role guard qua Core internal API.
- [x] Tests validation/chain + `InternalEmployeeGovernanceResourceTest` 3/3; runtime API test với gateway chưa chạy.

## 3. Tiêu chí & kiểm chứng

- [x] Profile CRUD, assignment, link/unlink, offboard, contract, reporting APIs; tests PASS.
- [x] Last-owner/admin/platform-role offboarding guard (`/api/v1/internal/employees/{id}/offboarding-check`).
- [x] Runtime API test với gateway.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn -pl employee -am test` | **Pass** | 18 tests |
| Link/unlink endpoints | Implemented | `employee.link_user` query |
| Offboard/contract/reporting | **Pass** | endpoints + descriptors; runtime PASS 2026-10-31 |
| Governance guard | **Pass** | `InternalEmployeeGovernanceResourceTest` 3/3 |
| Assignment/contract runtime | **Pass** | tạo/sửa qua app thật; UI TASK-439 |

## 4. Bàn giao

Files: employee service/resource/manifest. Blocker: last-owner/platform offboarding guard; gateway runtime chưa test.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Profile/assignment/link/unlink; tests PASS; offboard/contract/reporting pending | Developer |
| 0.3 | 2026-10-30 | Offboard, contract, reporting, documents metadata/binary; 16 tests PASS; last-owner guard pending | Developer |
| 0.4 | 2026-10-30 | Last owner/admin/platform guard + Core internal check + 3 tests; runtime gateway pending | Developer |
| 0.5 | 2026-10-31 | Runtime app thật PASS; UI phân công/hợp đồng tại TASK-439; 18 tests | QA; TR-S07-001 1.6 |
