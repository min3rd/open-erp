# [DES-API-S06-001] Manifest 2.0 & UI Manifest API

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S06-001 / Thiết kế API / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.0 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Developer + QA |
| Đầu vào | [SOL-S06-001](../../05_solutions/01_SOL-S06-001_template_and_cli_architecture.md), [ADR-S06-001](../../05_solutions/02_ADR-S06-001_core_rendered_ui_slots.md), [PLUGIN_MANAGER_API_SPEC](../../../sprint_03_plugin_manager/06_designs/api/PLUGIN_MANAGER_API_SPEC.md) |
| Đọc trước / đọc tiếp | [DES-ARCH-S06-002](../arch/02_DES-ARCH-S06-002_cli_interactive_and_codegen.md) / [DES-DB-S06-001](../db/01_DES-DB-S06-001_slots_and_notification.md), [DES-UI-S06-001](../ui/01_DES-UI-S06-001_slots_layout_and_settings.md) |

## 1. Mục đích

Chốt schema `plugin.json` 2.0 và contract `GET /api/v1/plugins/ui-manifest` sau Sprint 06, đủ cho:

- CLI sinh/validate manifest.
- Core render slot/contribution.
- Plugin-hosted slot.
- Catalog chuyển từ iframe sang Web Component.

Tuân thủ 4 khuôn mẫu response và `code` UPPER_SNAKE_CASE.

## 2. Manifest 2.0

### 2.1. Cấu trúc tổng

```json
{
  "schema_version": "2.0",
  "id": "in-app-notification",
  "name": "In-app Notification",
  "version": "1.0.0",
  "template_version": "2.0.0",
  "core_version_compatibility": ">=1.0.0 <2.0.0",
  "packaging": "image",
  "platforms": {
    "desktop": { "supported": true, "features": ["notification:read", "notification:manage"] },
    "mobile": { "supported": true, "features": ["notification:read"] }
  },
  "permissions": [
    { "code": "in-app-notification:notification:read", "name": "Notification read" },
    { "code": "in-app-notification:notification:manage", "name": "Notification manage" }
  ],
  "entities": [],
  "relations": [],
  "queries": [],
  "migrations": [],
  "ui_manifest": {
    "contract_version": "1.0",
    "screens": [],
    "slots": [],
    "contributions": [],
    "crud": []
  },
  "distribution": {}
}
```

### 2.2. Entity & field

```json
{
  "name": "Notification",
  "table": "plg_in_app_notification_notifications",
  "storage_scope": "TENANT",
  "fields": [
    { "name": "title", "type": "string", "required": true, "max_length": 255 },
    { "name": "body", "type": "text", "required": false },
    { "name": "level", "type": "enum", "enum_values": ["INFO", "WARN", "ERROR"], "default": "INFO" },
    { "name": "read_at", "type": "datetime", "required": false },
    { "name": "recipient_id", "type": "uuid", "required": true }
  ],
  "validators": [
    { "field": "title", "rule": "max_length", "value": 255 },
    { "field": "level", "rule": "enum", "value": ["INFO", "WARN", "ERROR"] }
  ]
}
```

| Field type | Java | SQL | Validator hỗ trợ |
| :--- | :--- | :--- | :--- |
| `string` | `String` | `VARCHAR(n)` | `required`, `min_length`, `max_length`, `pattern`, `email` |
| `text` | `String` | `TEXT` | `required`, `max_length` |
| `int` | `Integer`/`Long` | `INTEGER`/`BIGINT` | `min`, `max` |
| `decimal` | `BigDecimal` | `NUMERIC(18,4)` | `min`, `max`, `scale` |
| `bool` | `Boolean` | `BOOLEAN` | — |
| `date` | `LocalDate` | `DATE` | `min`, `max` |
| `datetime` | `Instant` | `TIMESTAMPTZ` | `min`, `max` |
| `enum` | `Java enum` | `VARCHAR(n)` + check | `enum_values` bắt buộc |
| `json` | `JsonNode`/`Map` | `JSONB` | `schema` tùy chọn |
| `uuid` | `UUID` | `UUID` | — |

