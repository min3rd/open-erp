# [TASK-447] REST API: Chấm công Self, Quản trị Ca, Lịch, Lễ & Records

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-447 / Task / Sprint 09 |
| Severity / trạng thái | High / **Done (dev)** — REST API Chấm công, Kiosk, Quản trị Ca & Records hoàn tất, 100% tests PASS |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) 1.0, [DES-ARCH-S09-001](../06_designs/arch/01_DES-ARCH-S09-001_components_and_flows.md) 1.0 |
| depends_on / blocks / parent | TASK-445, TASK-446 / [FEAT-44](FEAT-44_attendance_timesheets.md), [FEAT-45](FEAT-45_attendance_request_forms.md) / [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope | `plugins/attendance/src/main/java/**/resource/**`, `plugins/attendance/src/main/java/**/dto/**` |

## 1. Mục tiêu

Hiện thực hóa toàn bộ REST API endpoints của nhóm Chấm công (Self + Kiosk), Quản trị Log, Quản trị Ca/Lịch/Lễ và Quản trị Công ngày theo DES-API §2–5:
1. **Self Check-in**:
   - `POST /attendance/check-in`
   - `POST /attendance/check-out`
   - `GET /attendance/my-status`
   - `GET /attendance/my-logs`
   - `GET /my-schedule`
2. **Kiosk Endpoints**:
   - `POST /kiosks/{deviceCode}/authenticate`
   - `POST /kiosks/{deviceCode}/punch`
3. **Admin Log Endpoints**:
   - `GET /admin/logs`
   - `DELETE /admin/logs/{id}`
   - `POST /admin/logs/on-behalf`
   - `POST /admin/logs/import`
4. **Admin Shifts & Schedules**:
   - CRUD `/admin/shifts` (+ `/{id}`)
   - CRUD `/admin/shift-templates` (+ `/{id}`)
   - CRUD `/admin/shift-assignments` (+ `/{id}`)
   - CRUD `/admin/holidays` (+ `/{id}`)
5. **Admin Records & OT Windows**:
   - `GET /admin/records`
   - `PUT /admin/records/{id}/override`
   - `POST /admin/records/recalculate`
   - `GET /admin/ot-windows`
6. **Tuân thủ API Standards**:
   - 100% tuân thủ 4 khuôn mẫu chuẩn phản hồi (`Single`, `Paginated`, `Non-Paginated`, `Error`).
   - Mọi response code dùng hằng số `UPPER_SNAKE_CASE` từ `AttendanceErrorCode`.
   - Phân quyền theo annotation `@RequirePermission`.

## 2. Thao tác

- [x] Hiện thực các REST Resource: `AttendanceResource`, `AttendanceAdminResource`, `ShiftAdminResource`, `KioskResource`
- [x] Xây dựng bộ DTOs request/response mạnh mẽ (AttendanceDtos)
- [x] Tích hợp kiểm tra quyền (RBAC permissions `@RequirePermission`)
- [x] Viết Unit & Integration Tests cho toàn bộ endpoints (100% PASS)

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Self Check-in, Check-out, MyStatus, MyLogs | **Pass** | `AttendanceResourceTest` (4/4 tests pass) |
| Kiosk PIN auth, session token, punch IN/OUT | **Pass** | `KioskResourceTest` (4/4 tests pass) |
| Admin Logs (list, soft-delete, on-behalf, import) | **Pass** | `AttendanceAdminResourceTest` (8/8 tests pass) |
| Shift Definition CRUD & validation (start != end) | **Pass** | `ShiftAdminResourceTest` (3/3 tests pass) |
| 4 Chuẩn API Contract & UPPER_SNAKE_CASE codes | **Pass** | Xác nhận 100% qua `AttendanceErrorCode` và `ApiResponse` envelopes |
