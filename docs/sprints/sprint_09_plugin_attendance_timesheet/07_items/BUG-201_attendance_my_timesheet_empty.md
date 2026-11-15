# [BUG-201] “Bảng công của tôi” trống dù có dữ liệu chấm công quá khứ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-201 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source + data verified** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-198 / nghiệm thu self-service / [TASK-460](TASK-460_attendance_web_screens.md) |
| Write scope | `AttendanceResource`, `MyTimesheetResource`, `TimesheetService`, UI my timesheet |

## 1. Hiện tượng

Tab “Bảng công của tôi” không có bản ghi ngày/giờ dù Nhật ký chấm công và Công ngày của tenant có dữ liệu tháng 10/2026.

## 2. Nguyên nhân

- UI chỉ đọc `selectedTimesheet().snapshot` của kỳ đang chọn; snapshot cũ (0 công) không cập nhật sau khi tính lại bản ghi.
- `/my-records` chưa được triển khai (404) và `/my-schedule` trả danh sách rỗng.
- `/my-timesheets` chưa có, UI không liệt kê được kỳ quá khứ của nhân viên.
- Tài khoản review (`EMP-000`) chưa có log tháng 10 nên bản ghi toàn ABSENT.

## 3. Sửa đổi

- Thêm `GET /my-records`, `GET /my-schedule`, `GET /my-timesheets` trả dữ liệu thật theo nhân sự đang đăng nhập.
- `MyTimesheetResource` + `TimesheetService.listMyTimesheets` lọc kỳ có mặt nhân viên trong snapshot.
- UI chọn kỳ quá khứ, tải bản ghi ngày và tự tính công chuẩn/thực tế/giờ làm/OT/muộn từ bản ghi thay vì snapshot.
- Nạp log thật cho `EMP-000` tháng 10/2026 qua API import CSV (44 log) và tính lại 3 lát 10 ngày; không tạo dữ liệu qua migration.

## 4. Kiểm chứng

- API: `my-timesheets` 1 kỳ 10/2026; `my-records` 22 bản ghi; `my-schedule` 5 phân ca tuần đầu tháng.
- UI: 22 dòng có giờ vào 08:00 / ra 17:05, 9.1h/ngày; tổng 22d công, 199.8h; không còn trạng thái rỗng.
- `npm run qa:attendance-api`: 18/18 PASS sau thay đổi.
