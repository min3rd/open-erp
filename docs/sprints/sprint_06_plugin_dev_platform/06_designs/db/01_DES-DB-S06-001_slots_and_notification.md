# [DES-DB-S06-001] Thiết kế DB — slot registry & plugin notification

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S06-001 / Thiết kế CSDL / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.0 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Developer + QA |
| Đầu vào | [ADR-S06-001](../../05_solutions/02_ADR-S06-001_core_rendered_ui_slots.md), [DES-API-S06-001](../api/01_DES-API-S06-001_manifest_and_ui_manifest.md) |
| Đọc trước / đọc tiếp | [DES-API-S06-001](../api/01_DES-API-S06-001_manifest_and_ui_manifest.md) / [DES-UI-S06-001](../ui/01_DES-UI-S06-001_slots_layout_and_settings.md) |

## 1. Phạm vi

Sprint 06 **không thêm bảng Core mới** cho slot; dùng `plugin_ui_slots` hiện có và seed thêm slot. Plugin `in-app-notification` có schema riêng do plugin sở hữu (zero-DB, core chạy migration bundle). Catalog migrate UI, không đổi DB.

## 2. Core: `plugin_ui_slots`

### 2.1. Cấu trúc hiện có

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `slot_code` | VARCHAR(120) | unique theo host/contract |
| `host_type` | VARCHAR(16) | `CORE`/`PLUGIN` |
| `owner_plugin_key` | VARCHAR(100) | null nếu Core |
| `declared_in_version` | VARCHAR(32) | version plugin |
| `title_key` | VARCHAR(120) | i18n |
| `contract_version` | VARCHAR(16) | mặc định 1.0 |
| `allowed_render_modes` | JSONB | `["WEB_COMPONENT","MODULE_FEDERATION"]` |
| `constraints` | JSONB | max_contributions, min_height, platforms |
| `status` | VARCHAR(16) | ACTIVE/DEPRECATED |
| `created_at`/`updated_at` | TIMESTAMPTZ | audit |

Nguồn: `V3.0.0__plugin_manager_schema.sql`.

### 2.2. Seed slot v1

Migration mới `V6.0.0__plugin_ui_slots_v1.sql`:

```sql
ALTER TABLE plugin_ui_slots
  ALTER COLUMN allowed_render_modes
  SET DEFAULT '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb;

UPDATE plugin_ui_slots
SET allowed_render_modes = '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
    updated_at = NOW()
WHERE host_type = 'CORE';

INSERT INTO plugin_ui_slots
  (slot_code, host_type, title_key, contract_version, allowed_render_modes, constraints, status, created_at, updated_at)
VALUES
  ('core.layout.header.actions', 'CORE', 'PLUGIN_SLOT_CORE_HEADER_ACTIONS', '1.0',
   '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
   '{"max_contributions":6,"min_height_px":32,"platforms":["desktop","mobile"]}'::jsonb, 'ACTIVE', NOW(), NOW()),
  ('core.settings.system.tabs', 'CORE', 'PLUGIN_SLOT_CORE_SETTINGS_TABS', '1.0',
   '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
   '{"max_contributions":12,"min_height_px":320,"platforms":["desktop"]}'::jsonb, 'ACTIVE', NOW(), NOW())
ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO UPDATE
  SET allowed_render_modes = EXCLUDED.allowed_render_modes,
      constraints = EXCLUDED.constraints,
      updated_at = NOW();
```

- `core.dashboard.widgets` và `core.settings.sections` giữ nguyên; cập nhật `allowed_render_modes` bỏ `IFRAME` nếu có.
- Không seed slot plugin-hosted; sync từ manifest khi publish.

### 2.3. Ràng buộc

- `host_type='CORE'` ⇒ `owner_plugin_key IS NULL`.
- `host_type='PLUGIN'` ⇒ `owner_plugin_key` bắt buộc; `slot_code` bắt đầu `<owner_plugin_key>.`.
- `slot_code` unique với Core; với plugin unique `(owner, slot_code, contract_version)`.
- `status='DEPRECATED'` không nhận contribution mới.

### 2.4. Không đổi

- Không thêm `tenant_id` vào slot registry: slot là metadata toàn cục; quyền/lifecycle lọc theo tenant khi trả manifest.
- Không lưu contribution vào DB; manifest version là nguồn sự thật.

## 3. Plugin `in-app-notification` (schema riêng)

### 3.1. Bảng `plg_in_app_notification_notifications`

