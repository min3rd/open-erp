# [FEAT-47] Plugin attendance — UI Web (WC screens) + Mobile Ionic

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-47 / Feature / Sprint 09 |
| Trạng thái / Severity | Done / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) 1.0 APPROVED |
| depends_on / blocks | FEAT-43…46 / — |
| Write scope | `plugins/attendance/web/**`, `plugins/attendance/plugin.json`, `src/frontend/shared/**` |

## 1. Scope

WC screens theo route map DES-UI (tổng quan self, kiosk fullscreen, đơn của tôi, team manager, approvals split-view, admin logs/shifts/records/requests/leave/timesheets 4 bước/confirmations/reports/devices); shared components (AttendanceStatusBadge, LeaveBalanceCard, PeriodStepper, GpsIndicator, RequestTimeline); Mobile Ionic 5 tab (CONF Q15); i18n vi/en 100%; high-density + sharp + anti-modal. AC truy vết: AC-M01 + phần UI của AC-A/S/T/Đ.

## 2. Task con

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| [TASK-459](TASK-459_attendance_shared_components_i18n.md) | Shared components + i18n vi/en + 13 locales parity | Done |
| [TASK-460](TASK-460_attendance_web_screens.md) | Web screens self/manager/admin + kiosk | Done |
| [TASK-461](TASK-461_attendance_mobile_dual_mode_qa.md) | Mobile Ionic 5 tab + QA browser 2 chế độ | Done |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-459…461 |
