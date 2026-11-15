# [BUG-186] Attendance runtime 404/500 khi cài thật trên local dev

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-186 / Bug / Sprint 09 (phát hiện khi chạy local dev UI) |
| Severity / trạng thái | **High / Partially fixed** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c`, attendance 1.0.0 |
| depends_on / blocks / parent | BUG-185 / task test 50 nhân sự / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `plugins/attendance/plugin.json`, `V9.0.1`, `V9.0.2`, `application.properties`, `docker-compose.yml` |

## 1. Hiện tượng

Cài attendance qua Plugin Marketplace thành công nhưng mọi API trả 404; sau khi sửa path, các API admin trả 403/500. Schema `tenant_*_attendance` chỉ có 0 bảng nghiệp vụ.

## 2. Nguyên nhân

1. `plugin.json` không khai báo `migrations`, nên install saga bỏ qua bước MIGRATE.
2. REST resources khai báo `@Path("/attendance")` nhưng runtime thiếu `quarkus.rest.path=/api/v1`.
3. Permission annotations dùng mã mới (`attendance:log:manage`, `attendance:checkin:self`, ...) trong khi V9.0.0 chỉ seed danh sách cũ.
4. Manifest trong DB là bản cũ, thiếu 64 data queries; descriptor registry cache giữ 0 query.
5. Docker compose backend-dev không mount `plugins/attendance/migrations`.

## 3. Đã sửa

- Thêm `quarkus.rest.path=/api/v1/attendance` và đổi `AttendanceResource` về `/` để mọi resource dùng chung prefix.
- Thêm `migrations` array (2 file, checksum SHA-256) vào `plugin.json`.
- Thêm migration `V9.0.1` cập nhật manifest migrations.
- Thêm migration `V9.0.2` seed đủ permission + grant cho TENANT_ADMIN/OWNER/GENERAL_MANAGER/STAFF.
- Mount `./plugins/attendance/migrations` vào backend-dev.
- Cập nhật manifest đầy đủ (20 entities, 64 queries) và restart backend để xóa descriptor cache.
- Cho phép cast `time`/`date`/`timestamp`/`jsonb` trong descriptor registry; thêm `type` cho `shift.start_time/end_time` và `request_type.status_mapping`.

## 4. Kiểm chứng

- `plg_attendance_*`: 20 bảng + `plugin_schema_history` apply sạch.
- Runtime health 200; `/api/v1/attendance/my-status` trả 401 khi chưa auth (route tồn tại), không còn 404.
- UI attendance render; my-status/my-logs và các tab admin hết 403.
- Drawer nhập CSV log đã bổ sung vào UI và build lại image.

## 5. Còn mở

- `GET/POST /admin/shifts` trả 500 `Unexpected catalog plugin error` từ data gateway; cần điều tra descriptor `ShiftDefinition`/catalog resolution.
- `employee_refs` chưa có sync job; hiện phải đồng bộ projection thủ công từ employee profiles.
- Employee import dry-run hiện không hiện nút Áp dụng (đã sửa điều kiện `result.dry_run`, chưa build lại image employee).
