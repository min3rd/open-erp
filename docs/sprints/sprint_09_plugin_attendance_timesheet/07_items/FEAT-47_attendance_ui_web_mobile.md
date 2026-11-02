# [FEAT-47] Plugin attendance — UI Web (WC screens) + Mobile Ionic

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-47 / Feature / Sprint 09 |
| Trạng thái / Severity | To Do / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) 1.0 APPROVED |
| depends_on / blocks | FEAT-43…46 (API sẵn sàng từng phần, làm song song theo màn) / — |
| Write scope | `plugins/attendance/web/**`, `plugins/attendance/mobile/**`, `plugins/attendance/plugin.json` (ui_manifest), `src/frontend/shared/**` (components mới) |

## 1. Scope

WC screens theo route map DES-UI (tổng quan self, kiosk fullscreen, đơn của tôi, team manager, approvals split-view, admin logs/shifts/records/requests/leave/timesheets 4 bước/confirmations/reports/devices); shared components (AttendanceStatusBadge, EmployeeDayGrid, RequestTimeline, LeaveBalanceCard, PeriodStepper, GpsIndicator); Mobile Ionic 5 tab (CONF Q15); i18n vi/en 100%; high-density + sharp + anti-modal. AC truy vết: AC-M01 + phần UI của AC-A/S/T/Đ.

## 2. Task con (reservation — tạo file trước khi phân công)

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| TASK-459 | Shared components + i18n vi/en + WC scaffold | Reserved |
| TASK-460 | Web screens self/manager/admin + kiosk | Reserved |
| TASK-461 | Mobile Ionic 5 tab + QA browser 2 chế độ | Reserved |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-459…461 |
