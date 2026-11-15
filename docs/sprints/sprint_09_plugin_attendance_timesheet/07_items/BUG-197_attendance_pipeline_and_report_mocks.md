# [BUG-197] Panel chốt kỳ công và tab Công phòng ban/Báo cáo còn số liệu mẫu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-197 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-193 / nghiệm thu bảng công / [TASK-467](TASK-467_attendance_timesheet_lifecycle.md) |
| Write scope | `attendance-screen.component.*`, `AttendanceReportService`, i18n |

## 1. Hiện tượng

- Panel chốt kỳ công ghi cứng "4 ĐƠN", "3 LỖI", "2 KHIẾU NẠI", "45 nhân viên", "43/45", các dòng mô tả giả (quên quẹt 1 ca, quẹt ngoài bán kính 2 ca, trưởng phòng NS đã ký…).
- Nút "Xử lý" chỉ đổi state cục bộ, không gọi API.
- Tab Công phòng ban hiển thị 45/42/3/1/2 và cột `shift_name/check_in/status` không tồn tại trong DTO.
- Tab Báo cáo hiển thị 93.3% / 45 / 180h / 14d; bảng OT dùng cột `department_name/weekday_ot_hours` trong khi API trả theo nhân viên.
- Backend trả `by_department` và `department_name = "Kỹ thuật"` giả.

## 2. Sửa đổi

- `timesheetClosingChecklist` chuyển thành `computed` từ dữ liệu thật: số đơn PENDING theo loại, số record `needs_review`, số xác nhận/khiếu nại của kỳ công, bước hiện tại, trạng thái khóa.
- KPI đầu trang dùng `todaySummary` (báo cáo hôm nay) và `employeesList`; kỳ hiện tại lấy từ kỳ công đang chọn; bỏ seed nhân sự kiosk giả.
- Nút hành động nối đúng chức năng: mở tab Duyệt đơn, mở tab Công ngày, gửi yêu cầu xác nhận (`send-confirmations`), khóa kỳ công qua API.
- Tab Công phòng ban: KPI lấy từ báo cáo tổng hợp, bảng hiển thị `standard_days/actual_days/paid_leave_days/ot_hours/late_count`.
- Tab Báo cáo: KPI lấy từ `reports/summary`; bảng OT theo nhân viên (`full_name`, `ot_hours`, `ot_minutes`).
- Báo cáo dùng đúng kỳ của kỳ công đang chọn (`from`/`to`), có chống ghi đè bởi response cũ (seq guard).
- Backend bỏ `by_department` giả và `"Kỹ thuật"` hardcode.
- Bổ sung key i18n cho badge số lượng, trạng thái sẵn sàng, gợi ý audit và thông báo gửi xác nhận (13 ngôn ngữ web + plugin).

## 3. Kiểm chứng

- `GET /reports/summary` trả số thật; `by_department = []`.
- Panel chốt hiển thị đúng số đơn PENDING hiện có và số record cần rà soát.
- Không còn chuỗi tiếng Việt hardcode trong panel chốt.