**Quy tắc:** `required=true` ⇒ `NOT NULL`; `unique=true` ⇒ unique index trong schema plugin; `default` phải đúng kiểu; `max_length` bắt buộc với `string` nếu unique.

### 2.3. Relation

```json
{
  "name": "recipient",
  "owner_entity": "Notification",
  "type": "MANY_TO_ONE",
  "target": "core.user",
  "storage": "SOFT_REF",
  "target_display_field": "full_name",
  "required": true,
  "on_delete": "RESTRICT"
}
```

| Trường | Bắt buộc | Quy tắc |
| :--- | :--- | :--- |
| `name` | ✅ | unique trong entity; kebab/snake |
| `owner_entity` | ✅ | entity cùng plugin |
| `type` | ✅ | `MANY_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_MANY` |
| `target` | ✅ | `self.<Entity>`, `core.<entity>`, `plugin:<key>.<Entity>` |
| `storage` | ✅ | `FK` chỉ với `self.*`; `SOFT_REF` với `core.*`/`plugin:*.*` |
| `target_display_field` | SOFT_REF | field public của target |
| `on_delete` | ✅ | `RESTRICT`, `SET_NULL`, `NO_ACTION`; FK hỗ trợ `CASCADE` nếu khai báo rõ |

- Soft ref lưu `<name>_id` + `<name>_text`; `target_text` snapshot.
- FK cùng plugin lưu `<name>_id` + constraint.
- Không FK xuyên schema.

### 2.4. UI screens

```json
{
  "route": "/apps/in-app-notification",
  "title_key": "PLUGIN_IN_APP_NOTIFICATION_MENU",
  "permission": "in-app-notification:notification:read",
  "render_mode": "WEB_COMPONENT",
  "entry": "/plugins-runtime/in-app-notification/main.js",
  "tag_name": "op-in-app-notification-app",
  "order": 100,
  "platforms": ["desktop", "mobile"],
  "read_only": false
}
```

| Trường | Bắt buộc | Ghi chú |
| :--- | :--- | :--- |
| `route` | ✅ | `/apps/<pluginKey>` hoặc sub-path |
| `title_key` | ✅ | i18n key |
| `permission` | ❌ | null = mọi user |
| `render_mode` | ✅ | `WEB_COMPONENT`/`MODULE_FEDERATION`; **`IFRAME` không hợp lệ** |
| `entry` | ❌ | mặc định `/plugins-runtime/<key>/main.js` (WC) hoặc `/remoteEntry.js` (MF) |
| `tag_name` | WC | mặc định `plugin-<key>` |
| `exposed_module` | MF | mặc định `./mount` |
| `platforms` | ✅ | `desktop`/`mobile` |
| `read_only` | ❌ | mobile read-only |

### 2.5. UI slots (plugin-hosted)

```json
{
  "slot_code": "crm.customer.detail.tabs",
  "title_key": "PLUGIN_CRM_SLOT_CUSTOMER_TABS",
  "contract_version": "1.2",
  "allowed_render_modes": ["WEB_COMPONENT", "MODULE_FEDERATION"],
  "constraints": { "max_contributions": 8, "min_height_px": 120 }
}
```

- `slot_code` phải bắt đầu bằng `<pluginKey>.`; không `core.*`.
- Core sync `plugin_ui_slots` khi publish; manifest version host là nguồn sự thật runtime.

### 2.6. UI contributions

```json
{
  "id": "notification-bell",
  "slot": "core.layout.header.actions",
  "title_key": "PLUGIN_IN_APP_NOTIFICATION_HEADER",
  "render_mode": "WEB_COMPONENT",
  "entry": "/plugins-runtime/in-app-notification/contributions/header.js",
  "tag_name": "op-in-app-notification-bell",
  "permission": "in-app-notification:notification:read",
  "order": 10,
  "contract_version": "1.0",
  "platforms": ["desktop", "mobile"],
  "icon": "bell"
}
```

