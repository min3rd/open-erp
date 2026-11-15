# [BUG-203] Lỗi runtime phát hiện khi QA toàn bộ màn hình

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-203 / Bug / Sprint 09 |
| Severity / trạng thái | **Critical–High / Fixed source, retest PASS** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / QA full-screen flow |
| depends_on / blocks / parent | BUG-200…202 / nghiệm thu / [TASK-460](TASK-460_attendance_web_screens.md) |
| Write scope | attendance resource/service/web, plugin bootstrap, unit tests |

## 1. Phát hiện

| # | Mức | Hiện tượng | Nguyên nhân | Sửa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Critical | Nhân viên bấm CHẤM VÀO/RA nhận 500/405, không ghi log | UI gọi `/attendance/punch` không tồn tại; backend có `/check-in`, `/check-out` | `AttendanceService.punch` gọi đúng endpoint, gửi `{gps:{lat,lng}}`, header `X-Client-Platform` |
| 2 | High | Vai trò STAFF mở plugin sinh 403 hàng loạt và 0 `console.error` không đạt | `loadInitialData` gọi toàn bộ API admin cho mọi vai trò | Lazy-load theo tab/quyền; STAFF chỉ tải self data |
| 3 | High | Duyệt đơn `ATTENDANCE_FIX` có `mapping_status=FAILED` | Mapping gửi `meta` dạng Map vào cột jsonb | Serialize JSON trước khi ghi; retest APPLIED |
| 4 | High | Duyệt đơn hiển thị UUID nhân viên thay vì tên | `RequestService.mapRequestRow` hardcode `subject_employee_name=""` | Resolve tên từ `attendance.employee_ref.list_all` |
| 5 | High | Lần đầu đăng nhập plugin hiện raw i18n key đến khi F5 | Dictionary nạp sau khi custom element render; app plugin không được host tick | Preload `vi/en` bằng HttpClient trước `customElements.define` + `detectChanges` |
| 6 | High | Nút khóa kỳ ở pipeline khóa ngay, bỏ qua lý do audit | `lockPeriodPipeline` gọi API trực tiếp | Mở drawer lý do, dùng `confirmLockTimesheet` |
| 7 | High | Nút mở Kiosk mở `/kiosk` → về trang đăng nhập | Core không có route công khai `/kiosk` | Prefix `/settings/apps/attendance/kiosk`; link thiết bị cũng map theo plugin route |
| 8 | High | `mvn test` 17 errors sau khi thêm audit/org resolver | Test cũ không inject dependency mới | Bổ sung stub audit/calculation/employee/org; **118/118 PASS** |
| 9 | Medium | Tenant cũ `review50` có toàn bộ plugin mặc định `NOT_INSTALLED`, mở attendance báo “Plugin không khả dụng” | Chưa backfill plugin mặc định cho tenant cũ | QA cài qua API tenant plugin; attendance/workflow ACTIVE; đề xuất backfill tự động |
| 10 | Medium | Activity/Kiosk/Workflow chưa có bộ lọc đầy đủ; Kiosk không có thiết bị seed | Chưa triển khai filter; dữ liệu QA chưa tạo thiết bị | Ghi nhận residual, không chặn luồng chính |

## 2. Kiểm chứng

- Check-in/check-out: log IN 08:20, OUT sau đó; UI hiện “Đã ghi nhận chấm công thành công”.
- STAFF: 3 tab, 0 lỗi console, không gọi API admin (chỉ `request-types` 200).
- 6 loại đơn: LEAVE, OVERTIME, ATTENDANCE_FIX, LATE_EARLY, BUSINESS_TRIP, SHIFT_SWAP tạo + duyệt; mapping APPLIED (sau sửa).
- Approval drawer hiện “Lê Tổng Giám Đốc”, duyệt xong hộp thư 1 → 0.
- i18n: lần đăng nhập đầu không còn raw key; 0 raw key 14 tab.
- Khoá kỳ: nút pipeline mở drawer lý do; API chặn khóa khi kỳ chưa `DONE` (`ATTENDANCE_TIMESHEET_NOT_DONE`).
- Kiosk route: hiện “KHÔNG CÓ QUYỀN TRUY CẬP KIOSK” đúng khi thiếu token.
- `mvn -f plugins/attendance/pom.xml test`: **118 tests, 0 failures, 0 errors**.
- `npm run qa:attendance-api`: **23/23 PASS**.
