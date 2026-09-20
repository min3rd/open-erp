# [DES-03-DB] Thiết Kế Chi Tiết Cơ Sở Dữ Liệu: Plugin Manager, Phân Phối & Vòng Đời Plugin

- **Mã Tài Liệu**: DES-03-DB
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Hệ Quản Trị CSDL**: PostgreSQL 16+
- **Schema**: `public` (dữ liệu quản trị plugin) + schema riêng theo tenant cho **dữ liệu nghiệp vụ của plugin** (`tenant_<short>_<plugin_key>` — do plugin tự tạo/migrate)
- **Ngày Hoàn Thành**: 2026-09-19
- **Tài Liệu Nguồn**: [SOL-01](../../05_solutions/SOL-01_plugin_manager_architecture_and_lifecycle.md), [SOL-02](../../05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md), [ANL-01 v1.4](../../02_analysis/ANL-01_plugin_manager_lifecycle.md)

---

## 1. Sơ Đồ Quan Hệ Thực Thể Tổng Thể (ERD)

```mermaid
erDiagram
    tenants ||--o{ tenant_plugins : "sở hữu"
    plugin_catalog ||--o{ plugin_versions : "có nhiều phiên bản"
    plugin_catalog ||--o{ tenant_plugins : "được cài"
    tenants ||--o{ plugin_credentials : "credential riêng"
    plugin_catalog ||--o{ plugin_ui_slots : "khai báo slot (host)"
    tenant_plugins ||--o{ plugin_operation_logs : "tiến trình"
    tenants ||--o{ tenant_notifications : "nhận thông báo"
```

> **Lưu ý kiến trúc**: `plugin_catalog` chỉ chứa **plugin tùy chọn** (Core modules tách riêng). Dữ liệu nghiệp vụ do plugin sinh ra **không nằm trong schema `public`** mà ở schema riêng từng `(tenant, plugin)` — Core không kết nối tới các schema này.

---

## 2. Chi Tiết Các Bảng Dữ Liệu

### 2.1. Bảng `plugin_catalog` (Danh Mục Plugin Tùy Chọn)

```sql
CREATE TABLE plugin_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_key VARCHAR(100) NOT NULL,
    name_key VARCHAR(120) NOT NULL,
    description_key VARCHAR(120) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PLATFORM',          -- PLATFORM | TENANT_PRIVATE
    owner_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    default_install BOOLEAN NOT NULL DEFAULT FALSE,               -- Q5: cài mặc định cấp hệ thống
    locked BOOLEAN NOT NULL DEFAULT FALSE,                        -- plugin mặc định bắt buộc: không tắt/gỡ
    is_core BOOLEAN NOT NULL DEFAULT FALSE,                       -- luôn FALSE (Core tách riêng — Q4)
    entitlement_plans JSONB NOT NULL DEFAULT '[]'::jsonb,         -- ["STANDARD","ENTERPRISE"]
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plugin_visibility CHECK (
        (visibility = 'PLATFORM'      AND owner_tenant_id IS NULL     AND is_core = FALSE)
        OR
        (visibility = 'TENANT_PRIVATE' AND owner_tenant_id IS NOT NULL AND is_core = FALSE AND default_install = FALSE)
    )
);

-- Khóa duy nhất TOÀN CỤC cho mọi plugin (kể cả TENANT_PRIVATE) — nhất quán BR-PLG-02.
-- ⇒ ledger, dependencies, UI slot, API path {plugin_key} không bao giờ mơ hồ.
-- Gợi ý đặt tên plugin riêng theo tenant-slug: acme-hrm, acme-pos...
CREATE UNIQUE INDEX uq_plugin_catalog_key ON plugin_catalog (plugin_key);

CREATE INDEX idx_plugin_catalog_default_install ON plugin_catalog (default_install) WHERE visibility = 'PLATFORM';
CREATE INDEX idx_plugin_catalog_owner ON plugin_catalog (owner_tenant_id) WHERE visibility = 'TENANT_PRIVATE';
```

### 2.2. Bảng `plugin_versions` (Phiên Bản Bất Biến)

