# [DES-DB-S09-001] Schema CSDL: Plugin attendance

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S09-001 / Thiết kế DB / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [SOL-S09-001](../../05_solutions/01_SOL-S09-001_attendance_architecture.md) APPROVED, [ADR-S09-001…005](../../05_solutions/02_ADR-S09-001_shift_structure_in_plugin.md), [CONF-S09-001](../../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0 |
| Đọc trước / đọc tiếp | [ADR-S09-001](../../05_solutions/02_ADR-S09-001_shift_structure_in_plugin.md) / [DES-API-S09-001](../api/01_DES-API-S09-001_attendance_api.md) |

## 1. Nguyên tắc chung

- Bảng nằm trong **schema riêng theo (tenant, plugin)** `tenant_<8 ký tự>_attendance`; mọi bảng có `tenant_id UUID NOT NULL`; descriptor khai báo `tenant_scope: TENANT`, `PluginQueryCompiler` tự chèn — cấm truyền tenant_id thủ công.
- Migration: SQL trong `plugins/attendance/migrations/`, checksum khai báo trong `plugin.json`, chạy bởi `PluginMigrationExecutor`; rollback theo `SNAPSHOT_RESTORE`.
- Tất cả entity đăng ký Entity Registry (`plugin:attendance.<Entity>`); soft ref ghi `plugin:employee.Employee` style, không FK chéo schema.
- Kiểu chung: `id UUID PK DEFAULT gen_random_uuid()`, `created_at/updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`; tiền tố bảng `plg_attendance_`.

## 2. Ca làm việc & lịch (ADR-S09-001)

### 2.1. `plg_attendance_shift_definitions`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| code | VARCHAR(32) | unique (tenant_id, code) |
| name | VARCHAR(128) | tên fallback khi catalog thiếu |
| catalog_shift_id | UUID NULL | soft ref `plugin:catalog.CatalogItem` |
| start_time, end_time | TIME NOT NULL | `end <= start` → ca đêm qua ngày |
| grace_in_minutes, grace_out_minutes | INT DEFAULT 0 | thiên về nhân viên |
| break_minutes | INT DEFAULT 0 | trừ khỏi giờ làm |
| ot_grace_minutes | INT DEFAULT 0 | thiên về công ty |
| min_ot_minutes | INT DEFAULT 15 | ngưỡng OT tối thiểu |
| working_minutes | INT NOT NULL | giờ chuẩn 1 ca |
| is_active | BOOL DEFAULT true | |

### 2.2. `plg_attendance_shift_templates` — lịch tuần theo đơn vị

`id, tenant_id, scope_type VARCHAR(16) (TENANT|BRANCH|DEPARTMENT), scope_id UUID NULL (NULL = TENANT), name VARCHAR(128), effective_from DATE NOT NULL, effective_to DATE NULL, week JSONB NOT NULL ({"mon":"CA_SANG","tue":...,"sun":"OFF"} — mã ca hoặc "OFF"), is_active, created_at/updated_at`. Index `(tenant_id, scope_type, scope_id, effective_from)`.

### 2.3. `plg_attendance_shift_assignments` — override từng nhân viên/ngày

`id, tenant_id, employee_id UUID NOT NULL (soft ref employee.Employee), work_date DATE NOT NULL, shift_definition_id UUID NULL (NULL = OFF), source VARCHAR(16) (HR|SHIFT_SWAP), reason VARCHAR(255) NULL, created_by, created_at/updated_at` — unique `(tenant_id, employee_id, work_date)`; index `(tenant_id, work_date)`.

### 2.4. `plg_attendance_holidays`

`id, tenant_id, name VARCHAR(128), holiday_date DATE NOT NULL, recurring_annual BOOL DEFAULT false, created_at/updated_at` — unique `(tenant_id, holiday_date)`.

## 3. Log & tính công (ADR-S09-003/005)

### 3.1. `plg_attendance_logs` — append-only

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| employee_id | UUID NOT NULL | soft ref |
| event_type | VARCHAR(8) | `IN` / `OUT` |
| occurred_at | TIMESTAMPTZ NOT NULL | |
| work_date | DATE NOT NULL | theo ca hiệu lực (ca đêm → ngày bắt đầu) |
| source | VARCHAR(16) | `WEB|MOBILE|KIOSK|IMPORT|PUSH|MANUAL` |
| device_id | UUID NULL | soft ref Devices (kiosk/middleware) |
| meta | JSONB | GPS lat/lng + `geofence_flag`, ip, user-agent, `entered_by` + `entered_reason` (chấm hộ), import_batch_id |
| deleted_by, deleted_reason | UUID/TEXT NULL | xóa chỉ HR, không UPDATE nội dung |
| deleted_at | TIMESTAMPTZ NULL | |

Indexes: `(tenant_id, employee_id, occurred_at)`; unique partial `(tenant_id, source, device_id, occurred_at, employee_id) WHERE source IN ('KIOSK','PUSH','IMPORT') AND deleted_at IS NULL`.

### 3.2. `plg_attendance_records` — công ngày

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| employee_id, work_date | UUID / DATE | unique `(tenant_id, employee_id, work_date, shift_definition_id)` |
| shift_definition_id | UUID NULL | NULL = không xác định ca (`needs_review`) |
| shift_name_snapshot | VARCHAR(128) | tên ca tại lúc tính |
| status | VARCHAR(16) | `PRESENT|ABSENT|HALF_DAY|WFH|ON_LEAVE|BUSINESS_TRIP` |
| effective_in, effective_out | TIMESTAMPTZ NULL | |
| worked_minutes, late_minutes, early_leave_minutes, ot_minutes | INT DEFAULT 0 | ot chỉ từ ot_windows |
| calc_version | INT NOT NULL DEFAULT 1 | tăng mỗi lần job tính lại |
| is_override | BOOL DEFAULT false | override bỏ qua job |
| override_reason, override_by | TEXT/UUID NULL | |
| needs_review | BOOL DEFAULT false | log treo/thiếu ca/lỗi |
| review_note | TEXT NULL | |
| timesheet_id | UUID NULL | đã vào bảng công nào |
| lock_version | INT DEFAULT 0 | optimistic locking |

Indexes: `(tenant_id, employee_id, work_date DESC)`, `(tenant_id, work_date, status)`, `(tenant_id, needs_review) WHERE needs_review`.

### 3.3. `plg_attendance_ot_windows` — khung OT đã duyệt

`id, tenant_id, employee_id, request_id UUID (soft ref Requests), work_date DATE, start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, status VARCHAR(16) (ACTIVE|CANCELLED), created_at/updated_at` — index `(tenant_id, employee_id, work_date)`; CANCELLED khi đơn hủy.

### 3.4. `plg_attendance_hanging_checks` — state phát hiện treo (idempotent job)

`id, tenant_id, log_id UUID, detected_at, handled_at NULL, handled_by NULL` — unique `(tenant_id, log_id)`.

## 4. Đơn từ (ADR-S09-002)

### 4.1. `plg_attendance_request_types`

`id, tenant_id, code VARCHAR(40), name VARCHAR(128), is_system BOOL, is_active BOOL, form_ref JSONB ({plugin:"form", slug, definition_id}), workflow_definition_key VARCHAR(80), status_mapping JSONB, window_days INT DEFAULT 30, sort_order INT, created_at/updated_at` — unique `(tenant_id, code)`; seed 6: `LEAVE, OVERTIME, ATTENDANCE_FIX, LATE_EARLY, BUSINESS_TRIP, SHIFT_SWAP` (is_system=true).

### 4.2. `plg_attendance_requests`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| request_type_id | UUID NOT NULL | |
| code | VARCHAR(32) | hiển thị `ĐT-2026-0001` theo sequence tenant |
| subject_employee_id | UUID NOT NULL | người được tác động (tự nộp = chính mình) |
| submitted_by_user_id | UUID NOT NULL | |
| form_version | INT | pin version form definition |
| response | JSONB NOT NULL | `{ref: value}` theo form |
| status | VARCHAR(16) | `PENDING|APPROVED|REJECTED|CANCELLED` |
| workflow_instance_id | UUID NULL | nullable — fallback nội bộ chưa có instance |
| approval_mode | VARCHAR(16) | `ENGINE` / `INTERNAL_FALLBACK` |
| fallback_approver_employee_id | UUID NULL | manager từ assignment khi fallback |
| fallback_comment | TEXT NULL | lý do từ chối fallback |
| affected_window | JSONB | `{from, to}` — khoảng ngày tác động (validate window_days + kỳ chốt) |
| mapping_status | VARCHAR(16) | `NOT_APPLICABLE|PENDING|APPLIED|FAILED` + `mapping_error` TEXT |
| created_at/updated_at | | |

Indexes: `(tenant_id, subject_employee_id, created_at DESC)`, `(tenant_id, status)`, unique `(tenant_id, code)`.

## 5. Nghỉ phép (ADR-S09-004)

### 5.1. `plg_attendance_leave_types`

`id, tenant_id, code VARCHAR(32), name VARCHAR(128), paid BOOL, counts_as_work BOOL, deduct_balance BOOL, allow_negative BOOL DEFAULT false, carry_over_max_days INT DEFAULT 0, validity_months INT NULL (NULL = không hết hạn), default_annual_grant NUMERIC(5,2) NULL, is_active, created_at/updated_at` — unique `(tenant_id, code)`; seed theo tenant (ANNUAL_PHÉP NĂM, SICK, MATERNITY, UNPAID...).

### 5.2. `plg_attendance_leave_ledger` — append-only

`id, tenant_id, employee_id, leave_type_id, entry_type VARCHAR(16) (GRANT|USAGE|USAGE_REVERSAL|ADJUSTMENT|EXPIRY), days NUMERIC(5,2) (+/−), valid_until DATE NULL (entry GRANT), source_request_id UUID NULL, source VARCHAR(16) (REQUEST|HR|JOB), note TEXT, created_by NULL (JOB), created_at` — index `(tenant_id, employee_id, leave_type_id)`; **không UPDATE/DELETE**.

### 5.3. `plg_attendance_leave_balances` — snapshot cache

`id, tenant_id, employee_id, leave_type_id, granted NUMERIC(5,2), used NUMERIC(5,2), remaining NUMERIC(5,2), expiring NUMERIC(5,2), recomputed_at TIMESTAMPTZ` — unique `(tenant_id, employee_id, leave_type_id)`; chỉ dùng đọc UI; chặn duyệt luôn derive từ ledger.

## 6. Bảng công kỳ (4 bước Base) & xác nhận & xuất

### 6.1. `plg_attendance_timesheets`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| period_year INT, period_month INT | | unique `(tenant_id, scope_type, scope_id, period_year, period_month)` |
| scope_type / scope_id | VARCHAR(16) / UUID NULL | TENANT|BRANCH|DEPARTMENT |
| wage_calc_mode | VARCHAR(24) | `STANDARD_MINUS_UNPAID` / `ACTUAL_TOTAL` |
| step | VARCHAR(16) | `S1_LOGS|S2_SCHEDULE|S3_CALCULATE|S4_ADJUST|DONE` |
| locked_at, locked_by | TIMESTAMPTZ/UUID NULL | chốt (DONE) |
| unlocked_at, unlocked_by, unlock_reason | | chỉ Tenant Admin, audit |
| snapshot | JSONB | tổng hợp cuối: công chuẩn, công thực, nghỉ, OT, muộn — tính ở Bước 3 |
| created_by, created_at/updated_at | | |

### 6.2. `plg_attendance_timesheet_confirmations`

`id, tenant_id, timesheet_id, employee_id, status VARCHAR(16) (PENDING|CONFIRMED|REJECTED), comment TEXT NULL, sent_at, acted_at NULL, acted_by NULL` — unique `(tenant_id, timesheet_id, employee_id)`; index `(tenant_id, timesheet_id, status)`.

### 6.3. `plg_attendance_export_templates`

`id, tenant_id, name VARCHAR(128), columns JSONB (mảng cột bật + thứ tự), is_default BOOL, created_by, created_at/updated_at`; seed 1 template chuẩn payroll-ready VN.

## 7. Thiết bị, cấu hình, projection, outbox

### 7.1. `plg_attendance_devices`

`id, tenant_id, name VARCHAR(128), device_type VARCHAR(16) (KIOSK|MIDDLEWARE), branch_id UUID NULL (soft ref organization.Branch), device_code VARCHAR(64) unique (tenant_id, device_code), pin_hash VARCHAR(128) NULL (kiosk), ingest_secret_hash VARCHAR(128) NULL (push), secret_rotated_at, locked_until NULL (brute force), is_active, created_at/updated_at`.

### 7.2. `plg_attendance_settings` (1 row/tenant)

`id, tenant_id, hanging_threshold_hours INT DEFAULT 16, geofence_radius_m INT DEFAULT 200, default_shift_definition_id UUID NULL, mobile_require_gps BOOL DEFAULT true, kiosk_enabled BOOL DEFAULT true, push_enabled BOOL DEFAULT true, work_week JSONB (ngày làm việc chuẩn), timezone VARCHAR(64) DEFAULT 'Asia/Ho_Chi_Minh'` — unique `(tenant_id)`.

### 7.3. `plg_attendance_employee_refs` — projection cache nhân sự (đọc từ employee qua internal API)

`id, tenant_id, employee_id unique (tenant_id, employee_id), employee_code, full_name, user_id NULL, primary_branch_id, primary_department_id, manager_employee_id NULL, employment_status VARCHAR(16), hire_date NULL, exit_date NULL, synced_at` — job sync định kỳ + trước job tính công; chỉ phục vụ join hiển thị/filter, quyền vẫn qua API Core.

### 7.4. `plg_attendance_outbox`

Giống pattern `plg_employee_outbox`: `event_type, aggregate_id, payload JSONB, status PENDING|SENT|FAILED, retry_count, next_retry_at, sent_at`. Sự kiện publish: `attendance.record.needs_review`, `attendance.timesheet.locked/unlocked`, `attendance.request.created`.

## 8. Entity Registry & manifest

`entities[]` khai báo đủ 19 bảng trên với `storage_scope: TENANT`; `event_subscriptions`: `[{source: "workflow", event: "workflow.instance.completed"}]`; `event_publications`: 3 sự kiện §7.4; `permissions[]`: `attendance:checkin:self`, `attendance:log:manage`, `attendance:kiosk:operate`, `attendance:shift:manage`, `attendance:record:read|override`, `attendance:request:submit|approve`, `attendance:leave:manage`, `attendance:timesheet:manage|lock|confirm`, `attendance:report:read`, `attendance:settings:manage` (tên cuối cùng ở DES-API §1); `platforms.mobile.features`: chấm GPS, xem lịch/công, nộp đơn, xác nhận công, duyệt (theo CONF Q15).

## 9. Kiểm chứng

Migration chạy trên PostgreSQL thật (`npm run infra`); test: unique conflict (log trùng nguồn máy), partial index, job idempotent chèn/cập nhật records; đối soát Registry manifest ↔ migration script ở QA. AC truy vết: toàn bộ AC-A/S/C/R/L/Đ/T/M — mapping chi tiết tại DES-ARCH §7.
