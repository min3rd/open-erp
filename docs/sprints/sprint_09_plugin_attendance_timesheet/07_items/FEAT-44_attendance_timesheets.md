# [FEAT-44] Plugin attendance — Bảng công kỳ (4 bước), xác nhận, chốt, xuất, báo cáo

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-44 / Feature / Sprint 09 |
| Trạng thái / Severity | Done / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0, [ADR-S09-003](../05_solutions/04_ADR-S09-003_attendance_calculation_engine.md) |
| depends_on / blocks | [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) (màn timesheets) |
| Write scope | `plugins/attendance/**` (timesheet/export/report) |

## 1. Scope

Timesheets theo kỳ + đơn vị + wage_calc_mode (Q8); vòng đời 4 bước Base (S1_LOGS→S2_SCHEDULE→S3_CALCULATE→S4_ADJUST→DONE) với cảnh báo ghi đè khi quay lại; confirmations gửi nhân viên (quá hạn vẫn chốt); lock/unlock chỉ Tenant Admin có audit; export Excel/CSV cột chuẩn + template; reports cá nhân/team/tenant. AC truy vết: AC-T01…T07.

## 2. Task con

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| [TASK-448](TASK-448_attendance_timesheet_lifecycle.md) | Timesheets CRUD + 4 bước + snapshot | Done |
| [TASK-449](TASK-449_attendance_confirmations_lock.md) | Confirmations + lock/unlock + notification | Done |
| [TASK-450](TASK-450_attendance_export_payroll.md) | Export templates + Excel/CSV payroll-ready | Done |
| [TASK-451](TASK-451_attendance_reports.md) | Reports summary/team/top-late | Done |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 1.0 | 2026-11-11 | Hoàn tất hiện thực FEAT-44 (TASK-448..451) + 100/100 test PASS |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-448…451 |
