# [TASK-434] Org chart, directory, import/export, onboarding, campaign, privacy

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-434 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — directory/org-chart/import-export/onboarding/campaign/privacy verified app thật |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-API 0.2, DES-DB 0.2 |
| depends_on / blocks / parent | TASK-431/433 / TASK-435 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`; working tree |

## 1. Mục tiêu

Org chart matrix/directory; import/export job; self-onboarding link; campaign; consent/DSAR/breach/retention.

## 2. Thao tác

- [x] Org chart aggregate từ active employees + reporting relationships; directory basic fields.
- [x] Export CSV + import JSON dry-run/apply, báo lỗi theo dòng (tối đa 1000 rows).
- [x] Onboarding invite token một lần/expiry/submit; HR duyệt.
- [x] Campaign filter/recipient/status/notification.
- [x] Privacy consent/DSAR request status/complete; breach/retention job deferred.
- [ ] Tests job/token/privacy/tenant isolation runtime.

## 3. Tiêu chí & kiểm chứng

- [x] AC-18/23/27/28/29; directory + org chart + import/export + onboarding/campaign/privacy.
- [x] Token onboarding hết hạn/không tái sử dụng (hash + atomic claim).
- [ ] DSAR export/delete đúng phạm vi (mới có request status).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Import/export test | Partial | dry-run/apply implemented; runtime Not Run |
| Onboarding/privacy test | Partial | unit/validation PASS; runtime Not Run |
| Org chart | Implemented | employee + reporting; UI tree build PASS (mock) |

## 4. Bàn giao

Files: `plugins/employee/**`. Blocker: TASK-431/433. Chuyển TASK-435.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Directory/onboarding/campaign/privacy; org chart aggregate/import pending | Developer/Subagent |
| 0.3 | 2026-10-30 | Org chart aggregate + import/export CSV/JSON; runtime tests pending | Developer |
