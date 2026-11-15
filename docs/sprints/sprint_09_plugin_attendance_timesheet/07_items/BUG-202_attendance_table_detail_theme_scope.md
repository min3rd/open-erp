# [BUG-202] Bảng dữ liệu thiếu sticky header, chi tiết ngữ cảnh, đồng bộ theme và phạm vi ca

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-202 / Bug (UI/UX + API) / Sprint 09 |
| Severity / trạng thái | **High / Fixed source, QA 23/23** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-200, BUG-201 / nghiệm thu UI / [TASK-460](TASK-460_attendance_web_screens.md) |
| Write scope | UI attendance, shared Date/Month field, plugin theme CSS, admin API, workflow host navigation |

## 1. Hiện tượng

1. Bảng hiển thị `dd/mm/yyyy` nhưng bộ lọc native hiển thị `mm/dd/yyyy`.
2. Menu chuột phải không có “Xem chi tiết”; click dòng không mở chi tiết.
3. Nền/màu plugin lệch core (plugin tự override `bg-surface` sang slate).
4. Công phòng ban không xem được bảng công một nhân sự.
5. Bảng công kỳ không xem được bảng công nhân sự trong kỳ.
6. Ca làm việc không cho biết áp dụng cho phòng/chi nhánh nào; phân ca hàng loạt không chọn được nhóm.
7. Đổi filter/trang không thấy bảng cập nhật hoặc loading; Nhật ký chỉ tải 100/2.113 dòng.
8. Báo cáo không có bộ lọc.
9. Tenant khác không có lối tạo quy trình từ Cấu hình Quy trình.
10. Bảng cuộn trôi mất header/footer thay vì chỉ cuộn phần dữ liệu.

## 2. Nguyên nhân

- Input `type=date/month` hiển thị theo locale trình duyệt (en-US).
- Context menu chỉ có copy/edit; dòng bảng không có handler click.
- `plugins/attendance/web/src/styles.css` hardcode `bg-surface`, `text-muted`, `label`, `th/td` sang slate, đè token core.
- Chưa có endpoint bảng công theo nhân sự cho quản trị.
- ShiftDefinition là catalog dùng chung; phạm vi thực tế nằm ở assignment nên UI không suy ra được phòng/chi nhánh.
- `/admin/logs` bị giới hạn `size=100` và UI phân trang client-side trên 100 dòng.
- Report tab dùng kỳ công đang chọn nhưng không có input lọc.
- Workflow plugin là app riêng; host chưa bind event `op:navigate`.
- Bảng dùng `overflow-x-auto` không giới hạn chiều cao, `<thead>` không sticky.

## 3. Sửa đổi

- Shared `DateFieldComponent` (`dd/mm/yyyy`) và `MonthFieldComponent` (`mm/yyyy`), model vẫn ISO/`yyyy-MM`; thay toàn bộ input ngày/tháng trong plugin.
- Thêm “Xem chi tiết” vào context menu và click dòng cho: đơn của tôi, công ngày, nhật ký, ca, kỳ công, nhân sự kỳ công, nghỉ phép.
- Drawer chi tiết: công ngày, lượt chấm công, bảng công nhân sự, ca làm việc, nghỉ phép.
- API mới: `GET /admin/employees` trả phòng ban + chi nhánh qua gRPC; `GET /admin/records/employee/{id}`; `GET /admin/shift-coverage?month=`.
- `OrgDirectoryService` cache thêm `branch_name`; coverage tổng hợp nhân sự/phòng ban/chi nhánh theo ca.
- Bulk assign nhận `employee_ids`; drawer lọc chi nhánh/phòng ban/tìm kiếm, chọn từng người hoặc tất cả, chặn khi chưa chọn.
- Card ca hiển thị “Đang áp dụng cho: N nhân sự” + phòng ban/chi nhánh theo tháng.
- Nhật ký tải toàn bộ theo trang 200 (tuần tự, có sequence guard) rồi lọc/phân trang client; loading overlay + thanh tiến trình.
- Báo cáo thêm lọc tháng từ/đến, phòng ban, tìm nhân sự; lọc áp dụng cho top muộn/OT và lưu URL.
- Nút “Tạo quy trình” mở workflow app qua `context.navigate` (fallback `op:navigate`); host bind `navigate`.
- Xóa override màu trong plugin CSS; dùng token core `bg-surface`, `text-ink`, `border-default`; primary dùng `--op-primary`.
- `.op-table-scroll`: giới hạn chiều cao, `overflow:auto`, `thead th` sticky, nền header theo token; pagination nằm ngoài vùng cuộn.

## 4. Kiểm chứng

- `npm run qa:attendance-api`: **23/23 PASS** (thêm directory, employee records, shift coverage, my timesheets/my records).
- UI: ô ngày `05/10/2026`, ô tháng `10/2026`; header sticky (`position: sticky`, `max-height: 574px`, `overflow-y: auto`).
- Menu chuột phải: “Xem chi tiết / Xem bảng công nhân sự / Sao chép / Chạy tính toán công”.
- Click dòng công ngày mở drawer đúng EMP/giờ vào-ra; click Công phòng ban mở 22 dòng tháng 10; click bảng kỳ công mở đúng kỳ.
- Ca HC: 51 nhân sự, 8 phòng ban, 1 chi nhánh; bulk drawer lọc “Kinh doanh” còn 6 người và chọn tất cả hoạt động.
- Báo cáo 10/2026: 94.1%, 51 nhân sự, 110 muộn; lọc phòng ban/tìm áp dụng ngay.
- Nhật ký: 2.113 bản ghi, chuyển trang thay đổi dữ liệu; nguồn `WEB` trả 0 đúng dữ liệu.
- 12 tab: 0 raw i18n key, 0 `console.error`; i18n 100%.
- Placeholder/sticky: 18 vùng bảng dữ liệu dùng `.op-table-scroll`, 2 bảng thuộc tính trong drawer không cần.
