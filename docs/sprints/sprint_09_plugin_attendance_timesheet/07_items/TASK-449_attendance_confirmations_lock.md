# [TASK-449] Gửi xác nhận nhân viên + Khóa/Mở khóa bảng công + Notification

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-449 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md), [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §8 |
| depends_on / blocks / parent | TASK-448 / TASK-450 / [FEAT-44](FEAT-44_attendance_timesheets.md) |
| Write scope | `plugins/attendance/src/main/java/**` |

## 1. Mục tiêu

1. **Gửi xác nhận (Send Confirmations)**: `POST /admin/timesheets/{id}/send-confirmations`. Tạo bản ghi `plg_attendance_timesheet_confirmations` cho toàn bộ nhân viên trong phạm vi bảng công, trạng thái `PENDING`.
2. **Nhân viên phản hồi (Employee Response)**: `POST /confirmations/{id}` nhận `action: CONFIRM | REJECT` kèm `comment` phản hồi.
3. **Khóa bảng công (Lock Timesheet)**: `POST /admin/timesheets/{id}/lock` (yêu cầu quyền `attendance:timesheet:lock`). Chốt bảng công (kể cả nhân viên chưa xác nhận - đánh dấu là quá hạn). Khóa toàn bộ bản ghi `plg_attendance_records` bằng cách gán `timesheet_id`. Phát hành sự kiện outbox `attendance.timesheet.locked`.
4. **Mở khóa bảng công (Unlock Timesheet)**: `POST /admin/timesheets/{id}/unlock` chỉ Tenant Admin được phép thực hiện, bắt buộc có lý do mở khóa `reason`. Ghi nhận audit `unlocked_at, unlocked_by, unlock_reason`.