```sql
CREATE TABLE plugin_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID NOT NULL REFERENCES plugin_catalog(id) ON DELETE CASCADE,
    version VARCHAR(32) NOT NULL,                               -- SemVer: MAJOR.MINOR.PATCH
    release_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',        -- DRAFT | PUBLISHED | DEPRECATED | BLOCKED
    core_compatibility VARCHAR(64) NOT NULL,                    -- ví dụ: >=1.0.0 <2.0.0
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,            -- [{"key":"inventory","min_version":"1.1.0"}]
    platforms JSONB NOT NULL DEFAULT '{}'::jsonb,               -- {"desktop":{...},"mobile":{...}}
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,             -- ["sales:order:read", ...]
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,                -- [{"name":"SaleOrder","table":"...","public_fields":[...]}]
    ui_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,             -- {"screens":[...],"slots":[...],"contributions":[...]}
    distribution JSONB NOT NULL DEFAULT '{}'::jsonb,            -- {"type":"DOCKER_HUB|IMAGE_REGISTRY|JAR_BUNDLE","image_ref":"...","digest":"sha256:...","checksum":"...","bundle_ref":"minio://...","size_bytes":123}
    manifest JSONB NOT NULL,                                    -- plugin.json gốc (bất biến sau công bố)
    migration_policy VARCHAR(16) NOT NULL DEFAULT 'COMPATIBLE', -- COMPATIBLE | BREAKING (bắt buộc snapshot trước nâng cấp)
    template_version VARCHAR(32),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    publish_reason TEXT,
    block_reason TEXT,
    blocked_at TIMESTAMPTZ,
    CONSTRAINT uq_plugin_version UNIQUE (catalog_id, version),
    CONSTRAINT chk_release_status CHECK (release_status IN ('DRAFT','PUBLISHED','DEPRECATED','BLOCKED'))
);

CREATE INDEX idx_plugin_versions_catalog_status ON plugin_versions (catalog_id, release_status);
```

### 2.3. Bảng `tenant_plugins` (MỘT BẢNG DUY NHẤT — Entitlement + Vòng Đời + Phiên Bản + Deploy)

```sql
CREATE TABLE tenant_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES plugin_catalog(id) ON DELETE RESTRICT,
    plugin_key VARCHAR(100) NOT NULL,                           -- denormalized để tra cứu nhanh
    status VARCHAR(24) NOT NULL DEFAULT 'NOT_INSTALLED',
    installed_version VARCHAR(32),
    target_version VARCHAR(32),
    storage_model VARCHAR(24) NOT NULL DEFAULT 'DEDICATED_SCHEMA', -- DEDICATED_SCHEMA | DEDICATED_DATABASE
    storage_schema VARCHAR(63),                                 -- tenant_<short>_<plugin_key>
    deploy_ref JSONB NOT NULL DEFAULT '{}'::jsonb,              -- {"runtime":"kubernetes|docker","deployment":"...","service":"...","healthy":true}
    last_error_code VARCHAR(80),
    last_error_params JSONB,
    operation_id UUID,                                          -- thao tác đang chạy (nếu có)
    row_version INT NOT NULL DEFAULT 0,                         -- optimistic lock
    installed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    uninstalled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_plugin UNIQUE (tenant_id, plugin_key),
    CONSTRAINT chk_tenant_plugin_status CHECK (status IN (
        'NOT_INSTALLED','INSTALLING','ACTIVE','INACTIVE','UPGRADING',
        'INSTALL_FAILED','ROLLBACK_FAILED','UNINSTALLING','UNINSTALLED'
    )),
    CONSTRAINT chk_tenant_plugin_storage CHECK (storage_model IN ('DEDICATED_SCHEMA','DEDICATED_DATABASE'))
);

CREATE INDEX idx_tenant_plugins_tenant_status ON tenant_plugins (tenant_id, status);
CREATE INDEX idx_tenant_plugins_plugin_status ON tenant_plugins (plugin_key, status);
CREATE INDEX idx_tenant_plugins_operation ON tenant_plugins (operation_id) WHERE operation_id IS NOT NULL;
```

