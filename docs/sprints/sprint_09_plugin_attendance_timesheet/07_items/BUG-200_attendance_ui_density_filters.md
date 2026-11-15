# [BUG-200] Giao diện Chấm công tốn diện tích, thiếu lọc và trạng thái điều hướng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-200 / Bug (UI/UX) / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-193, TASK-469 / nghiệm thu UI / [TASK-460](TASK-460_attendance_web_screens.md) |
| Write scope | `plugins/attendance/web/src/app/*`, i18n web + plugin |

## 1. Hiện tượng

Khách hàng review chỉ ra 10 điểm: header/KPI luôn chiếm chỗ; tab xuống 2 hàng; “Đơn của tôi” không xem chi tiết/tiến trình/quá khứ; “Bảng công của tôi” không có dữ liệu quá khứ; Công phòng ban, Công ngày, Nhật ký, Ca làm việc, Quản lý nghỉ phép thiếu lọc; Bảng công kỳ trộn 2 bảng không liên quan; nút thêm ca bị dãn giữa màn hình; Công ngày hiện UID và giá trị rỗng.

## 2. Nguyên nhân

- Header dùng KPI 4 ô luôn mở, tab dùng `flex-wrap`.
- Các bảng đọc thẳng danh sách API không có computed lọc; chưa có route state cho bộ lọc.
- Màn Bảng công kỳ và Nghỉ phép gộp nhiều bảng trong một view.
- UI Công ngày/Nhật ký dùng sai tên field backend (`occurred_at`, `event_type`, `effective_in/out`, `worked_minutes`).
- Dòng hành động ca làm việc là sibling của tiêu đề trong `justify-between` nên bị đẩy ra giữa.

## 3. Sửa đổi

- Header gọn 2 hàng; KPI **mặc định thu gọn** sau nút “Tổng quan”, chỉ hiện cho quyền quản lý.
- Tab 1 hàng, `overflow-x-auto` + `whitespace-nowrap`, có scroll ngang.
- “Đơn của tôi”: lọc loại/trạng thái/khoảng ngày, phân trang, drawer chi tiết + timeline duyệt + payload.
- “Bảng công của tôi”: endpoint thật `/my-timesheets` + `/my-records`, tổng hợp công/giờ/OT/muộn tính từ bản ghi thật; đổi kỳ bằng dropdown.
- Công phòng ban: lọc tháng, phòng ban, tìm mã/tên.
- Bảng công kỳ: tách sub-tab `periods` / `detail`; kỳ có lọc năm/trạng thái/tìm; bảng nhân sự lọc phòng ban/tìm.
- Ca làm việc: nhóm nút về bên phải, lọc trạng thái/tìm; card gọn.
- Công ngày: map `effective_in/out`, `worked_minutes`, `ot_minutes`, `shift_name_snapshot`; hiện mã + tên; lọc ngày/tìm/cần rà soát.
- Nhật ký: lọc nguồn/khoảng ngày/tìm; hiện mã + tên + thiết bị.
- Nghỉ phép: tách sub-tab loại / số dư / sổ cái; lọc loại, loại biến động, tìm nhân sự.
- Đồng bộ bộ lọc và sub-tab lên URL (`rt/rs/rf/rto`, `tf/tto/td/tq`, `ty/ts/tq`, `ss/sq`, `work_date/rq/review`, `ls/lf/lto/lq`, `lv/lt/le/lq`) để F5/Back/Forward giữ trạng thái.

## 4. Kiểm chứng

- UI build PASS; `i18n:check:strict` 100% web 2386 keys.
- Deep link/F5: `admin/timesheets?sub=periods`, `sub=detail&id=...`, `admin/leave?lv=balances|ledger`, `requests?drawer=my-request&id=...`, `admin/records?work_date=2026-10-05` đều mở đúng view; tab strip 1 hàng, `scrollWidth 1731 > clientWidth 1015`.
- My timesheet hiển thị 22 bản ghi tháng 10/2026: 22d công, 199.8h, giờ vào/ra thật.
