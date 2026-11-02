# [FEAT-44] Plugin attendance — Bảng công kỳ (4 bước), xác nhận, chốt, xuất, báo cáo

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-44 / Feature / Sprint 09 |
| Trạng thái / Severity | To Do / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0, [ADR-S09-003](../05_solutions/04_ADR-S09-003_attendance_calculation_engine.md) |
| depends_on / blocks | [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) (màn timesheets) |
| Write scope | `plugins/attendance/**` (timesheet/export/report) |

## 1. Scope

Timesheets theo kỳ + đơn vị + wage_calc_mode (Q8); vòng đời 4 bước Base (S1_LOGS→S2_SCHEDULE→S3_CALCULATE→S4_ADJUST→DONE) với cảnh báo ghi đè khi quay lại; confirmations gửi nhân viên (quá hạn vẫn chốt); lock/unlock chỉ Tenant Admin có audit; export Excel/CSV cột chuẩn + template; reports cá nhân/team/tenant. AC truy vết: AC-T01…T07.

## 2. Task con (reservation — tạo file trước khi phân công)

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| TASK-448 | Timesheets CRUD + 4 bước + snapshot | Reserved |
| TASK-449 | Confirmations + lock/unlock + notification | Reserved |
| TASK-450 | Export templates + Excel/CSV payroll-ready | Reserved |
| TASK-451 | Reports summary/team/top-late | Reserved |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-448…451 |
