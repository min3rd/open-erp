# [BUG-193] UI bảng công dùng model lệch DTO và dữ liệu mẫu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-193 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-192 / nghiệm thu bảng công / [TASK-467](TASK-467_attendance_timesheet_lifecycle.md) |
| Write scope | `attendance.model.ts`, `attendance.service.ts`, `attendance-screen.component.*` |

## 1. Hiện tượng

- Danh sách kỳ công hiển thị tên và ngày trống (`—`), trạng thái khóa sai.
- Panel chốt kỳ công ghi cứng **45 nhân sự**, **43/45 xác nhận**, 7 dòng EMP-001…007.
- Nút **Tạo kỳ công mới** không mở drawer; service gửi `{ name, period_start, period_end }` trong khi API cần `{ period_year, period_month, scope_type, wage_calc_mode }`.
- Màn duyệt đơn và kiosk dùng dữ liệu mẫu.

## 2. Nguyên nhân

`Timesheet`/`AttendanceRequest` interface lệch DTO backend; component giữ signal dữ liệu mẫu; `selectInboxRequest` dựng pipeline giả theo loại đơn.

## 3. Sửa đổi

- `AttendanceService` map DTO → view model cho `Timesheet` (`name`, `period_start`, `period_end`, `locked` từ `locked_at`) và `AttendanceRequest` (`code`, `response`, `subject_employee_*`, `created_at`).
- `timesheetEmployeeSummaries` chuyển thành `computed` từ `snapshot.employees`; số nhân sự và số xác nhận lấy từ snapshot + `GET /admin/timesheets/{id}/confirmations`.
- Thêm drawer tạo kỳ công (năm + tháng) gọi đúng contract.
- `selectInboxRequest` dựng timeline 2 bước từ dữ liệu đơn thật (`response`, `mapping_status`, `fallback_comment`), bỏ 390 dòng kịch bản mẫu.
- Kiosk admin gọi `GET /admin/devices`, bỏ 3 thiết bị mẫu.

## 4. Kiểm chứng

- Danh sách kỳ công hiển thị `10/2026`, `01/10/2026 ~ 31/10/2026`.
- Panel chốt hiển thị đúng 51 nhân sự.
- Tạo kỳ công qua drawer trả 200.
- Duyệt đơn hiển thị đúng ngày/lý do của đơn thật.
