# [BUG-192] Danh sách kỳ công / báo cáo chỉ đọc 500 dòng đầu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-192 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-190 / bảng công thật / [TASK-467](TASK-467_attendance_timesheet_lifecycle.md) |
| Write scope | `PluginDataPager`, `TimesheetService`, `AttendanceReportService` |

## 1. Hiện tượng

Snapshot kỳ công và báo cáo chỉ tính một phần dữ liệu. Với 51 nhân sự × 22 ngày, `attendance.record.list_range` mặc định trả 500 dòng nên phần lớn record bị bỏ qua.

## 2. Nguyên nhân

Các service gọi `client.query(...)` một lần, không truyền `size` và không duyệt trang — vi phạm guardrail #25 (cấm cố định kích thước trang khi nạp danh mục/dữ liệu tenant).

## 3. Sửa đổi

- Thêm `PluginDataPager.listAll(client, queryId, params, pageSize)`: duyệt trang 0-based cho tới khi hết dữ liệu, có chặn 1000 trang.
- Áp dụng cho `attendance.record.list_range`, `attendance.employee_ref.list_all`, `attendance.log.list`, `attendance.assignment.list_by_date`, `attendance.shift.list` trong `AttendanceCalculationService`, `TimesheetService`, `AttendanceReportService`.

## 4. Kiểm chứng

- Snapshot kỳ công tháng 10/2026 có `total_employees = 51`.
- Báo cáo tổng hợp và báo cáo OT phản ánh toàn bộ record trong kỳ.
