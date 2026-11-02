# [DES-DB-S08-001] Schema CSDL: Plugin Form, Plugin Workflow, Event Hub Core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S08-001 / Thiết kế DB / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 — làm rõ append-only snapshot + pin response theo phản hồi chủ dự án |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [SOL-S08-001](../../05_solutions/01_SOL-S08-001_form_workflow_architecture.md), [ADR-S08-001](../../05_solutions/02_ADR-S08-001_workflow_engine_state_machine.md), [ADR-S08-002](../../05_solutions/03_ADR-S08-002_event_hub_entity_write_proxy.md), [DES-ARCH-S08-001](../arch/01_DES-ARCH-S08-001_components_and_flows.md) |
| Đọc trước / đọc tiếp | [DES-ARCH-S08-001](../arch/01_DES-ARCH-S08-001_components_and_flows.md) / [DES-API-S08-001](../api/01_DES-API-S08-001_form_workflow_api.md) |

## 1. Nguyên tắc chung

- Bảng plugin nằm trong **schema riêng theo (tenant, plugin)** (`tenant_<8 ký tự>_<plugin>`); mọi bảng có `tenant_id UUID NOT NULL`; `PluginQueryCompiler` tự chèn điều kiện tenant — descriptor khai báo `tenant_scope: TENANT`; cấm plugin truyền `tenant_id` thủ công.
- Migration: file SQL trong `plugins/<p>/migrations/`, khai báo checksum trong `plugin.json`, chạy bởi `PluginMigrationExecutor` (plugin không tự Flyway). Core dùng Flyway `V8.0.x`.
- Không dùng H2; test trên PostgreSQL thật. Không tạo bảng cột phẳng per-survey (bài học LimeSurvey — BENCH §4.2).

## 2. Plugin `form` (prefix `plg_form_`)

### 2.1. `plg_form_definitions`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, tenant_id | UUID | PK / NOT NULL |
| slug | VARCHAR(64) | unique (tenant_id, slug); dùng cho link public |
| title_key_text | VARCHAR(300) | tiêu đề do tenant đặt (dữ liệu, không i18n) |
| description | TEXT | |
| document | JSONB | form document: items[] (SECTION/QUESTION), question `{ref, type, required, options[], validation, logic[], file_limits, matrix{rows,columns}, grading}` |
| entity_mapping | JSONB | `{ref → {target_plugin, target_entity, target_field, transform}}` — null nếu không map |
| publish | JSONB | `{status: DRAFT|PUBLISHED|CLOSED, captcha: none|recaptcha-v3, close_at, response_limit, accept_responses}` |
| latest_version, created_at, updated_at | INTEGER/TIMESTAMPTZ | version tăng mỗi lần sửa sau khi có response |
| created_by | UUID | soft ref `core.user` |

Indexes: `(tenant_id, slug)` unique; `(tenant_id, publish->>'status')`.

### 2.2. `plg_form_definitions_versions` (snapshot bất biến — AC-F13, nền của version semantics)

`id, tenant_id, definition_id, version INTEGER, document JSONB, entity_mapping JSONB, created_at` — unique `(tenant_id, definition_id, version)`; **append-only**: mỗi lần sửa form đã PUBLISHED hoặc đã có response → insert snapshot mới, không UPDATE/DELETE row; response và draft pin `version` này (xem DES-ARCH §6 — dữ liệu cũ luôn render/export theo snapshot của version của nó).

### 2.3. `plg_form_responses`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, tenant_id | UUID | |
| form_id | UUID | NOT NULL |
| form_version | INTEGER | **pin snapshot** lúc submit/draft (resolve document từ `plg_form_definitions_versions`) |
| answers | JSONB | `{ref: value}` (file ref chứa file_id) |
| responder_email | VARCHAR(320) | nhập tay (anonymous) |
| submitted_by_user_id | UUID NULL | chỉ khi member tenant điền |
| entity_write_status | VARCHAR(16) | `SKIPPED|OK|FAILED` + `entity_write_error` TEXT |
| workflow_instance_id | UUID NULL | do event trigger sinh ra (nếu có) |
| ip_hash | VARCHAR(64) | HMAC IP (anonymize tuỳ chọn — không lưu IP thô) |
| idempotency_key | VARCHAR(80) | unique (tenant_id, idempotency_key) |
| submitted_at, status | TIMESTAMPTZ / VARCHAR(16) | status: `SUBMITTED` |

Indexes: `(tenant_id, form_id, submitted_at DESC)`, unique idempotency.

### 2.4. `plg_form_files`

`id, tenant_id, response_id NULL (chưa submit), form_id, storage_key VARCHAR(400), original_name, content_type, size_bytes, scan_status VARCHAR(16) (PENDING|CLEAN|INFECTED|ERROR), scan_error, created_at` — index `(tenant_id, response_id)`.

### 2.5. `plg_form_public_events` (audit truy cập public — nhẹ)

`id, tenant_id, form_id, event VARCHAR(24) (VIEW|SUBMIT|REJECT_RATELIMIT|REJECT_CAPTCHA), ip_hash, created_at` — index `(tenant_id, form_id, created_at)`; retention xoá > 90 ngày (job scheduler của form).

## 3. Plugin `workflow` (prefix `plg_workflow_`)

### 3.1. `plg_workflow_definitions`

`id, tenant_id, key VARCHAR(80), version INTEGER, status VARCHAR(16) (DRAFT|PUBLISHED|ARCHIVED), document JSONB (nodes per ADR-S08-001), created_by, created_at, published_at` — unique `(tenant_id, key, version)`; index `(tenant_id, key, status)`.