> **Quan hệ entitlement**: sự tồn tại của dòng = tenant được cấp phép plugin; `status = 'NOT_INSTALLED'` = đã cấp phép nhưng chưa cài. Thu hồi entitlement = xóa dòng (chỉ khi chưa từng cài hoặc đã `UNINSTALLED`).

**Ràng buộc phạm vi (BUG-85 — bắt buộc)**:
```sql
-- Tenant chỉ được cài plugin PLATFORM hoặc plugin riêng CỦA CHÍNH tenant
CREATE OR REPLACE FUNCTION check_tenant_plugin_scope() RETURNS trigger AS $$
DECLARE v_visibility VARCHAR(20); v_owner UUID;
BEGIN
    SELECT visibility, owner_tenant_id INTO v_visibility, v_owner
    FROM plugin_catalog WHERE id = NEW.catalog_id;
    IF v_visibility = 'TENANT_PRIVATE' AND v_owner <> NEW.tenant_id THEN
        RAISE EXCEPTION 'PLUGIN_NOT_ENTITLED: tenant % cannot use private plugin of tenant %', NEW.tenant_id, v_owner;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_plugin_scope
BEFORE INSERT OR UPDATE ON tenant_plugins
FOR EACH ROW EXECUTE FUNCTION check_tenant_plugin_scope();
```
Ngoài trigger, tầng service bắt buộc kiểm tra `visibility` + `owner_tenant_id` khi cấp entitlement/đăng ký plugin riêng; tenant không bao giờ thấy hoặc cài plugin riêng của tenant khác.

### 2.4. Bảng `plugin_credentials` (Credentials Đa Phạm Vi — Q7)

```sql
CREATE TABLE plugin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(16) NOT NULL,                                 -- PLATFORM | TENANT
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    registry_host VARCHAR(255) NOT NULL,
    username VARCHAR(200),
    secret_cipher TEXT NOT NULL,                                -- AES-GCM (Base64)
    secret_nonce VARCHAR(64) NOT NULL,
    key_version INT NOT NULL DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    CONSTRAINT chk_credential_scope CHECK (
        (scope = 'PLATFORM' AND tenant_id IS NULL)
        OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_plugin_credentials_platform_host
    ON plugin_credentials (registry_host, name) WHERE scope = 'PLATFORM';
CREATE UNIQUE INDEX uq_plugin_credentials_tenant_host
    ON plugin_credentials (tenant_id, registry_host, name) WHERE scope = 'TENANT';
```

### 2.5. Bảng `plugin_ui_slots` (Registry UI Slot — DES-03-UI)

> **Phân biệt chủ sở hữu & phiên bản**: slot của Core là duy nhất theo `slot_code`; slot do plugin làm host được **định danh theo `(owner_plugin_key, slot_code, contract_version)`** và gắn với phiên bản plugin khai báo (`declared_in_version`). Registry được **đồng bộ khi công bố phiên bản** từ `plugin_versions.ui_manifest.slots`; runtime resolve slot theo **phiên bản host đang cài của tenant**.

```sql
CREATE TABLE plugin_ui_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code VARCHAR(120) NOT NULL,                            -- core.dashboard.widgets, crm.customer.detail.tabs...
    host_type VARCHAR(16) NOT NULL,                             -- CORE | PLUGIN
    owner_plugin_key VARCHAR(100),                              -- plugin làm host (nếu host_type = PLUGIN)
    declared_in_version VARCHAR(32),                            -- phiên bản plugin khai báo slot
    title_key VARCHAR(120) NOT NULL,
    contract_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    allowed_render_modes JSONB NOT NULL DEFAULT '["WEB_COMPONENT","MODULE_FEDERATION","IFRAME"]'::jsonb,
    constraints JSONB NOT NULL DEFAULT '{}'::jsonb,             -- kích thước tối thiểu, số contribution tối đa...
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',               -- ACTIVE | DEPRECATED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ui_slot_host CHECK (
        (host_type = 'CORE'   AND owner_plugin_key IS NULL     AND declared_in_version IS NULL)
        OR
        (host_type = 'PLUGIN' AND owner_plugin_key IS NOT NULL AND declared_in_version IS NOT NULL)
    ),
    CONSTRAINT chk_ui_slot_status CHECK (status IN ('ACTIVE','DEPRECATED'))
);

-- Core slot: duy nhất theo slot_code; Plugin slot: duy nhất theo (chủ sở hữu, slot, contract_version)
CREATE UNIQUE INDEX uq_plugin_ui_slot_core
    ON plugin_ui_slots (slot_code) WHERE host_type = 'CORE';
CREATE UNIQUE INDEX uq_plugin_ui_slot_plugin
    ON plugin_ui_slots (owner_plugin_key, slot_code, contract_version) WHERE host_type = 'PLUGIN';
CREATE INDEX idx_plugin_ui_slots_owner
    ON plugin_ui_slots (owner_plugin_key) WHERE host_type = 'PLUGIN';
```

