# [TASK-452] RequestTypes seed + Requests CRUD + validation

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-452 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-002](../05_solutions/03_ADR-S09-002_request_forms_on_form_workflow.md) 1.0, [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §6 |
| depends_on / blocks / parent | FEAT-44 / TASK-453 / [FEAT-45](FEAT-45_attendance_request_forms.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. Seed 6 loại đơn chuẩn (`LEAVE`, `OVERTIME`, `ATTENDANCE_FIX`, `LATE_EARLY`, `BUSINESS_TRIP`, `SHIFT_SWAP`) với `is_system=true`, `window_days`.
2. Hỗ trợ Tenant tạo loại đơn tùy chỉnh (mã có tiền tố `X_`, cấm xóa/đổi `is_system` của đơn hệ thống -> 400 `ATTENDANCE_REQUEST_TYPE_IMMUTABLE`).
3. Nộp đơn `POST /requests`: kiểm tra ngày lùi không quá `window_days` (400 `ATTENDANCE_REQUEST_WINDOW_EXCEEDED`), kiểm tra kỳ công chưa bị khóa (400 `ATTENDANCE_PERIOD_LOCKED`), kiểm tra số dư phép nếu là đơn `LEAVE` (400 `ATTENDANCE_INSUFFICIENT_LEAVE_BALANCE`).
4. Xem danh sách đơn của tôi `GET /my-requests` và chi tiết đơn `GET /requests/{id}`.

