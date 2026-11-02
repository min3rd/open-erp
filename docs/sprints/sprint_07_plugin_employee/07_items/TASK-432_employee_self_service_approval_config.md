# [TASK-432] Employee self-service + approval + config

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-432 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — self/change-request/withdraw, approval config + multi-step chain verified app thật (E2E 12/12 + BUG-176 regression) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-11-02 / DES-API 0.2, DES-UI 0.2; TR-S07-001 1.18 |
| depends_on / blocks / parent | TASK-431 / TASK-435 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`; working tree |

## 1. Mục tiêu

Self-service `/employee/me`, allowlist tenant cấu hình, change request, duyệt nhiều cấp tuần tự, conflict/withdraw, audit.

## 2. Thao tác

- [x] Self endpoint resolve từ JWT; không nhận employee_id; mask sensitive.
- [x] Field config direct/approval; change request diff; state machine.
- [x] Approval config theo nhóm trường/phòng ban; step/approver; chặn self-approve; delegation/reminder deferred.
- [x] Conflict khi hồ sơ đổi; reject reason; notification; withdraw.
- [x] Tests chain/validation; runtime API verified app thật (E2E 4 role, BUG-176 regression chuỗi duyệt).

## 3. Tiêu chí & kiểm chứng

- [x] AC-06/07/08/09/25/26; error codes.
- [x] Không lộ hồ sơ người khác (self resolve từ JWT + ownership check).
- [x] Runtime API trên gateway + JWT thật (app thật E2E TR mục 2.3/2.6).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `ApprovalChainTest` | **Pass** | 5 tests: scope ưu tiên, step, fallback |
| `mvn -pl employee -am test` | **Pass** | 16 tests |
| IDOR/runtime API | **Pass** | App thật E2E 12/12 4 role (TR mục 2.3/8); BUG-176 regression chuỗi duyệt 2 bước |

## 4. Bàn giao

Files: `plugins/employee/**`. Blocker: TASK-431. Chuyển TASK-435.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Self/field config/single-step + withdraw + approval config/chain; tests PASS | Developer/Subagent |
| 0.3 | 2026-11-02 | Đồng bộ trạng thái stale: runtime API đã PASS theo TR 1.18 (app thật E2E + BUG-176 regression) — Done (QA) | Developer; TR-S07-001 1.18 |