**Quy tắc nguồn sự thật & resolve (BUG-88 — bắt buộc)**:
1. `plugin_versions.ui_manifest` của **phiên bản host đang cài** là **nguồn sự thật** cho slot/contribution.
2. `plugin_ui_slots` chỉ là **chỉ mục tra cứu/validate**; đồng bộ khi công bố phiên bản; upsert theo `(owner_plugin_key, slot_code, contract_version)` — **không ghi đè** định nghĩa của phiên bản khác.
3. Cùng `slot_code` nhưng khác `constraints` → **bắt buộc tăng `contract_version`** (validate khi publish, lỗi `PLUGIN_UI_SLOT_CONTRACT_MISMATCH`).
4. Runtime resolve theo `installed_version` của host cho tenant hiện tại (kèm `owner_tenant_id`); không khớp contract → không render + cảnh báo (không làm hỏng màn hình host).

### 2.6. Bảng `plugin_operation_logs` (Vết Saga — Phục Vụ Chẩn Đoán/Recovery)

```sql
CREATE TABLE plugin_operation_logs (
    id BIGSERIAL PRIMARY KEY,
    operation_id UUID NOT NULL,
    tenant_id UUID,
    plugin_key VARCHAR(100) NOT NULL,
    operation VARCHAR(40) NOT NULL,                             -- INSTALL/UPGRADE/UNINSTALL/ENABLE/DISABLE/BLOCK/FORCE_UNINSTALL/BULK_APPLY
    step VARCHAR(60) NOT NULL,                                  -- PRE_FLIGHT/LEDGER/PROVISION_DATASOURCE/BUILD_IMAGE/DEPLOY/HEALTH/SEED_PERMISSIONS/ACTIVATE/COMPENSATE
    result VARCHAR(16) NOT NULL,                                -- STARTED | OK | FAILED | COMPENSATED
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_op_result CHECK (result IN ('STARTED','OK','FAILED','COMPENSATED'))
);

CREATE INDEX idx_plugin_op_logs_operation ON plugin_operation_logs (operation_id, created_at);
CREATE INDEX idx_plugin_op_logs_plugin ON plugin_operation_logs (plugin_key, created_at DESC);
```

### 2.7. Bảng `tenant_notifications` (Thông Báo Trong Ứng Dụng — Q3)

```sql
CREATE TABLE tenant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,                                  -- PLUGIN_BLOCKED | PLUGIN_FORCE_UNINSTALLED | PLUGIN_UPDATE_AVAILABLE | PLUGIN_INSTALL_FAILED
    title_code VARCHAR(120) NOT NULL,                           -- i18n code
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',               -- INFO | WARNING | CRITICAL
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_severity CHECK (severity IN ('INFO','WARNING','CRITICAL'))
);

CREATE INDEX idx_tenant_notifications_tenant_unread
    ON tenant_notifications (tenant_id, created_at DESC) WHERE read_at IS NULL;
```

### 2.8. Cập Nhật Bảng `tenants` (Bổ Sung Cấu Hình Plugin)

```sql
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS allow_custom_plugins BOOLEAN NOT NULL DEFAULT FALSE,   -- Q8 Gate: tenant tự đăng ký plugin riêng
ADD COLUMN IF NOT EXISTS storage_model VARCHAR(24) NOT NULL DEFAULT 'DEDICATED_SCHEMA';

CREATE INDEX IF NOT EXISTS idx_tenants_allow_custom_plugins ON tenants (allow_custom_plugins);
```

