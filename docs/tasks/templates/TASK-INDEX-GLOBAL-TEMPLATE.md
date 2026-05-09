# TASK-INDEX (Global) - Mẫu Chuẩn

Sử dụng cho file: docs/tasks/TASK-INDEX.md

## Quy tắc đồng bộ

- Mọi task phải xuất hiện trong index global, index sprint và file task chi tiết.
- Task ID phải theo format: TASK-SPRINT-<NN>-<CLUSTER>-<NNN>
- File task phải theo format: docs/tasks/sprints/SPRINT-<NN>/<cluster>/TASK-SPRINT-<NN>-<CLUSTER>-<NNN>-<slug>.md

## Bảng theo dõi

| Task ID | Tiêu đề | Sprint | Cluster | Loại | Agent chính | Agent phối hợp | Người phụ trách | Trạng thái | Phụ thuộc | File task | Cập nhật lúc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-SPRINT-01-AUTH-001 | Login API | 01 | auth | Backend | Senior Backend Programmer | Technical Leader, Senior QA | - | ⬜ TODO | - | docs/tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-001-login-api.md | 2026-05-08 |
| TASK-SPRINT-01-AUTH-002 | Login UI | 01 | auth | Frontend | Senior Frontend Programmer | UI/UX Designer, Senior QA | - | ⬜ TODO | TASK-SPRINT-01-AUTH-001 | docs/tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-002-login-ui.md | 2026-05-08 |

## Tổng hợp nhanh theo trạng thái

- ⬜ TODO: <so-luong>
- 🔵 IN PROGRESS: <so-luong>
- 🟡 REVIEW: <so-luong>
- 🟢 DONE: <so-luong>
- 🔴 BLOCKED: <so-luong>
- ⏸️ HOLD: <so-luong>