### 3.2. `plg_workflow_instances`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, tenant_id | UUID | |
| definition_id, definition_version | UUID / INTEGER | pin version |
| status | VARCHAR(16) | `RUNNING|COMPLETED|CANCELLED` |
| outcome | VARCHAR(24) | `APPROVED|REJECTED|CANCELLED` |
| trigger_type | VARCHAR(16) | `MANUAL|API|EVENT|WEBHOOK|BOOTSTRAP` |
| source_ref | JSONB | `{plugin, entity, aggregate_id}` — bối cảnh gốc |
| context | JSONB | entity snapshot + initiator + vars |
| idempotency_key | VARCHAR(120) | unique (tenant_id, idempotency_key) — chống trigger nhân bản |
| initiated_by, created_at, completed_at | | |

Indexes: `(tenant_id, status)`, `(tenant_id, source_ref->>'aggregate_id')`.

### 3.3. `plg_workflow_tasks`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, tenant_id, instance_id, node_id | | |
| node_type | VARCHAR(16) | APPROVAL/TASK |
| status | VARCHAR(16) | `PENDING|IN_PROGRESS|COMPLETED|RETURNED|SKIPPED|CANCELLED` |
| approval_mode | VARCHAR(16) | ANY_ONE / ALL_APPROVE / VOTE_RATIO |
| vote_ratio | NUMERIC(3,2) NULL | |
| assignees | JSONB | `[user_id]` (resolve xong) |
| candidates | JSONB | pool cho claim |
| claimed_by | UUID NULL | |
| action_votes | JSONB | `[{actor, action, comment, acted_at}]` — phục vụ ALL/VOTE |
| due_at | TIMESTAMPTZ NULL | SLA |
| remind_before_hours | INTEGER NULL | |
| reminder_slots | JSONB | đã nhắc (idempotent scheduler) |
| overdue_at | TIMESTAMPTZ NULL | quá hạn (vẫn duyệt được — CONF Q11) |
| created_at, completed_at | | |

Indexes: `(tenant_id, status, due_at)`, `(tenant_id, instance_id)`, GIN trên `candidates`.

### 3.4. `plg_workflow_events` (append-only — AC-W11)

`id, tenant_id, instance_id, task_id NULL, event VARCHAR(32) (INSTANCE_STARTED|NODE_ENTERED|TASK_ASSIGNED|TASK_CLAIMED|TASK_ACTION|NODE_COMPLETED|INSTANCE_COMPLETED|SLA_REMINDER|SLA_OVERDUE|WEBHOOK_CALLED|AUTO_ENTITY_WRITTEN|REASSIGNED|RETURNED), actor_user_id NULL (NULL = SYSTEM), payload JSONB (before/after, comment, điều kiện đánh giá), created_at` — không UPDATE/DELETE; index `(tenant_id, instance_id, created_at)`.

### 3.5. `plg_workflow_triggers`

`id, tenant_id, definition_id, source_plugin VARCHAR(40) ('*' cho all), entity VARCHAR(80), event_type VARCHAR(40) (created|updated|status_changed|form.response.submitted|workflow.instance.completed|...), filter JSONB (điều kiện đơn giản), enabled, created_at` — index `(tenant_id, source_plugin, entity, event_type)`.

### 3.6. `plg_workflow_webhook_endpoints`

`id, tenant_id, name, path_token VARCHAR(48) unique (tenant) , secret_hash VARCHAR(128), enabled, created_at, rotated_at` — URL public: `/api/v1/plugins/runtime/workflow/webhook/{path_token}`.

## 4. Core (Flyway `V8.0.x`)

### 4.1. `plugin_events`

`id UUID PK, tenant_id UUID NOT NULL, source_plugin VARCHAR(40), entity VARCHAR(80), event_type VARCHAR(40), aggregate_id VARCHAR(80), payload JSONB, idempotency_key VARCHAR(120) UNIQUE, created_at, processed_at NULL` — index `(tenant_id, created_at)` WHERE processed_at IS NULL.

### 4.2. `plugin_event_deliveries`

`id, tenant_id, event_id FK, target_plugin VARCHAR(40), status VARCHAR(16) (PENDING|DELIVERED|FAILED), attempts INTEGER, next_retry_at, last_error, delivered_at` — unique `(event_id, target_plugin)`; index `(status, next_retry_at)`.

### 4.3. `plugin_public_sessions`

`id, tenant_id, plugin_key VARCHAR(40), token_hash VARCHAR(128), expires_at, created_at, ip_hash` — TTL 15 phút; index `(plugin_key, expires_at)`.

## 5. Migration & dữ liệu employee (ADR-S08-004)

- employee V1.2.0: thêm cột `workflow_instance_id UUID NULL` vào `plg_employee_change_requests`; **không drop bảng** `plg_employee_approval_config`/`plg_employee_change_request_steps` ngay — đánh dấu deprecated, data import sang workflow, drop ở phiên bản sau khi verify (giữ rollback).
- Import: config cũ → workflow definition (nếu tenant đã chỉnh khác seed); đề xuất đang PENDING/IN_REVIEW → instance + task đúng `current_step`.

## 6. Kiểm chứng schema

Migration chạy thành công trên PostgreSQL thật (tenant QA + tenant mới); unique/idempotency test (submit trùng, trigger trùng); index đúng (EXPLAIN cho truy vấn inbox `status + due_at`).
