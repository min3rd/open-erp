# [DES-03-API] Đặc Tả RESTful API: Plugin Manager, Phân Phối & Vòng Đời Plugin

- **Mã Tài Liệu**: DES-03-API
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Quy Chuẩn Hợp Đồng**: 100% Code-Based i18n Contract — tuân thủ 4 Khuôn Mẫu Chuẩn trong [api_standards.md](../../../../../.agents/rules/api_standards.md)
- **Ngày Hoàn Thành**: 2026-09-19
- **Tài Liệu Nguồn**: [DES-03-DB](../database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [SOL-01/02/03](../../05_solutions/)

---

## 1. Quy Ước Chung

- **Base path**: Platform `/api/v1/platform/*`; Tenant `/api/v1/tenant/*`; Shared `/api/v1/plugins/*`.
- **Envelope**: `{success, code, message, params, data}`; lỗi: `{success:false, code, message, params, errors[], timestamp}`.
- **Phân trang**: `data.items, page, size, total_items, total_pages`; không phân trang: `data.items`.
- **Mã kết quả**: enum Java `PluginErrorCode` (UPPER_SNAKE_CASE) + `PluginResponseKey` cho payload.
- **Thao tác dài**: trả `operation_id`; client polling `GET /api/v1/plugins/operations/{id}`.
- **Xác thực**: Platform = token `platform_role = SUPER_ADMIN`; Tenant = JWT tenant + `@RequirePermission`.
- **Khóa chống trùng**: header `Idempotency-Key` (tuỳ chọn) cho install/upgrade/uninstall.

---

## 2. ResponseKey & Enum Bổ Sung

| Enum | Giá Trị Tiêu Biểu |
| :--- | :--- |
| `PluginResponseKey` | `plugin_key`, `name_key`, `description_key`, `visibility`, `default_install`, `locked`, `version`, `release_status`, `core_compatibility`, `installed_version`, `latest_version`, `target_version`, `status`, `operation_id`, `storage_model`, `storage_schema`, `render_mode`, `slot_code`, `contributions`, `distribution_type`, `checksum`, `image_ref`, `digest`, `steps`, `affected_tenants` |
| `PluginRenderMode` (enum) | `WEB_COMPONENT`, `MODULE_FEDERATION`, `IFRAME` |
| `TenantPluginStatus` (enum) | Xem DES-03-DB mục 3 |

---

## 3. API Nhóm Platform (SUPER_ADMIN)

| # | Method & Path | Mục Đích | Khuôn Mẫu |
| :---: | :--- | :--- | :--- |
| P1 | `GET /platform/plugins` | Danh sách catalog (phân trang) + filter `q, release_status, visibility, platform, source` | Paginated List |
| P2 | `GET /platform/plugins/{key}` | Chi tiết plugin + phiên bản + thống kê cài đặt | Single |
| P3 | `POST /platform/plugins` | Tạo catalog entry `{plugin_key, name_key, description_key, entitlement_plans, default_install}` | Single |
| P4 | `POST /platform/plugins/artifacts/upload` | Upload bundle (multipart) → MinIO quarantine | Single |
| P5 | `POST /platform/plugins/{key}/versions` | Đăng ký phiên bản từ 3 nguồn (xem 3.1) | Single |
| P6 | `PATCH /platform/plugins/{key}/versions/{version}` | `{action: PUBLISH\|DEPRECATE\|BLOCK, reason}` | Single |
| P7 | `POST /platform/plugins/{key}/block` | Khóa khẩn cấp + cưỡng chế gỡ: `{reason, force_uninstall, confirmations}` → `operation_id` | Single |
| P8 | `DELETE /platform/plugins/{key}` | Gỡ catalog entry (chỉ khi không còn tenant dùng) | Single |
| P9 | `GET /platform/plugins/{key}/installations` | Ma trận tenant đang cài (phân trang) | Paginated List |
| P10 | `POST /platform/plugins/{key}/bulk-apply/preview` | Xem trước danh sách tenant ảnh hưởng → `preview_token` | Single |
| P11 | `POST /platform/plugins/{key}/bulk-apply` | Áp dụng hàng loạt `{preview_token, version, tenant_ids[]?}` → `operation_id` | Single |
| P12 | `PUT /platform/tenants/{tenantId}/plugins/{key}/entitlement` | Cấp entitlement (tạo dòng `NOT_INSTALLED`) | Single |
| P13 | `DELETE /platform/tenants/{tenantId}/plugins/{key}/entitlement` | Thu hồi entitlement | Single |
| P14 | `GET /platform/tenant-private-plugins` | Governance danh sách plugin riêng của mọi tenant | Paginated List |
| P15 | `POST /platform/tenant-private-plugins/{id}/block` | Khóa plugin riêng của tenant `{reason}` | Single |
| P16 | `GET/POST /platform/plugin-credentials` | Danh sách/Tạo credential platform | List/Single |
| P17 | `PATCH/DELETE /platform/plugin-credentials/{id}` | Sửa/Xóa credential | Single |
| P18 | `POST /platform/plugin-credentials/{id}/test` | Kiểm tra kết nối registry | Single |

### 3.1. Đăng Ký Phiên Bản Từ 3 Nguồn (P5)

**Docker Hub / Image Registry**:
```json
{
  "source": "DOCKER_HUB",
  "image_ref": "docker.io/open-erp/plugin-sales",
  "tag": "1.3.0",
  "digest": "sha256:...",
  "credential_id": "uuid|null"
}
```
**Registry riêng**: `source = "IMAGE_REGISTRY"` + `registry_url`, `repository`, `tag`, `digest`, `credential_id`.
**Bundle đã upload (P4)**: `source = "JAR_BUNDLE"` + `artifact_ref` (trả từ P4).

**Response (Single)**:
```json
{
  "success": true,
  "code": "PLUGIN_VERSION_ADD_SUCCESS",
  "message": "Plugin version registered.",
  "params": {},
  "data": {
    "plugin_key": "sales",
    "version": "1.3.0",
    "release_status": "DRAFT",
    "core_compatibility": ">=1.0.0 <2.0.0",
    "distribution_type": "DOCKER_HUB",
    "checksum": "9f2c...",
    "image_ref": "docker.io/open-erp/plugin-sales:1.3.0"
  }
}
```

### 3.2. Khóa Khẩn Cấp (P7)

```json
{ "reason": "CVE-2026-xxxx trong SDK thanh toán", "force_uninstall": true, "confirmations": { "affected_tenants": 5, "confirm_text": "sales" } }
```
→ `data: { "operation_id": "uuid", "blocked": true, "affected_tenants": 5 }`, mã `PLUGIN_BLOCK_STARTED`; notification gửi tới tenant bị ảnh hưởng.

---

## 4. API Nhóm Tenant (Tenant Admin)

| # | Method & Path | Mục Đích | Quyền |
| :---: | :--- | :--- | :--- |
| T1 | `GET /tenant/plugins` | Marketplace: **chỉ plugin được cấp phép** + plugin riêng của tenant | `core:plugin:read` |
| T2 | `GET /tenant/plugins/{key}` | Chi tiết: phiên bản khả dụng, quyền, nền tảng, phụ thuộc | `core:plugin:read` |
| T3 | `POST /tenant/plugins/{key}/install` | Cài `{version?}` → `operation_id` | `core:plugin:install` |
| T4 | `POST /tenant/plugins/{key}/enable` | Bật lại plugin `INACTIVE` | `core:plugin:manage` |
| T5 | `POST /tenant/plugins/{key}/disable` | Tạm tắt (giữ dữ liệu) | `core:plugin:manage` |
| T6 | `POST /tenant/plugins/{key}/upgrade` | Nâng cấp `{target_version}` | `core:plugin:manage` |
| T7 | `POST /tenant/plugins/{key}/uninstall` | Gỡ (soft) `{confirm_keep_data: true}` | `core:plugin:manage` |
| T8 | `POST /tenant/plugins/register` | Đăng ký plugin riêng (`TENANT_PRIVATE`) — 3 nguồn | `core:plugin:register-custom` |
| T9 | `DELETE /tenant/plugins/{key}/catalog` | Xóa catalog plugin riêng (chưa/không còn cài) | `core:plugin:register-custom` |
| T10 | `GET/POST /tenant/plugin-credentials` | Credential registry của tenant | `core:plugin:credential:manage` |
| T11 | `DELETE /tenant/plugin-credentials/{id}` | Xóa credential | `core:plugin:credential:manage` |
| T12 | `GET /tenant/notifications` | Thông báo (phân trang, filter unread) | đăng nhập |
| T13 | `POST /tenant/notifications/{id}/read`, `POST /tenant/notifications/read-all` | Đánh dấu đã đọc | đăng nhập |

### 4.1. Cài Đặt (T3)

```json
{ "version": "1.3.0" }
```
**Response**:
```json
{
  "success": true,
  "code": "PLUGIN_INSTALL_STARTED",
  "message": "Plugin installation started.",
  "params": {},
  "data": { "operation_id": "8f1d...", "plugin_key": "sales", "status": "INSTALLING", "target_version": "1.3.0" }
}
```

### 4.2. Marketplace (T1) — Ví Dụ Item

```json
{
  "plugin_key": "sales",
  "name_key": "PLUGIN_SALES_NAME",
  "description_key": "PLUGIN_SALES_DESCRIPTION",
  "status": "ACTIVE",
  "installed_version": "1.3.0",
  "latest_version": "1.4.0",
  "update_available": true,
  "platforms": { "desktop": true, "mobile": true },
  "is_custom": false
}
```

### 4.3. Đăng Ký Plugin Riêng (T8)

Chỉ khi `tenants.allow_custom_plugins = true`; body giống P5 nhưng `credential_id` thuộc phạm vi TENANT; response trả `visibility = "TENANT_PRIVATE"`; lỗi `PLUGIN_CUSTOM_NOT_ALLOWED` nếu chưa bật.

---

## 5. API Nhóm Shared (Web/Mobile Plugin Host)

| # | Method & Path | Mục Đích | Khuôn Mẫu |
| :---: | :--- | :--- | :--- |
| S1 | `GET /plugins/ui-manifest` | Menu screens + slots + contributions hợp lệ cho tenant/user hiện tại | Single |
| S2 | `GET /plugins/operations/{operationId}` | Tiến trình thao tác (steps, trạng thái, lỗi) | Single |
| S3 | `GET /plugins/runtime/{pluginKey}/health` (nội bộ/gateway) | Trạng thái runtime container của tenant | Single |

### 5.1. UI Manifest (S1)

```json
{
  "success": true,
  "code": "PLUGIN_UI_MANIFEST_SUCCESS",
  "message": "UI manifest retrieved.",
  "params": {},
  "data": {
    "screens": [
      { "plugin_key": "sales", "route": "/apps/sales", "title_key": "PLUGIN_SALES_MENU", "permission": "sales:order:read", "order": 20, "render_mode": "MODULE_FEDERATION" }
    ],
    "slots": [
      {
        "slot_code": "core.dashboard.widgets",
        "contributions": [
          { "plugin_key": "sales", "title_key": "PLUGIN_SALES_WIDGET_REVENUE", "render_mode": "WEB_COMPONENT", "entry": "/plugins-runtime/sales/remote/revenue-widget.js", "permission": "sales:report:read", "order": 10 }
        ]
      }
    ]
  }
}
```

### 5.2. Tiến Trình Thao Tác (S2)

```json
{
  "success": true,
  "code": "PLUGIN_OPERATION_STATUS_SUCCESS",
  "message": "Operation status retrieved.",
  "params": {},
  "data": {
    "operation_id": "8f1d...",
    "operation": "INSTALL",
    "plugin_key": "sales",
    "status": "FAILED",
    "steps": [
      { "step": "PRE_FLIGHT", "result": "OK" },
      { "step": "PROVISION_DATASOURCE", "result": "OK" },
      { "step": "DEPLOY", "result": "FAILED", "error_code": "PLUGIN_DEPLOY_FAILED" }
    ]
  }
}
```

---

## 6. Danh Mục Mã Lỗi (PluginErrorCode — Trích Yếu)

| Nhóm | Mã Lỗi |
| :--- | :--- |
| Artifact | `PLUGIN_ARTIFACT_SOURCE_INVALID`, `PLUGIN_ARTIFACT_DOWNLOAD_FAILED`, `PLUGIN_ARTIFACT_INVALID_MANIFEST`, `PLUGIN_ARTIFACT_CHECKSUM_MISMATCH`, `PLUGIN_ARTIFACT_TOO_LARGE`, `PLUGIN_REGISTRY_NOT_ALLOWED`, `PLUGIN_REGISTRY_AUTH_FAILED`, `PLUGIN_IMAGE_BUILD_FAILED` |
| Catalog | `PLUGIN_KEY_ALREADY_EXISTS`, `PLUGIN_VERSION_ALREADY_EXISTS`, `PLUGIN_VERSION_IN_USE`, `PLUGIN_CORE_VERSION_INCOMPATIBLE`, `PLUGIN_ENTITY_NOT_REGISTERED`, `PLUGIN_UI_SLOT_NOT_FOUND`, `PLUGIN_NOT_FOUND` |
| Dependency | `PLUGIN_DEPENDENCY_MISSING`, `PLUGIN_HAS_DEPENDENTS` (kèm `params.removal_plan[]`) |
| Entitlement/Lifecycle | `PLUGIN_NOT_ENTITLED`, `PLUGIN_CUSTOM_NOT_ALLOWED`, `PLUGIN_ALREADY_INSTALLED`, `PLUGIN_NOT_INSTALLED`, `PLUGIN_DISABLED_FOR_TENANT`, `PLUGIN_LOCKED_DEFAULT`, `PLUGIN_OPERATION_IN_PROGRESS`, `PLUGIN_BLOCKED_BY_PLATFORM`, `PLATFORM_PLUGIN_NOT_ALLOWED` (kế thừa) |
| Runtime/Deploy | `PLUGIN_TENANT_DATASOURCE_FAILED`, `PLUGIN_DEPLOY_FAILED`, `PLUGIN_SERVICE_UNHEALTHY`, `PLUGIN_RESOURCE_QUOTA_EXCEEDED`, `PLUGIN_IN_USE_BY_TENANTS` |
| Credential | `PLUGIN_CREDENTIAL_NOT_FOUND`, `PLUGIN_CREDENTIAL_DUPLICATE_HOST`, `PLUGIN_CREDENTIAL_IN_USE`, `PLUGIN_CREDENTIAL_AUTH_FAILED` |

> Chi tiết `params` và i18n key bổ sung vào `vi.json`/`en.json` khi triển khai (FEAT-21/23).

---

## 7. Ma Trận Phân Quyền (Permission Matrix)

| Quyền | TENANT_OWNER | TENANT_ADMIN | Vai trò khác |
| :--- | :---: | :---: | :---: |
| `core:plugin:read` | ✔ | ✔ | gán thêm nếu cần |
| `core:plugin:install` | ✔ | ✔ | ✖ |
| `core:plugin:manage` (enable/disable/upgrade/uninstall) | ✔ | ✔ | ✖ |
| `core:plugin:register-custom` | ✔ | ✔ *(chỉ khi allow_custom_plugins)* | ✖ |
| `core:plugin:credential:manage` | ✔ | ✔ | ✖ |

- Platform API chỉ `SUPER_ADMIN` (giữ nguyên chốt chặn Sprint 02); `SUPPORT_ENGINEER` chỉ xem.
- Quyền plugin-manager được seed khi migration V3.0.0; **quyền riêng của từng plugin** seed theo BR-PLG-12 (chỉ `TENANT_OWNER` nhận tự động).

---

## 8. Ghi Chú Tích Hợp

1. **Tương thích Sprint 02**: `GET /platform/plugins` cũ được mở rộng (thêm trường) nhưng giữ khuôn mẫu Non-Paginated/Paginated tùy chọn ban đầu; `PATCH /platform/tenants/{id}/quotas` đọc/ghi `allowed_plugins` suy ra từ `tenant_plugins`.
2. **Proxy runtime**: gateway Core forward request tới container plugin theo `(tenant_id, plugin_key)`; đường dẫn nội bộ phục vụ UI Asset/API — đặc tả kỹ thuật tại deployment guide (Bước 7).
3. **Tài liệu UI** dùng S1 làm nguồn dữ liệu duy nhất cho menu/slot/contribution — xem [DES-03-UI](../ui_ux/PLUGIN_MANAGER_UI_SPEC.md).