| Trường | Bắt buộc | Quy tắc |
| :--- | :--- | :--- |
| `id` | ✅ | unique trong plugin; `[a-z0-9-]+` |
| `slot` | ✅ | core slot hoặc plugin-hosted slot tồn tại |
| `title_key` | ✅ | i18n |
| `render_mode` | ✅ | WC/MF |
| `entry` | ✅ | path runtime, không URL ngoài |
| `tag_name` | WC | bắt buộc nếu WC |
| `exposed_module` | MF | mặc định `./mount` |
| `permission` | ❌ | null = mọi user |
| `order` | ❌ | mặc định 100 |
| `contract_version` | ✅ | khớp major slot |
| `platforms` | ❌ | mặc định `["desktop"]` |
| `icon` | ❌ | tên icon shared |

### 2.7. CRUD metadata (codegen)

```json
{
  "entity": "Notification",
  "route": "/apps/in-app-notification/notifications",
  "columns": ["title", "level", "read_at", "created_at"],
  "filters": ["level", "read_at"],
  "form_fields": ["title", "body", "level"],
  "layout": "drawer"
}
```

Dùng để validate/tái sinh; UI thực tế do codegen tạo. Không thay thế code.

### 2.8. Migrations

```json
{
  "migrations": [
    {
      "version": "1.0.0",
      "file": "V1.0.0__initial_schema.sql",
      "checksum": "sha256:9f2c...e1"
    }
  ]
}
```

- Core chạy migration bundle khi install/upgrade; checksum bắt buộc.
- Không có `tenant_id` trong DDL schema tenant.

## 3. UI Manifest API

### 3.1. Endpoint

`GET /api/v1/plugins/ui-manifest`

- Auth: user đã đăng nhập; tenant context từ token.
- Chỉ trả plugin `ACTIVE`, visibility phù hợp, quyền user.
- Response single resource theo khuôn mẫu 1.

### 3.2. Response

```json
{
  "success": true,
  "code": "PLUGIN_UI_MANIFEST_SUCCESS",
  "message": "UI manifest retrieved.",
  "params": {},
  "data": {
    "contract_version": "1.0",
    "screens": [
      {
        "plugin_key": "in-app-notification",
        "route": "/apps/in-app-notification",
        "title_key": "PLUGIN_IN_APP_NOTIFICATION_MENU",
        "permission": "in-app-notification:notification:read",
        "order": 100,
        "render_mode": "WEB_COMPONENT",
        "entry": "/plugins-runtime/in-app-notification/main.js",
        "tag_name": "op-in-app-notification-app",
        "platforms": ["desktop", "mobile"],
        "read_only": false
      }
    ],
    "slots": [
      {
        "slot_code": "core.layout.header.actions",
        "host": { "type": "CORE", "contract_version": "1.0" },
        "contributions": [
          {
            "id": "notification-bell",
            "plugin_key": "in-app-notification",
            "title_key": "PLUGIN_IN_APP_NOTIFICATION_HEADER",
            "render_mode": "WEB_COMPONENT",
            "entry": "/plugins-runtime/in-app-notification/contributions/header.js",
            "tag_name": "op-in-app-notification-bell",
            "permission": "in-app-notification:notification:read",
            "order": 10,
            "contract_version": "1.0",
            "platforms": ["desktop", "mobile"],
            "icon": "bell"
          }
        ]
      }
    ]
  }
}
```

### 3.3. Thay đổi DTO

| DTO | Thêm |
| :--- | :--- |
| `UiContribution` | `id`, `tagName`, `exposedModule`, `platforms` |
| `UiScreen` | `entry?`, `tagName?`, `exposedModule?`, `platforms`, `readOnly?` |
| `UiManifest` | `contractVersion` |
| `UiSlot` | giữ nguyên; `host` đã có |

