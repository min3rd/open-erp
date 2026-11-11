# [TASK-460] Web Screens & Kiosk Mode (Angular WebComponent)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-460 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) §2 |
| depends_on / blocks / parent | TASK-459 / TASK-461 / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/web/**`, `plugins/attendance/plugin.json`, `src/frontend/web/angular.json` |

## 1. Mục tiêu

1. Khởi tạo cấu trúc WebComponent cho plugin Attendance tại `plugins/attendance/web/`.
2. Khai báo manifest UI trong `plugins/attendance/plugin.json` (`op-attendance-app`, `op-attendance-menu-item`).
3. Cấu hình build project `attendance-plugin` trong `src/frontend/web/angular.json` và build script trong `package.json`.
4. Triển khai các màn hình Web:
   - Self: Tổng quan chấm công (Punch IN/OUT, trạng thái ca, lịch sử 30 ngày, số dư phép).
   - Đơn từ: Nộp đơn mới (Drawer form), danh sách đơn cá nhân & timeline.
   - Quản lý (Manager): Công theo nhóm (Team Employee × Date grid), Duyệt đơn (Inbox split-view & fallback action).
   - HR Admin:
     - Log chấm công (bảng log, bộ lọc, import CSV drawer, xóa log).
     - Quản lý ca làm việc (Shift definitions CRUD drawer, ngày lễ, template tuần).
     - Công ngày (Daily records grid, override drawer, needs_review queue).
     - Cấu hình đơn từ & loại nghỉ phép (Leave types, adjustments, ledger history).
     - Bảng công kỳ 4 bước (S1_LOGS -> S2_SCHEDULE -> S3_CALCULATE -> S4_ADJUST -> DONE), theo dõi xác nhận & khóa kỳ.
     - Báo cáo chấm công (Summary metrics, Team breakdown, Top late, Overtime, Export CSV drawer).
     - Quản lý thiết bị Kiosk & Geofence.
   - Chế độ Kiosk fullscreen (bàn phím số PIN, punch IN/OUT độc lập).

