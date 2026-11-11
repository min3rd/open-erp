# [TASK-446] Engine tính công tích hợp: CalcJob, Hanging Check, Manual Override & OT Windows

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-446 / Task / Sprint 09 |
| Severity / trạng thái | High / **Done (dev)** — CalcJob + Hanging check + Override + OT hoàn tất, 100% test PASS |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-003](../05_solutions/04_ADR-S09-003_attendance_calculation_engine.md), [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0 |
| depends_on / blocks / parent | TASK-444, TASK-445 / TASK-447 / [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope | `plugins/attendance/src/main/java/**/service/**`, `plugins/attendance/src/main/java/**/job/**` |

## 1. Mục tiêu

Tích hợp engine thuần `ShiftResolver` và `AttendanceCalculator` vào quy trình chạy thực tế của hệ thống:
1. `AttendanceCalculationService`: tổng hợp log trong ngày của nhân viên, xác định ca làm việc theo thứ tự ưu tiên (assignment -> dept -> branch -> tenant -> default), kết hợp các khung giờ `plg_attendance_ot_windows` đã duyệt và ngày lễ `plg_attendance_holidays` để tính toán `plg_attendance_records`.
2. Bảo toàn can thiệp thủ công: Bỏ qua không tính đè nếu bản ghi có `is_override = true` (BR-A05).
3. Phát hiện Check-in treo (Hanging Check): Quét các log `IN` quá ngưỡng `hanging_threshold_hours` (mặc định 16h) mà không có log `OUT`, tự động gắn cờ `needs_review = true`, `review_note = "HANGING_CHECK_IN"` và ghi vào bảng `plg_attendance_hanging_checks`.
4. Idempotency: Có thể kích hoạt tính toán lại nhiều lần cho một khoảng ngày mà không gây sai lệch dữ liệu.
5. Phát hành sự kiện Outbox: Đẩy sự kiện `attendance.record.needs_review` vào `plg_attendance_outbox` khi phát hiện bản ghi cần duyệt.

## 2. Thao tác

- [x] Xây dựng `AttendanceCalculationService` tích hợp pure engines
- [x] Xây dựng cơ chế phát hiện check-in treo (`checkHangingPunch` > 16h)
- [x] Xây dựng cơ chế bảo toàn `is_override = true` (BR-A05) và áp dụng `ot_windows`
- [x] Xây dựng Outbox event publisher cho `attendance.record.needs_review`
- [x] Viết Unit Test kiểm thử quy trình tính toán

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Normal day calculation (PRESENT, worked_minutes) | **Pass** | `AttendanceCalculationServiceTest` |
| Manual override preservation (BR-A05) | **Pass** | `AttendanceCalculationServiceTest.manualOverrideIsPreserved` |
| Hanging check detection (> 16h) | **Pass** | `AttendanceCalculationServiceTest.hangingCheckInMarksReview` |
| Approved OT window calculation | **Pass** | `AttendanceCalculationServiceTest.approvedOvertimeWindowCredited` |
| Outbox event publication | **Pass** | `attendance.record.needs_review` payload verified |