> `tenants.allowed_plugins` (Sprint 02) **được giữ tạm** để tương thích hợp đồng API `/quotas`, nhưng từ V3.0.1 nguồn sự thật là `tenant_plugins`; API suy ra `allowed_plugins` từ bảng mới. Trường cũ sẽ được deprecate và xóa ở sprint sau.

---

## 3. Enum Chuẩn Hóa (Đồng Bộ Java ↔ TypeScript)

| Enum Java (`core.enums`) / TS (`@shared/enums`) | Giá Trị |
| :--- | :--- |
| `PluginVisibility` | `PLATFORM`, `TENANT_PRIVATE` |
| `PluginReleaseStatus` | `DRAFT`, `PUBLISHED`, `DEPRECATED`, `BLOCKED` |
| `TenantPluginStatus` | `NOT_INSTALLED`, `INSTALLING`, `ACTIVE`, `INACTIVE`, `UPGRADING`, `INSTALL_FAILED`, `ROLLBACK_FAILED`, `UNINSTALLING`, `UNINSTALLED` |
| `PluginStorageModel` | `DEDICATED_SCHEMA`, `DEDICATED_DATABASE` |
| `PluginDistributionType` | `DOCKER_HUB`, `IMAGE_REGISTRY`, `JAR_BUNDLE` |
| `PluginMigrationPolicy` | `COMPATIBLE`, `BREAKING` |
| `PluginRenderMode` | `WEB_COMPONENT`, `MODULE_FEDERATION`, `IFRAME` |
| `PluginCredentialScope` | `PLATFORM`, `TENANT` |
| `PluginOperationType` | `INSTALL`, `UPGRADE`, `UNINSTALL`, `ENABLE`, `DISABLE`, `BLOCK`, `FORCE_UNINSTALL`, `BULK_APPLY`, `REGISTER_VERSION` |

---

## 4. Kế Hoạch Migration Flyway

> **Thứ tự bắt buộc**: Schema → **Seed/placeholder catalog** → **Backfill entitlement**. Backfill **không được phụ thuộc** vào việc catalog đã có sẵn entry (nếu JOIN thiếu catalog sẽ làm **mất entitlement đã cấp**).

| Phiên Bản | Nội Dung |
| :--- | :--- |
| `V3.0.0__plugin_manager_schema.sql` | Tạo 7 bảng mới + `ALTER tenants` + index/constraint + seed UI Slot chuẩn của Core (`core.dashboard.widgets`, `core.settings.sections`) |
| `V3.0.1__seed_plugin_catalog.sql` | Seed **placeholder catalog** cho mọi `plugin_key` xuất hiện trong `tenants.allowed_plugins` (chưa tạo `tenant_plugins`) + seed plugin chính thức (`sales`, `inventory`, `accounting`, `crm`) ở `DRAFT` |
| `V3.0.2__backfill_allowed_plugins.sql` | Backfill entitlement → `tenant_plugins`; **tự tạo placeholder catalog nếu thiếu** (idempotent); bỏ qua key `core`; kèm script đối soát count |

**Backfill SQL (tự đủ — không phụ thuộc seed trước)**:
```sql
-- 1) Bảo đảm mọi key được cấp phép đều có catalog entry (placeholder nếu chưa có)
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility)
SELECT DISTINCT
       k.plugin_key,
       'PLUGIN_' || upper(replace(replace(k.plugin_key, '-', '_'), '.', '_')) || '_NAME',
       'PLUGIN_' || upper(replace(replace(k.plugin_key, '-', '_'), '.', '_')) || '_DESCRIPTION',
       'PLATFORM'
FROM tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
WHERE k.plugin_key <> 'core'
ON CONFLICT (plugin_key) DO NOTHING;

-- 2) Backfill entitlement (chạy sau bước 1 nên không thể thiếu catalog)
INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status)
SELECT t.id, c.id, c.plugin_key, 'NOT_INSTALLED'
FROM tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
JOIN plugin_catalog c ON c.plugin_key = k.plugin_key
WHERE k.plugin_key <> 'core'
ON CONFLICT (tenant_id, plugin_key) DO NOTHING;
```