- `PluginResponseKey` thêm `ID`, `TAG_NAME`, `EXPOSED_MODULE`, `PLATFORMS`, `READ_ONLY`.
- Không trả message tiếng Việt; frontend dịch theo `code`.

## 4. API phụ trợ cho CLI `--core-url`

| Method/path | Mục đích | Quyền |
| :--- | :--- | :--- |
| `GET /api/v1/plugins/entity-registry?entity=core.user` | Target entity + public fields | `core:plugin:read` |
| `GET /api/v1/plugins/ui-slots?slot=core.layout.header.actions` | Slot code + contract + allowed modes | `core:plugin:read` |
| `GET /api/v1/plugins/ui-slots?owner=<pluginKey>` | Slot do plugin khai báo | `core:plugin:read` |

Response dùng khuôn mẫu single/non-paginated; `data.items` nếu list.

## 5. Mã lỗi

| Code | HTTP | Khi nào |
| :--- | :--- | :--- |
| `PLUGIN_MANIFEST_SCHEMA_INVALID` | 400 | Manifest sai schema/field/relation |
| `PLUGIN_UI_RENDER_MODE_UNSUPPORTED` | 400 | `IFRAME` hoặc mode lạ |
| `PLUGIN_UI_SLOT_NOT_FOUND` | 400 | Contribution trỏ slot không tồn tại |
| `PLUGIN_UI_SLOT_CONTRACT_MISMATCH` | 409 | Contract version lệch |
| `PLUGIN_UI_CONTRIBUTION_INVALID` | 400 | Thiếu tag_name/exposed_module/entry |
| `PLUGIN_UI_SLOT_NAMESPACE_INVALID` | 400 | Plugin slot không bắt đầu `<pluginKey>.` |
| `PLUGIN_ENTITY_TARGET_NOT_FOUND` | 400 | Relation target không có registry |
| `PLUGIN_MIGRATION_CHECKSUM_MISMATCH` | 400 | SHA-256 sai |

## 6. Tương thích & migration

1. Manifest cũ không có `schema_version` ⇒ đọc như 1.0; `render_mode: IFRAME` bị từ chối khi publish sau S06.
2. Core UI Manifest thêm field mới; frontend cũ bỏ qua field lạ.
3. Catalog cập nhật manifest sang WC trước khi xoá enum `IFRAME`.
4. Template/CLI chỉ sinh `schema_version: 2.0`; `upgrade --check` báo manifest cũ.

## 7. Ví dụ catalog sau migrate

```json
{
  "route": "/apps/catalog",
  "title_key": "CATALOG_SECTION_TITLE",
  "permission": "catalog:item:read",
  "render_mode": "WEB_COMPONENT",
  "entry": "/plugins-runtime/catalog/main.js",
  "tag_name": "op-catalog-app",
  "order": 150,
  "platforms": ["desktop"]
}
```

Mobile thêm screen `platforms: ["mobile"], read_only: true`; platform system `route: "/platform/apps/catalog"`, `permission: "catalog:system:manage"`.

## 7.1. Addendum Q19 — notification settings (2026-10-29)

- `GET/PUT /api/v1/platform/notification-settings`: platform admin đọc/ghi defaults (`display_name`, `support_email`, `channel_email`, `channel_in_app`, `level_min`).
- `GET /api/v1/tenant/notification-defaults`: tenant admin đọc defaults (read-only, permission `core:tenant:settings-manage`).
- Plugin: `GET/PUT /api/v1/in-app-notification/settings` — tenant override; field null = kế thừa platform default.
- Response dùng 4 khuôn mẫu chuẩn; code `NOTIFICATION_SETTINGS_SUCCESS`, `NOTIFICATION_SETTINGS_SAVED`, `IN_APP_NOTIFICATION_SETTINGS_*`.

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Schema manifest 2.0, UI Manifest API, field/relation/slot/contribution, error codes | Architect; SOL/ADR-S06 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Schema manifest 2.0, UI Manifest API, field/relation/slot/contribution, error codes | Architect; SOL/ADR-S06 |
