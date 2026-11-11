# [TASK-455] Hộp thư duyệt đơn (Inbox) + Timeline quá trình xử lý

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-455 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §6 |
| depends_on / blocks / parent | TASK-454 / FEAT-47 / [FEAT-45](FEAT-45_attendance_request_forms.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. API `GET /requests/inbox`: Danh sách các đơn chờ người dùng hiện tại phê duyệt (theo phân quyền quản lý hoặc HR).
2. Chi tiết đơn `GET /requests/{id}`: Trả về trạng thái, dữ liệu form đã nộp, tiến trình duyệt (timeline), và kết quả mapping.

