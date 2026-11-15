# [TASK-462] Attendance UI — phân trang bảng dữ liệu lớn & context menu chức năng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-462 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-14 / phản hồi chủ dự án: “nhiều chỗ dạng bảng chưa có phân trang, thiếu context menu chức năng” |
| depends_on / blocks / parent | TASK-460 / — / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/web/**` |

## 1. Mục tiêu

1. Bổ sung `<app-pagination>` (shared) cho các bảng có thể nhiều dòng:
   my logs, my requests, team attendance, admin logs, admin records, admin shifts,
   timesheet periods, timesheet employee summaries, leave balances, leave ledger,
   kiosk branches.
2. Bật context menu (right-click) dùng `ContextMenuService` shared cho các bảng:
   my requests, inbox requests, logs, shifts, records, timesheets, leave balances,
   leave ledger, kiosk branches, team, báo cáo, timesheet employee summary.
3. Hành động menu dùng handler sẵn có: copy, mở drawer, duyệt/từ chối, khóa/mở kỳ công,
   export CSV, cấp/điều chỉnh phép, copy/open/rotate kiosk link.
4. Không hardcode nhãn: dùng key i18n hiện có; không thêm dependency.

## 2. Kiểm chứng

- `npm run attendance:ui:build` PASS, 0 warning.
- Browser QA: bảng hiển thị footer phân trang; right-click mở context menu.
- Ảnh minh chứng: 04, 09, 10, 11, 13, 15, 21 và bộ ảnh role/context menu của TR-S09-003.
