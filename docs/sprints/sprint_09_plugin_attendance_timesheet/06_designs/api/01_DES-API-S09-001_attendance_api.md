# [DES-API-S09-001] API Contract: Plugin attendance

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S09-001 / Thiết kế API / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt qua hội thoại tương tác (nội dung 0.1 giữ nguyên) |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [DES-ARCH-S09-001](../arch/01_DES-ARCH-S09-001_components_and_flows.md), [DES-DB-S09-001](../db/01_DES-DB-S09-001_attendance_schema.md), [api_standards](../../../../../.agents/rules/api_standards.md), [CONF-S09-001](../../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0 |
| Đọc trước / đọc tiếp | [DES-ARCH-S09-001](../arch/01_DES-ARCH-S09-001_components_and_flows.md) / [DES-UI-S09-001](../ui/01_DES-UI-S09-001_attendance_ui.md) |

## 1. Quy ước chung

- Base path runtime: `/api/v1/plugins/runtime/attendance/**` (bearer user JWT, permission theo từng endpoint, tenant từ token — không nhận tenant_id từ client); internal: `/api/v1/internal/attendance/**` (service token); public ingest: `/api/v1/attendance-ingest/{deviceCode}` (Core — ADR-S09-005).
- **100% response theo 4 khuôn mẫu chuẩn**: Single `{success, code, message, params, data}`; Paginated `data: {items, page, size, total_items, total_pages}`; Non-paginated `data: {items}`; Error `{success:false, code, message, params, errors:[{field, code, params}], timestamp}`. Mọi `code` là hằng `UPPER_SNAKE_CASE` qua `AttendanceErrorCode`; message không hardcode ngôn ngữ.
- Payload key dùng `ResponseKey` enum; DTO cố định (`CheckInResponse`, `AttendanceRecordDto`, `RequestDto`, `LedgerEntryDto`, `TimesheetDto`...) — cấm `Map<String,Object>` nghiệp vụ.
- Pagination chuẩn `page/size`; sort whitelist per endpoint.

## 2. Chấm công (self + kiosk)

| Method/Path | Quyền | Request → Response (khuôn mẫu) | Lỗi chính |
| :--- | :--- | :--- | :--- |
| POST `/attendance/check-in` | `attendance:checkin:self` | body `{gps?: {lat,lng}}` → Single `ATTENDANCE_CHECKIN_SUCCESS`, data `CheckInResponse {log_id, work_date, shift, geofence_flag}` | `ATTENDANCE_ALREADY_CHECKED_IN`, `ATTENDANCE_NOT_EMPLOYEE` |
| POST `/attendance/check-out` | `attendance:checkin:self` | → Single `ATTENDANCE_CHECKOUT_SUCCESS` | `ATTENDANCE_NO_OPEN_CHECKIN` |
| GET `/attendance/my-status` | `attendance:checkin:self` | → Single `{open_log, today_record, shift}` | — |
| GET `/attendance/my-logs` | `attendance:checkin:self` | query `from,to,page,size` → Paginated `LogDto` | — |
| POST `/kiosks/{deviceCode}/authenticate` | public route (Core, device) | body `{employee_code, pin}` → Single `KIOSK_AUTH_SUCCESS` `{session_token TTL 5'}` | `KIOSK_AUTH_FAILED`, `KIOSK_DEVICE_LOCKED` |
| POST `/kiosks/{deviceCode}/punch` | kiosk session token | body `{employee_code, event_type}` → Single `KIOSK_PUNCH_SUCCESS` | `KIOSK_SESSION_EXPIRED`, `ATTENDANCE_ALREADY_CHECKED_IN` |

## 3. Quản trị log & chấm hộ & import & push

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET `/admin/logs` | `attendance:log:manage` | filter `employee_id,branch_id,department_id,from,to,source` → Paginated | — |
| DELETE `/admin/logs/{id}` | `attendance:log:manage` | body `{reason}` (bắt buộc) → Single `ATTENDANCE_LOG_DELETED` + event recalc | `ATTENDANCE_LOG_DELETE_REASON_REQUIRED` |
| POST `/admin/logs/on-behalf` | `attendance:log:manage` (manager: team) | body `{employee_id, event_type, occurred_at, reason}` → Single `ATTENDANCE_LOG_ON_BEHALF_SUCCESS` (source MANUAL, meta.entered_by) | `ATTENDANCE_EMPLOYEE_OUT_OF_SCOPE` |
| POST `/admin/logs/import` | `attendance:log:manage` | multipart CSV (BioTime/ZKTeco template) → Single `ATTENDANCE_IMPORT_SUCCESS` `{total, inserted, skipped, errors[]}` | `ATTENDANCE_IMPORT_FORMAT_INVALID` |
| POST `/attendance-ingest/{deviceCode}` (Core) | device secret | header `X-Ingest-Secret`, `X-Ingest-Timestamp`, `X-Ingest-Nonce`; body `{events:[{employee_code, event_type, occurred_at, meta}]}` → Single `ATTENDANCE_INGEST_SUCCESS` `{inserted, skipped}` | `ATTENDANCE_INGEST_AUTH_FAILED`, `ATTENDANCE_INGEST_REPLAY`, `ATTENDANCE_INGEST_RATE_LIMITED` |

## 4. Ca làm việc & lịch & lễ

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET/POST/PUT/DELETE `/admin/shifts` (+`/{id}`) | `attendance:shift:manage` | CRUD `ShiftDto`; DELETE = `is_active=false` nếu đang gán | `ATTENDANCE_SHIFT_IN_USE`, `ATTENDANCE_SHIFT_INVALID_TIME` (end<=start hợp lệ cho ca đêm — chỉ chặn bằng đúng start) |
| GET/POST/PUT/DELETE `/admin/shift-templates` | `attendance:shift:manage` | CRUD template tuần (scope TENANT/BRANCH/DEPARTMENT) | `ATTENDANCE_TEMPLATE_OVERLAP` |
| GET/POST/DELETE `/admin/shift-assignments` | `attendance:shift:manage` | override `{employee_id, work_date, shift_id|null, reason}`; GET theo tuần/phòng ban → Paginated | `ATTENDANCE_ASSIGNMENT_CONFLICT` |
| GET `/my-schedule` | `attendance:checkin:self` | query `from,to` → `{items: [{date, shift, source}]}` | — |
| GET/POST/DELETE `/admin/holidays` | `attendance:shift:manage` | CRUD ngày lễ | `ATTENDANCE_HOLIDAY_DUPLICATED` |

## 5. Công ngày & OT window

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET `/admin/records` | `attendance:record:read` | filter `employee_id,branch,department,from,to,status,needs_review` → Paginated `AttendanceRecordDto` | — |
| PUT `/admin/records/{id}/override` | `attendance:record:override` | body `{status?, effective_in?, effective_out?, reason}` → Single `ATTENDANCE_RECORD_OVERRIDDEN` (is_override=true, audit) | `ATTENDANCE_RECORD_LOCKED` |
| POST `/admin/records/recalculate` | `attendance:record:override` | body `{employee_ids[], from, to}` → Single `ATTENDANCE_RECALC_QUEUED` | — |
| GET `/admin/ot-windows` | `attendance:record:read` | filter → Paginated | — |

## 6. Đơn từ (Requests) & inbox

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET `/request-types` | authenticated | → `{items: [RequestTypeDto]}` (chỉ is_active) | — |
| POST/PUT/DELETE `/admin/request-types` | `attendance:settings:manage` | CRUD loại (seed 6: bật/tắt; loại mới prefix `X_`, `status_mapping` rỗng) | `ATTENDANCE_REQUEST_TYPE_IMMUTABLE` (sửa is_system) |
| POST `/requests` | `attendance:request:submit` | body `{request_type_code, response, affected_window?}` → Single `ATTENDANCE_REQUEST_SUBMITTED` `{code, status}` | `ATTENDANCE_REQUEST_WINDOW_EXCEEDED`, `ATTENDANCE_PERIOD_LOCKED`, `ATTENDANCE_INSUFFICIENT_LEAVE_BALANCE` (LEAVE), `ATTENDANCE_REQUEST_DUPLICATE` (E09) |
| GET `/my-requests` | `attendance:request:submit` | filter `status,type` → Paginated | — |
| GET `/requests/inbox` | `attendance:request:approve` | đơn chờ người dùng duyệt (engine task join hoặc fallback) → Paginated | — |
| POST `/requests/{id}/fallback-action` | `attendance:request:approve` (chỉ approval_mode=INTERNAL_FALLBACK) | body `{action: APPROVE|REJECT, comment}` → Single `ATTENDANCE_REQUEST_ACTION_SUCCESS` → MappingExecutor | `ATTENDANCE_REQUEST_NOT_ACTIONABLE` |
| GET `/requests/{id}` | subject/approver/HR | → Single (kèm timeline từ engine) | `ATTENDANCE_REQUEST_FORBIDDEN` |

## 7. Nghỉ phép

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET/POST/PUT/DELETE `/admin/leave-types` | `attendance:leave:manage` | CRUD loại nghỉ (thuộc tính ADR-004) | `ATTENDANCE_LEAVE_TYPE_IN_USE` |
| POST `/admin/leave-ledger/grants` | `attendance:leave:manage` | body `{employee_ids[], leave_type_id, days, valid_until?, note}` → Single `ATTENDANCE_GRANT_SUCCESS` (entry GRANT) | — |
| POST `/admin/leave-ledger/adjustments` | `attendance:leave:manage` | body `{employee_id, leave_type_id, days±, note}` → Single `ATTENDANCE_ADJUSTMENT_SUCCESS` | — |
| GET `/my-leave-balances` | `attendance:checkin:self` | → `{items: [BalanceDto]}` (derive + breakdown) | — |
| GET `/admin/leave-balances` | `attendance:leave:manage` | filter `branch,department,leave_type` → Paginated | — |
| GET `/admin/leave-ledger` | `attendance:leave:manage` | filter `employee_id,leave_type,entry_type` → Paginated `LedgerEntryDto` | — |

## 8. Bảng công kỳ (4 bước) — xác nhận — chốt — xuất

| Method/Path | Quyền | Contract | Lỗi chính |
| :--- | :--- | :--- | :--- |
| GET `/admin/timesheets` | `attendance:timesheet:manage` | filter `period,scope,status` → Paginated | — |
| POST `/admin/timesheets` | `attendance:timesheet:manage` | `{period_year, period_month, scope_type, scope_id, wage_calc_mode}` → Single `ATTENDANCE_TIMESHEET_CREATED` | `ATTENDANCE_TIMESHEET_DUPLICATED` |
| POST `/admin/timesheets/{id}/step` | `attendance:timesheet:manage` | body `{step: S1_LOGS|S2_SCHEDULE|S3_CALCULATE|S4_ADJUST|DONE, confirm_override_loss?: bool}` → Single `ATTENDANCE_TIMESHEET_STEP_SUCCESS` (quay lại bước có dữ liệu sửa tay → 409 `ATTENDANCE_TIMESHEET_OVERRIDE_LOSS` + `confirm_override_loss=true` để tiếp tục) | `ATTENDANCE_TIMESHEET_INVALID_STEP` |
| PUT `/admin/timesheets/{id}/records/{recordId}` | `attendance:timesheet:manage` | sửa số công bước 4 `{status?, worked_minutes?, reason}` → Single | `ATTENDANCE_RECORD_LOCKED` |
| POST `/admin/timesheets/{id}/send-confirmations` | `attendance:timesheet:manage` | body `{employee_ids?: all nếu trống}` → Single `ATTENDANCE_CONFIRMATIONS_SENT` | — |
| POST `/confirmations/{id}` | `attendance:timesheet:confirm` | body `{action: CONFIRM|REJECT, comment?}` → Single `ATTENDANCE_CONFIRMATION_RECORDED` | `ATTENDANCE_CONFIRMATION_CLOSED` |
| POST `/admin/timesheets/{id}/lock` | `attendance:timesheet:lock` | → Single `ATTENDANCE_TIMESHEET_LOCKED` (đánh dấu chưa xác nhận; event outbox) | `ATTENDANCE_TIMESHEET_NOT_DONE` |
| POST `/admin/timesheets/{id}/unlock` | `attendance:timesheet:lock` (Tenant Admin) | body `{reason}` → Single `ATTENDANCE_TIMESHEET_UNLOCKED` | `ATTENDANCE_TIMESHEET_NOT_LOCKED` |
| POST `/admin/timesheets/{id}/export` | `attendance:timesheet:manage` | body `{template_id?}` → Single `ATTENDANCE_EXPORT_READY` `{file_id}` (download qua signed URL employee storage) | — |
| GET/POST/PUT/DELETE `/admin/export-templates` | `attendance:timesheet:manage` | CRUD template cột | `ATTENDANCE_EXPORT_COLUMN_UNKNOWN` |

## 9. Báo cáo

| Method/Path | Quyền | Contract |
| :--- | :--- | :--- |
| GET `/reports/summary` | `attendance:report:read` | filter `scope,from,to` → Single `{attendance_rate, total_ot_hours, late_count, absence_count, by_department[]}` |
| GET `/reports/team` | `attendance:report:read` (manager) | theo team assignment → Paginated `TeamMemberReportDto` |
| GET `/reports/top-late`, `/reports/overtime` | `attendance:report:read` | Paginated |

## 10. Internal (service token) — Event Hub + notification

| Method/Path | Mục đích |
| :--- | :--- |
| POST `/api/v1/internal/events` | nhận delivery Event Hub: `workflow.instance.completed` → MappingExecutor (idempotent request_id); trả 200 kể cả trùng (created=false) |
| POST `/api/v1/internal/employee-refs/sync` | Core/employee trigger hoặc self-job: refresh projection (chỉ đọc employee qua runtime gateway) |
| GET `/api/v1/internal/attendance/summary` | plugin khác (payroll sau) đọc snapshot bảng công đã chốt theo (scope, period) — chỉ trạng thái DONE/locked |

## 11. Error code enum (AttendanceErrorCode — nhóm chính)

`ATTENDANCE_ALREADY_CHECKED_IN`, `ATTENDANCE_NO_OPEN_CHECKIN`, `ATTENDANCE_NOT_EMPLOYEE`, `ATTENDANCE_EMPLOYEE_OUT_OF_SCOPE`, `ATTENDANCE_LOG_DELETE_REASON_REQUIRED`, `ATTENDANCE_IMPORT_FORMAT_INVALID`, `ATTENDANCE_INGEST_AUTH_FAILED`, `ATTENDANCE_INGEST_REPLAY`, `ATTENDANCE_INGEST_RATE_LIMITED`, `ATTENDANCE_SHIFT_IN_USE`, `ATTENDANCE_SHIFT_INVALID_TIME`, `ATTENDANCE_TEMPLATE_OVERLAP`, `ATTENDANCE_ASSIGNMENT_CONFLICT`, `ATTENDANCE_HOLIDAY_DUPLICATED`, `ATTENDANCE_RECORD_LOCKED`, `ATTENDANCE_REQUEST_WINDOW_EXCEEDED`, `ATTENDANCE_PERIOD_LOCKED`, `ATTENDANCE_INSUFFICIENT_LEAVE_BALANCE`, `ATTENDANCE_REQUEST_DUPLICATE`, `ATTENDANCE_REQUEST_NOT_ACTIONABLE`, `ATTENDANCE_REQUEST_TYPE_IMMUTABLE`, `ATTENDANCE_TIMESHEET_DUPLICATED`, `ATTENDANCE_TIMESHEET_INVALID_STEP`, `ATTENDANCE_TIMESHEET_OVERRIDE_LOSS`, `ATTENDANCE_TIMESHEET_NOT_DONE`, `ATTENDANCE_TIMESHEET_NOT_LOCKED`, `ATTENDANCE_CONFIRMATION_CLOSED`, `ATTENDANCE_EXPORT_COLUMN_UNKNOWN`, `KIOSK_AUTH_FAILED`, `KIOSK_DEVICE_LOCKED`, `KIOSK_SESSION_EXPIRED`.

## 12. Ví dụ phản hồi (minh họa, không thay đặc tả)

```json
// POST /attendance/check-in — Single Resource
{ "success": true, "code": "ATTENDANCE_CHECKIN_SUCCESS",
  "message": "", "params": {},
  "data": { "log_id": "…", "work_date": "2026-11-02", "shift": "CA_SANG", "geofence_flag": false } }

// GET /admin/records — Paginated
{ "success": true, "code": "ATTENDANCE_RECORD_LIST_SUCCESS",
  "data": { "items": [ { "employee_id": "…", "work_date": "2026-11-02", "status": "PRESENT",
    "late_minutes": 0, "ot_minutes": 60, "is_override": false, "needs_review": false } ],
    "page": 1, "size": 20, "total_items": 132, "total_pages": 7 } }

// Error — 4 mẫu
{ "success": false, "code": "ATTENDANCE_INSUFFICIENT_LEAVE_BALANCE",
  "message": "", "params": { "remaining": 0.5, "requested": 2 },
  "errors": [ { "field": "affected_window", "code": "INSUFFICIENT_BALANCE", "params": {} } ],
  "timestamp": "2026-11-02T09:00:00Z" }
```

## 13. Kiểm chứng

RestAssured integration trên PostgreSQL/Redis thật: từng nhóm endpoint (happy + lỗi chính), 4 khuôn mẫu response schema validation, tenant isolation (2 tenant chồng dữ liệu), kiosk session TTL, ingest replay/nonce; quyền 403 khi thiếu permission. AC truy vết: AC-A01…A07 (§2–3), AC-S01…S04 (§4), AC-C01…C03 + AC-R (§5–6), AC-L (§7), AC-Đ (§6), AC-T01…T06 (§8–9), AC-M01 (mobile dùng §2/§5/§6/§8).
