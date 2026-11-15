# [TASK-468] Lưu vết hoạt động người dùng trong plugin Chấm công

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-468 / Task / Sprint 09 |
| Trạng thái | **Done source — chờ QA xác nhận trên UI** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Local dev, tenant `review50c` |
| depends_on / blocks / parent | TASK-466 / audit nghiệm thu / [FEAT-43](../07_items/FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope | `plugins/attendance` (migration, entity, query, service, resource, UI) |

## 1. Mục tiêu

Mọi thao tác nhạy cảm của người dùng trong plugin Chấm công phải để lại vết có thể tra cứu: ai làm, lúc nào, trên đối tượng nào, kết quả ra sao.

## 2. Thiết kế

Bảng riêng của plugin (không phụ thuộc audit Core, vì audit Core chỉ phục vụ platform/tenant lifecycle):

`plugins/attendance/migrations/V1.4.0__attendance_audit_logs.sql`

| Cột | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `id` | uuid | Khóa chính |
| `tenant_id` | uuid | Cách ly tenant (data gateway tự gán) |
| `actor_user_id` | uuid | User đang đăng nhập |
| `action` | varchar(64) | Mã hành động UPPER_SNAKE_CASE |
| `entity_type` / `entity_id` | varchar / uuid | Đối tượng bị tác động |
| `detail` | jsonb | Ngữ cảnh nhỏ (mã đơn, kỳ công, số bản ghi...) |
| `created_at` | timestamptz | Thời điểm |

Descriptor mới: `attendance.audit.insert`, `attendance.audit.list`. Entity `AuditLog` khai báo trong manifest.

## 3. Điểm ghi vết

| Hành động | Mã `action` | Nơi phát |
| :--- | :--- | :--- |
| Gửi đơn | `REQUEST_SUBMIT` | `RequestService.submitRequest` |
| Duyệt / từ chối (fallback) | `REQUEST_APPROVE` / `REQUEST_REJECT` | `RequestService.fallbackAction` |
| Duyệt / từ chối (workflow) | `WORKFLOW_APPROVE` / `WORKFLOW_REJECT` | `RequestService.handleWorkflowCompletedEvent` |
| Tạo kỳ công | `TIMESHEET_CREATE` | `TimesheetService.createTimesheet` |
| Chuyển bước kỳ công | `TIMESHEET_STEP` | `TimesheetService.transitionStep` |
| Khóa / mở khóa kỳ công | `TIMESHEET_LOCK` / `TIMESHEET_UNLOCK` | `TimesheetService.lockTimesheet` / `unlockTimesheet` |
| Import log | `LOG_IMPORT` | `AttendanceAdminResource.importLogs` |
| Xóa log | `LOG_DELETE` | `AttendanceAdminResource.deleteLog` |
| Chấm công hộ | `LOG_ON_BEHALF` | `AttendanceAdminResource.onBehalf` |
| Sửa công ngày | `RECORD_OVERRIDE` | `AttendanceAdminResource.overrideRecord` |
| Tính lại công | `RECORD_RECALCULATE` | `AttendanceAdminResource.recalculate` |
| Phân ca hàng loạt | `SHIFT_BULK_ASSIGN` | `ShiftAdminResource.bulkAssignShifts` |
| Tạo / sửa loại phép | `LEAVE_TYPE_CREATE` / `LEAVE_TYPE_UPDATE` | `LeaveAdminResource` |
| Cấp phép / điều chỉnh số dư | `LEAVE_GRANT` / `LEAVE_ADJUST` | `LeaveAdminResource` |

## 4. Truy vấn

`GET /api/v1/attendance/admin/audit?page=1&size=50` — quyền `attendance:record:override`, trả `PagedData<AuditLogDto>`.

UI: tab **Lịch sử hoạt động** (`admin-activity`), bảng thời điểm / hành động / đối tượng / chi tiết, có phân trang.

## 5. Kiểm chứng

- `attendance.audit.list` trả về bản ghi sau khi gửi/duyệt đơn, import log, phân ca.
- Không có bản ghi nào nằm ngoài `tenant_id` hiện tại.
