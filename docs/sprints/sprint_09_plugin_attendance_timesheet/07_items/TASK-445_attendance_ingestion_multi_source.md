# [TASK-445] Ingestion 5 nguồn: Web, Mobile GPS, Kiosk PIN, Import CSV, Core Push API

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-445 / Task / Sprint 09 |
| Severity / trạng thái | High / **Done (dev)** — Ingestion 5 nguồn + Core Push hoàn tất, 100% tests PASS |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-005](../05_solutions/06_ADR-S09-005_multi_source_log_ingestion.md), [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md), [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) 1.0 |
| depends_on / blocks / parent | TASK-443, TASK-444 / TASK-446, TASK-447 / [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope | `plugins/attendance/**`, `src/backend/**/modules/attendance/**` |

## 1. Mục tiêu

Hiện thực hóa toàn bộ 5 nguồn ghi nhận chấm công vào bảng append-only `plg_attendance_logs`:
1. **Web Self**: `POST /attendance/check-in`, `POST /attendance/check-out` có xác thực JWT, chặn check-in kép khi chưa check-out (`ATTENDANCE_ALREADY_CHECKED_IN`).
2. **Mobile GPS**: Tự động tính khoảng cách Haversine với chi nhánh (từ `plg_attendance_employee_refs` / branch coordinates). Nếu vượt bán kính `geofence_radius_m` (mặc định 200m), ghi cờ cảnh báo `geofence_warning = true` vào `meta`, không chặn chấm công.
3. **Kiosk PIN**: Quản lý thiết bị kiosk (`plg_attendance_devices`), xác thực mã NV + PIN hash (`POST /kiosks/{deviceCode}/authenticate`), cấp token session 5 phút, punch IN/OUT (`POST /kiosks/{deviceCode}/punch`), chống brute-force khóa tạm thiết bị sau 5 lần sai.
4. **Import CSV**: `POST /admin/logs/import` hỗ trợ định dạng BioTime/ZKTeco tiêu chuẩn, phân tích, khử trùng qua unique constraint máy, trả về báo cáo `{ total, inserted, skipped, errors }`.
5. **Core Push API**: Endpoint công khai tại Core `POST /api/v1/attendance-ingest/{deviceCode}` kiểm tra secret HMAC, timestamp lệch ≤ 5 phút, anti-replay nonce, rate limit, sau đó forward vào plugin attendance.
6. **Chấm hộ & Xóa log có kiểm toán**: `POST /admin/logs/on-behalf` (source `MANUAL`, `meta.entered_by` + lý do) và `DELETE /admin/logs/{id}` (soft-delete kèm `deleted_reason` bắt buộc).

## 2. Thao tác

- [x] Định nghĩa `AttendanceErrorCode` và các DTO liên quan đến logs & devices
- [x] Xây dựng `AttendanceLogRepository` & `AttendanceLogService`
- [x] Xây dựng Kiosk Authentication & Session Manager (KioskSecurityService)
- [x] Xây dựng CSV Importer cho BioTime / ZKTeco (CsvLogParser)
- [x] Xây dựng Core `AttendanceIngestResource` (HMAC secret, nonce, timestamp replay window)
- [x] Viết Unit & Integration Test kiểm chứng 5 nguồn

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Ingestion 5 nguồn về plg_attendance_logs | **Pass** | `AttendanceLogServiceTest` (11/11 tests pass) |
| Haversine Geofence Calculation | **Pass** | `GeofenceCalculatorTest` (5/5 tests pass) |
| Kiosk PIN & Brute-force Lockout | **Pass** | `KioskSecurityServiceTest` (5/5 tests pass) |
| BioTime / ZKTeco CSV Parser | **Pass** | `CsvLogParserTest` (4/4 tests pass) |
| Core Public Push API (Secret, Nonce, Skew) | **Pass** | `AttendanceIngestResourceTest` (4/4 tests pass) |