```sql
CREATE TABLE plg_in_app_notification_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- required by the gateway tenant predicate
  recipient_id UUID NOT NULL,
  recipient_text VARCHAR(255) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL,
  body TEXT,
  level VARCHAR(16) NOT NULL DEFAULT 'INFO',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_notification_level CHECK (level IN ('INFO','WARN','ERROR'))
);

CREATE INDEX idx_notification_recipient_created
  ON plg_in_app_notification_notifications (recipient_id, created_at DESC);

CREATE INDEX idx_notification_recipient_unread
  ON plg_in_app_notification_notifications (recipient_id, read_at)
  WHERE read_at IS NULL;
```

- `tenant_id` bắt buộc bởi **Plugin Data Gateway** (tenant predicate tự sinh); schema vẫn là tenant riêng, nên giá trị này do gateway set và không lộ ra API.
- `recipient_id` là soft ref `core.user`; `recipient_text` snapshot hiển thị.
- `read_at NULL` = chưa đọc.

### 3.2. Bảng `plg_in_app_notification_preferences`

```sql
CREATE TABLE plg_in_app_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- required by the gateway tenant predicate
  user_id UUID NOT NULL,
  channel_email BOOLEAN NOT NULL DEFAULT FALSE,
  channel_in_app BOOLEAN NOT NULL DEFAULT TRUE,
  level_min VARCHAR(16) NOT NULL DEFAULT 'INFO',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_pref_user UNIQUE (user_id),
  CONSTRAINT ck_notification_pref_level CHECK (level_min IN ('INFO','WARN','ERROR'))
);
```

- Lưu theo user trong schema tenant; `user_id` soft ref Core.
- Tab cấu hình đọc/ghi bảng này.

### 3.3. Migration & quyền

- `migrations/V1.0.0__initial_schema.sql` + SHA-256 trong `plugin.json`.
- Permissions: `in-app-notification:notification:read`, `:manage`, `:settings:manage`.
- Query descriptors: list theo recipient, unread count, mark read, preferences get/upsert.

## 4. Catalog

- Không đổi bảng/dữ liệu.
- Chỉ đổi `plugin.json.ui_manifest.screens` và UI bundle.
- Không cần migration core; nếu cần rollback, đổi manifest/image về bản trước.

## 5. Tenant isolation & audit

| Chủ đề | Cách đảm bảo |
| :--- | :--- |
| Tenant | Mọi bảng plugin nằm trong schema `tenant_<short>_<plugin>`; gateway set `search_path` + `app.tenant_id` |
| Core user | Soft ref UUID; không FK xuyên schema; validate qua API/registry |
| Audit | Mutation notification ghi `created_at/updated_at`; audit đầy đủ là follow-up |
| Slot registry | Toàn cục; manifest lọc theo tenant/lifecycle/quyền |
| Migration | Core chạy bundle, checksum; plugin không có credential DB |

## 6. Rollback

| Thay đổi | Rollback |
| :--- | :--- |
| Seed slot mới | `DELETE FROM plugin_ui_slots WHERE slot_code IN (...)` hoặc status DEPRECATED |
| Notification tables | Down migration `DROP TABLE` (chỉ khi gỡ plugin; giữ dữ liệu nếu disable) |
| Catalog manifest | Trả version/image cũ; giữ WC code nếu đã build |
| Core DTO/API | Không phá contract; field mới optional |

## 7. Kiểm thử DB

- PostgreSQL thật: seed slot idempotent, unique constraint, plugin slot namespace.
- Notification: insert/list/unread/mark read/preferences; tenant A không thấy tenant B.
- Migration checksum mismatch bị từ chối.
- Catalog: không có thay đổi DB; regression API.

## 7.1. Addendum Q19 — notification settings (2026-10-29)

- Core `V6.1.0__platform_notification_settings.sql`: bảng singleton `platform_notification_settings` (`display_name`, `support_email`, `channel_email`, `channel_in_app`, `level_min`, `updated_at`, `updated_by`).
- Plugin `V1.0.1`: `plg_in_app_notification_preferences` thêm `scope` (`USER`/`TENANT`), `display_name`, `support_email`; unique index theo scope.
- Plugin `V1.0.2`: cho phép null `channel_email`, `channel_in_app`, `level_min` để tenant kế thừa platform.
- Tenant row: `scope='TENANT'`, `user_id=NULL`; user row giữ `scope='USER'`.
- Core `V6.2.0__drop_tenant_notifications.sql`: bỏ hẳn bảng `tenant_notifications` cũ (Q19/Q20); audit plugin vẫn ghi qua `PluginAuditService`.

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Seed slot v1; bảng notification/preferences; tenant isolation/rollback/test | Architect; ADR/DES-API-S06 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Seed slot v1; bảng notification/preferences; tenant isolation/rollback/test | Architect; ADR/DES-API-S06 |