**Kiểm chứng migration** (bắt buộc chạy trong migration test + QA — **đối soát theo từng tenant/key**, không chỉ tổng count):

```sql
-- 1) Mọi entitlement trong allowed_plugins phải tồn tại ở tenant_plugins (không được trả dòng nào)
WITH expected AS (
  SELECT t.id AS tenant_id, k.plugin_key
  FROM tenants t
  CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
  WHERE k.plugin_key <> 'core'
)
SELECT e.tenant_id, e.plugin_key
FROM expected e
LEFT JOIN tenant_plugins tp
  ON tp.tenant_id = e.tenant_id AND tp.plugin_key = e.plugin_key
WHERE tp.id IS NULL;

-- 2) Không phát sinh entitlement thừa: mọi dòng tenant_plugins phải có trong allowed_plugins
SELECT tp.tenant_id, tp.plugin_key
FROM tenant_plugins tp
WHERE NOT EXISTS (
  SELECT 1 FROM tenants t
  WHERE t.id = tp.tenant_id AND t.allowed_plugins @> to_jsonb(tp.plugin_key)
);

-- Nếu một trong hai truy vấn trả về dòng → migration dừng (Fail fast).
```

**Xử lý key không nhận diện**: mọi key trong `allowed_plugins` đều được **bảo toàn** (tạo placeholder catalog); migration ghi `RAISE NOTICE` danh sách key lạ để vận hành bổ sung i18n (`PLUGIN_<KEY>_NAME`/`_DESCRIPTION`) và metadata chính thức sau.

---

## 5. Quy Tắc Toàn Vẹn & Hiệu Năng

| # | Quy Tắc |
| :---: | :--- |
| 1 | `plugin_key` bất biến sau khi tạo catalog; xóa catalog chỉ khi `visibility = TENANT_PRIVATE` và chưa từng cài (hoặc đã `UNINSTALLED`). |
| 2 | Không xóa `plugin_versions` đang được tenant ghim (`installed_version`) → `PLUGIN_VERSION_IN_USE`. |
| 3 | `tenant_plugins` là nguồn sự thật entitlement; `TenantPluginAllowlistService` chỉ chấp nhận `status = 'ACTIVE'`. |
| 4 | Dữ liệu plugin KHÔNG có FK từ bảng Core → schema plugin; Core không truy vấn schema `tenant_*`. |
| 5 | Chỉ mục composite phục vụ marketplace (`tenant_id, status`) và governance (`plugin_key, status`). |
| 6 | `plugin_operation_logs` là bảng append-only; dọn theo retention (mặc định 90 ngày) bằng job. |
| 7 | Xóa tenant (`ON DELETE CASCADE`) chỉ xóa dữ liệu quản trị plugin; schema nghiệp vụ `tenant_*` do job purge tenant xử lý riêng (ngoài Sprint 03). |

---

## 6. Seed UI Slot Chuẩn Của Core (Sprint 03)

```sql
INSERT INTO plugin_ui_slots (slot_code, host_type, title_key, contract_version, constraints)
VALUES
 ('core.dashboard.widgets', 'CORE', 'PLUGIN_SLOT_CORE_DASHBOARD_WIDGETS', '1.0', '{"max_contributions":6,"min_height_px":120}'),
 ('core.settings.sections', 'CORE', 'PLUGIN_SLOT_CORE_SETTINGS_SECTIONS', '1.0', '{"max_contributions":10}')
ON CONFLICT (slot_code) DO NOTHING;
```

---

## 7. Bàn Giao Sang DES-03-API / DES-03-UI

- **DES-03-API** dùng các bảng trên để đặc tả endpoint (request/response/error code) cho 3 nhóm: Platform, Tenant, Shared (UI Manifest/Operations).
- **DES-03-UI** dùng `plugin_ui_slots` + `ui_manifest` để đặc tả slot/contribution + màn hình Marketplace/Portal.
- **DES-03-CFG** (nằm trong deployment guide ở Bước 7): cấu hình Deployer, MinIO, registry allowlist, credentials encryption key.
