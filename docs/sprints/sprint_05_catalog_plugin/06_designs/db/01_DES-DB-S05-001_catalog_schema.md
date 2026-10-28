# [DES-DB-S05-001] Thiết kế CSDL plugin Danh mục (multi-parent, version, hiệu lực)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S05-001 / Thiết kế CSDL / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.4 / 2026-10-28 (bổ sung FEAT-31/32) |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [SOL-S05-001](../../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) (D2–D14), [ANL-S05-001](../../02_analysis/01_ANL-S05-001_catalog_data_model_problems.md) |
| Đọc trước / đọc tiếp | SOL-S05-001 / [DES-API-S05-001](../api/01_DES-API-S05-001_catalog_api.md) |

## 1. Nguyên tắc

1. **Bảng cạnh tường minh** cho quan hệ (đa cha, nhảy cấp) — không `parent_id`.
2. **Version + hiệu lực** trên cả bản ghi và cạnh; **xoá = đóng hiệu lực**.
3. Ràng buộc chồng lấn ở **tầng CSDL** (EXCLUDE + `btree_gist`), không chỉ ở service.
4. Cách ly tenant bằng `tenant_id` (danh mục hệ thống = `NULL`); mọi index phục vụ truy vấn theo tenant.
5. Migration `V4.0.0` (Sprint 05) — idempotent, chạy được trên PostgreSQL 16.

## 2. DDL

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- cho EXCLUDE trên cột = (uuid, varchar)

-- 2.1 Loại danh mục -----------------------------------------------------
CREATE TABLE catalog_types (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = loại hệ thống
    code              VARCHAR(64)  NOT NULL,                          -- PROVINCE, JOB_TITLE, DEPARTMENT…
    name_key          VARCHAR(128) NOT NULL,                          -- i18n key (không hardcode nhãn)
    description_key   VARCHAR(128),
    hierarchy_mode    VARCHAR(16)  NOT NULL DEFAULT 'TREE',           -- TREE | DAG
    allowed_relations VARCHAR(32)[] NOT NULL DEFAULT '{HIERARCHY}',   -- HIERARCHY|CLASSIFICATION|ALLOCATION|CUSTOM
    allowed_parent_types VARCHAR(64)[],                              -- NULL = **chỉ cùng loại** (an toàn mặc định); khai báo để cho phép khác loại
    max_depth         SMALLINT,                                       -- NULL = không giới hạn
    min_parents       SMALLINT     NOT NULL DEFAULT 0,
    allow_free_text   BOOLEAN      NOT NULL DEFAULT FALSE,
    versioned         BOOLEAN      NOT NULL DEFAULT TRUE,
    effective_dated   BOOLEAN      NOT NULL DEFAULT TRUE,
    attributes_schema JSONB,                                          -- định nghĩa trường động của loại
    status            VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_type_mode CHECK (hierarchy_mode IN ('TREE','DAG')),
    CONSTRAINT chk_catalog_type_status CHECK (status IN ('ACTIVE','INACTIVE')),
    CONSTRAINT uq_catalog_type_code UNIQUE NULLS NOT DISTINCT (tenant_id, code)
);

-- 2.2 Bản ghi danh mục (versioned + hiệu lực) --------------------------
CREATE TABLE catalog_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type_id            UUID NOT NULL REFERENCES catalog_types(id) ON DELETE RESTRICT,
    version_group_id   UUID NOT NULL,                 -- định danh xuyên phiên bản
    version            INT  NOT NULL DEFAULT 1,
    code               VARCHAR(64)  NOT NULL,
    name               VARCHAR(255) NOT NULL,
    name_en            VARCHAR(255),
    description        TEXT,
    attributes         JSONB,
    sort_order         INT  NOT NULL DEFAULT 0,
    status             VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    valid_from         TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to           TIMESTAMPTZ,                   -- NULL = còn hiệu lực
    supersedes_item_id UUID REFERENCES catalog_items(id),
    created_by         UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by         UUID, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_item_window CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT uq_catalog_item_version UNIQUE (tenant_id, type_id, code, version),
    -- Không chồng lấn hiệu lực cho cùng (tenant, loại, mã). COALESCE để ràng buộc
    -- cả bản ghi hệ thống (tenant_id NULL — NULL luôn khác nhau trong EXCLUDE).
    CONSTRAINT ex_catalog_item_window EXCLUDE USING gist (
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        type_id WITH =, code WITH =, tstzrange(valid_from, valid_to) WITH &&
    )
);

-- 2.3 Quan hệ cha–con (đa cha, nhảy cấp, có hiệu lực) -------------------
CREATE TABLE catalog_item_edges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
    child_item_id  UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
    relation_type  VARCHAR(32) NOT NULL DEFAULT 'HIERARCHY',
    sort_order     INT NOT NULL DEFAULT 0,
    status         VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    valid_from     TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to       TIMESTAMPTZ,
    created_by     UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_edge_self CHECK (parent_item_id <> child_item_id),
    CONSTRAINT chk_catalog_edge_window CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ex_catalog_edge_window EXCLUDE USING gist (
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        parent_item_id WITH =, child_item_id WITH =, relation_type WITH =,
        tstzrange(valid_from, valid_to) WITH &&
    )
);

-- 2.4 Phân quyền theo loại danh mục ------------------------------------
CREATE TABLE catalog_type_grants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type_id    UUID NOT NULL REFERENCES catalog_types(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    can_read   BOOLEAN NOT NULL DEFAULT TRUE,
    can_write  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_catalog_type_grant UNIQUE (tenant_id, type_id, role_id)
);
```

## 3. Index

```sql
-- Truy vấn cây/đa cha (recursive CTE đi 2 chiều)
CREATE INDEX idx_catalog_edges_parent ON catalog_item_edges (parent_item_id) WHERE valid_to IS NULL;
CREATE INDEX idx_catalog_edges_child  ON catalog_item_edges (child_item_id)  WHERE valid_to IS NULL;
CREATE INDEX idx_catalog_edges_tenant ON catalog_item_edges (tenant_id, relation_type);

-- Tra cứu item theo tenant/loại/mã + as-of
CREATE INDEX idx_catalog_items_lookup ON catalog_items (tenant_id, type_id, code) WHERE valid_to IS NULL;
CREATE INDEX idx_catalog_items_group  ON catalog_items (version_group_id, version DESC);
CREATE INDEX idx_catalog_items_name_trgm ON catalog_items USING gin (name gin_trgm_ops);  -- autocomplete
CREATE INDEX idx_catalog_types_tenant ON catalog_types (tenant_id, status);
```
`pg_trgm` cũng cần `CREATE EXTENSION IF NOT EXISTS pg_trgm;` (đã dùng cho tìm kiếm gần đúng). Nếu môi trường chặn extension, fallback `ILIKE '%q%'` (ghi rõ trong migration).

## 4. Truy vấn mẫu

**T4.1 — Con cháu của một mục (as-of, có giới hạn độ sâu)**
```sql
WITH RECURSIVE subtree AS (
    SELECT e.child_item_id AS id, 1 AS depth
    FROM catalog_item_edges e
    WHERE e.parent_item_id = :rootId
      AND tstzrange(e.valid_from, e.valid_to) @> :asOf
      AND e.status = 'ACTIVE'
    UNION ALL
    SELECT e.child_item_id, s.depth + 1
    FROM catalog_item_edges e JOIN subtree s ON e.parent_item_id = s.id
    WHERE tstzrange(e.valid_from, e.valid_to) @> :asOf
      AND e.status = 'ACTIVE' AND s.depth < COALESCE(:maxDepth, 20)
)
SELECT DISTINCT i.* FROM catalog_items i JOIN subtree s ON s.id = i.id;
```

**T4.2 — Kiểm tra chu trình trước khi thêm cạnh `parent → child`**
```sql
WITH RECURSIVE ancestors AS (
    SELECT :parentId AS id
    UNION ALL
    SELECT e.parent_item_id
    FROM catalog_item_edges e JOIN ancestors a ON e.child_item_id = a.id
    WHERE e.valid_to IS NULL AND e.status = 'ACTIVE'
)
SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = :childId) AS would_cycle;
```
`would_cycle = true` ⇒ từ chối `CATALOG_EDGE_CYCLE`.

**T4.3 — Options cho form động (gộp hệ thống + tenant, tenant thắng)**
```sql
SELECT DISTINCT ON (i.code) i.*
FROM catalog_items i
JOIN catalog_types t ON t.id = i.type_id
WHERE t.code = :typeCode
  AND (i.tenant_id = :tenantId OR i.tenant_id IS NULL)
  AND tstzrange(i.valid_from, i.valid_to) @> :asOf
  AND i.status = 'ACTIVE'
  AND (:q IS NULL OR i.code ILIKE :like OR i.name ILIKE :like)
ORDER BY i.code, (i.tenant_id IS NULL)   -- tenant trước hệ thống
LIMIT :size OFFSET :offset;
```

## 5. Seed & đăng ký plugin

```sql
-- 5.1 Plugin core, luôn bật, không gỡ được
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES ('catalog', 'PLUGIN_CATALOG_NAME', 'PLUGIN_CATALOG_DESCRIPTION', 'PLATFORM',
        TRUE, TRUE, TRUE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
    SET default_install = TRUE, locked = TRUE, is_core = TRUE;

-- 5.2 Quyền chức năng (module) — gán cho vai trò hệ thống của tenant
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
  ('catalog:type:manage',        'catalog', 'type', 'manage',        'PERM_CATALOG_TYPE_MANAGE', FALSE),
  ('catalog:item:read',          'catalog', 'item', 'read',          'PERM_CATALOG_ITEM_READ', FALSE),
  ('catalog:item:manage',        'catalog', 'item', 'manage',        'PERM_CATALOG_ITEM_MANAGE', FALSE),
  ('catalog:item:inline-create', 'catalog', 'item', 'inline-create', 'PERM_CATALOG_ITEM_INLINE_CREATE', FALSE),
  ('catalog:system:manage',      'catalog', 'system', 'manage',      'PERM_CATALOG_SYSTEM_MANAGE', TRUE)
ON CONFLICT (code) DO NOTHING;
-- 4 quyền đầu ⇒ TENANT_OWNER/TENANT_ADMIN; catalog:system:manage ⇒ platform admin.

-- 5.3 Loại danh mục hệ thống + tenant mặc định (mẫu)
INSERT INTO catalog_types (tenant_id, code, name_key, hierarchy_mode, allowed_relations, allowed_parent_types, max_depth, allow_free_text)
VALUES
  (NULL, 'PROVINCE', 'CATALOG_TYPE_PROVINCE', 'TREE', '{HIERARCHY}', NULL, NULL, FALSE),
  (NULL, 'DISTRICT', 'CATALOG_TYPE_DISTRICT', 'TREE', '{HIERARCHY}', '{PROVINCE}', NULL, FALSE),
  (NULL, 'COMMUNE',  'CATALOG_TYPE_COMMUNE',  'TREE', '{HIERARCHY}', '{PROVINCE,DISTRICT}', NULL, FALSE),
  (NULL, 'INDUSTRY', 'CATALOG_TYPE_INDUSTRY', 'DAG',  '{CLASSIFICATION}', NULL, NULL, FALSE),
  (NULL, 'JOB',      'CATALOG_TYPE_JOB',      'DAG',  '{CLASSIFICATION,ALLOCATION}', '{INDUSTRY}', NULL, TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;
-- Loại tenant (seed theo tenant khi cài đặt) — **chốt 5 mục (N1)**: JOB_TITLE (cho phép nhập tự do),
-- DEPARTMENT (danh mục riêng, seed một chiều từ departments), CONTRACT_TYPE, SHIFT, EDUCATION_LEVEL.
-- 8 mục gợi ý thêm đã bị cắt theo N1 (tenant tự tạo khi cần).

-- 5.3.2 Grant mặc định (tránh "cài xong không ai sửa được"): mọi loại của tenant
--       mặc định cho TENANT_OWNER/TENANT_ADMIN quyền ghi; loại tạo mới sau này
--       cũng tự nhận grant mặc định này khi tạo.
INSERT INTO catalog_type_grants (tenant_id, type_id, role_id, can_read, can_write)
SELECT t.tenant_id, t.id, r.id, TRUE, TRUE
FROM catalog_types t
JOIN roles r ON r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
WHERE t.tenant_id IS NOT NULL
ON CONFLICT (tenant_id, type_id, role_id) DO NOTHING;

-- 5.3.3 Quy tắc khác loại: `allowed_parent_types` NULL = **chỉ cùng loại**;
--       muốn cho phép liên loại phải khai báo (vd JOB: {INDUSTRY, ALLOCATION}).

-- 5.3.4 Seed dữ liệu địa giới 2 cấp tỉnh→xã (N2, N6) — chạy một lần trong seed script
--       từ tệp commit trong repo (nguồn: provinces.open-api.vn api/v2, sinh một lần ở dev-time
--       bằng `scripts/gen-admin-units.mjs`; header tệp ghi nguồn + ngày + số dòng:
--       34 tỉnh / 3.321 xã-phường, dữ liệu sau sáp nhập 2025 — tỉnh→xã trực tiếp):
--       src/backend/src/main/resources/db/seed/provinces-communes.csv
--       Mỗi dòng: province_code,province_name,commune_code,commune_name
--       ⇒ chèn item hệ thống cho PROVINCE và COMMUNE + cạnh trực tiếp tỉnh→xã
--       (KHÔNG seed huyện; loại DISTRICT vẫn có sẵn cho tenant dùng sau).
--       Idempotent theo (tenant_id IS NULL, type_id, code).

-- 5.4 Backfill tenant đã tồn tại: cấp quyền + cài ACTIVE + seed danh mục tenant
--     (cùng mẫu với V3.0.2: cập nhật tenants.allowed_plugins rồi chèn tenant_plugins)
--     Seed danh mục cố định: idempotent theo (tenant_id, type_id, code); KHÔNG ghi đè
--     bản ghi tenant đã sửa (chỉ chèn khi chưa có).
--     Seed DEPARTMENT một chiều từ departments hiện có:
INSERT INTO catalog_items (tenant_id, type_id, version_group_id, version, code, name, status, valid_from)
SELECT d.tenant_id, t.id, gen_random_uuid(), 1,
       COALESCE(NULLIF(d.code, ''), 'DEP-' || substr(d.id::text, 1, 8)), d.name, 'ACTIVE', now()
FROM departments d
JOIN catalog_types t ON t.tenant_id = d.tenant_id AND t.code = 'DEPARTMENT'
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_items i
    WHERE i.tenant_id = d.tenant_id AND i.type_id = t.id AND i.code = d.code AND i.valid_to IS NULL
);
-- Lưu ý: đây là seed MỘT CHIỀU (không đồng bộ hai chiều). Cây tổ chức vẫn là nguồn
-- cấu trúc; danh mục Phòng ban chỉ phục vụ tra cứu form (CONF Q3, ANL-S05-002 §4.1).
UPDATE tenants
   SET allowed_plugins = CASE WHEN allowed_plugins @> '["catalog"]'::jsonb
                              THEN allowed_plugins ELSE allowed_plugins || '["catalog"]'::jsonb END;

INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status, storage_model, installed_version, installed_at, activated_at)
SELECT t.id, c.id, 'catalog', 'ACTIVE', 'DEDICATED_SCHEMA', '1.0.0', now(), now()
FROM tenants t CROSS JOIN plugin_catalog c
WHERE c.plugin_key = 'catalog'
ON CONFLICT (tenant_id, plugin_key) DO NOTHING;
```

## 6. Truy vết AC

| AC | Đảm bảo bởi |
| :--- | :--- |
| AC-01/AC-02/AC-03/AC-04 | `catalog_item_edges` + `relation_type` + T4.1 (không sinh cạnh bắc cầu) |
| AC-05 | T4.2 (kiểm tra chu trình) + lỗi `CATALOG_EDGE_CYCLE` |
| AC-06/AC-08 | `valid_from/valid_to` trên item và edge + `as_of` |
| AC-07 | `ex_catalog_item_window` / `ex_catalog_edge_window` |
| AC-09 | `catalog_type_grants` + quyền module |
| AC-10/AC-11 | T4.3 + index `idx_catalog_items_lookup`, trigram |
| AC-13/AC-14 | Seed 5.1–5.4 + `locked`/`is_core` |
| AC-15 | `tenant_id` trên mọi bảng + lọc theo context |

## 6.1. Điều chỉnh khi triển khai — schema thật thắng thiết kế (2026-10-06)

Ghi nhận trong lúc viết migration `V4.0.0__catalog_core_plugin.sql` (TASK-375); các điểm dưới đây **đã áp dụng trong code**, thiết kế gốc ở trên giữ nguyên để đối chiếu:

| # | Thiết kế gốc | Thực tế schema | Lý do |
| :--- | :--- | :--- | :--- |
| 1 | `plugin_catalog.is_core = TRUE` | **`is_core = FALSE`, `locked = TRUE`, `default_install = TRUE`** | Ràng buộc `chk_plugin_visibility` (V3.0.0) buộc `is_core = FALSE` — module core không nằm trong bảng này (Sprint 03 Q4). "Luôn bật" đến từ **locked + backfill + hook provisioning**, không phải `is_core` |
| 2 | `chk_catalog_type_mode` chỉ `TREE`/`DAG` | thêm **`FLAT`** | Enum Java có FLAT (loại phẳng như Chức danh) — giữ DB và Java đồng bộ 1-1 |
| 3 | `catalog:system:manage` là quyền hệ thống (`is_system = TRUE`) | **`is_system = FALSE`**, không gán cho vai trò tenant | Giữ `SchemaFoundationTest` (mọi `is_system = TRUE` là domain `core` + gán TENANT_OWNER); phân quyền platform là **theo vai trò** (`PlatformRoleRequiredFilter`), không qua RBAC |
| 4 | §5.4 backfill `allowed_plugins` dùng `NULL \|\| '["catalog"]'` | **`COALESCE(allowed_plugins, '[]'::jsonb)`** | `NULL \|\| jsonb` = `NULL` ⇒ câu backfill là no-op với tenant chưa có allowlist |
| 5 | T4.2 kiểm tra chu trình không giới hạn độ sâu | thêm **guard độ sâu 1000** | Chặn đệ quy vô hạn nếu dữ liệu cũ đã hỏng; ngữ nghĩa không đổi với DAG hợp lệ |
| 6 | Mode của 5 loại tenant không ghi rõ | **JOB_TITLE = DAG, DEPARTMENT = TREE, CONTRACT_TYPE/SHIFT/EDUCATION_LEVEL = FLAT** | Chốt khi seed; `JOB_TITLE` cho phép nhập tự do (`allow_free_text = TRUE`) |
| 7 | `tenant_plugins.storage_model` cho plugin core | **`DEDICATED_SCHEMA`** (giá trị duy nhất hợp lệ) | Ràng buộc `chk_tenant_plugin_storage` chỉ cho `DEDICATED_SCHEMA`/`DEDICATED_DATABASE`; mô hình "core dùng chung schema" (SHARED_SCHEMA_RLS) **nằm ngoài enum** theo quyết định Sprint 03, nên cột này không dùng cho plugin in-process |
| 8 | `uq_catalog_item_version` dùng `UNIQUE (tenant_id, type_id, code, version)` | giữ nguyên (nit nhỏ) | Với `tenant_id NULL`, UNIQUE cho phép trùng số version ở các cửa sổ **không chồng lấn** — `ex_catalog_item_window` đã chặn chồng lấn nên không hỏng dữ liệu; **không sửa migration đã apply** (checksum Flyway); nếu cần siết thì thêm `V4.0.1` với `UNIQUE NULLS NOT DISTINCT` |
| 9 | `source` / `source_ref` trên `catalog_types` | **đã bỏ** bằng `V4.0.1__drop_catalog_type_source.sql` | Quyết định CONF-S05-001 §3.1 (phương án "bridge" bị loại cùng Q3): cột luôn mang giá trị `PLUGIN`, `source_ref` chưa bao giờ được ghi ⇒ cột chết, làm lệch descriptor plugin + Entity Registry. Dọn cả entity (`CatalogType`), enum `CatalogTypeSource`, DTO `TypeResponse`, `CatalogResponseKey` và key `SOURCE_REF` ở FE |

**Bằng chứng đã kiểm chứng trên PostgreSQL dev (2026-10-06 — bổ sung)**: `V4.0.1` apply sạch; `CatalogPluginManifestTest` PASS (descriptor `plugins/catalog/plugin.json` khớp 5 quyền seed + 4 entity đã đăng ký + `plugin_catalog` row `catalog`); `GET /api/v1/catalog/plugin/manifest` → HTTP 200 với `code = CATALOG_PLUGIN_MANIFEST_SUCCESS`.

**Bằng chứng đã kiểm chứng trên PostgreSQL dev (2026-10-06)**: migration apply sạch; **60/60 tenant** nhận plugin `ACTIVE` + 5 loại + **600 grant mặc định**; `sys_entity_registry` có **4** dòng (`CatalogType/CatalogItem/CatalogItemEdge/CatalogTypeGrant`, `plugin_id = 'catalog'`); EXCLUDE bắn `23P01 ex_catalog_item_window`; seeder địa giới idempotent (34 tỉnh / 3.321 xã / 3.321 cạnh sau nhiều lần chạy); **49 test** liên quan PASS (gồm bộ catalog + các lớp bị ảnh hưởng).

## 8. Bổ sung FEAT-31/32 (2026-10-28)

### 8.1. `catalog_type_relations` (FEAT-31)

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | UUID PK | `gen_random_uuid()` |
| `tenant_id` | UUID NULL | NULL = quan hệ system |
| `parent_type_id` | UUID NOT NULL | FK `catalog_types(id)` ON DELETE CASCADE |
| `child_type_id` | UUID NOT NULL | FK `catalog_types(id)` ON DELETE CASCADE |
| `relation_type` | VARCHAR(32) | HIERARCHY/CLASSIFICATION/ALLOCATION/CUSTOM |
| `sort_order` | INT | thứ tự hiển thị |
| `status` | VARCHAR(16) | ACTIVE/INACTIVE |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

- UNIQUE `(tenant_id, parent_type_id, child_type_id, relation_type)` NULLS NOT DISTINCT; CHECK self-reference; index `(tenant_id, parent_type_id)` và `(tenant_id, child_type_id)`.
- Backfill: mỗi mã trong `allowed_parent_types` → một dòng; `relation_type` = phần tử đầu của `allowed_relations`; ưu tiên loại tenant cùng schema, fallback system.
- `allowed_parent_types` giữ lại làm cột tương thích (edge drawer/import CSV) và được service đồng bộ lại sau mỗi lần lưu quan hệ.

### 8.2. Cột clone/sync (FEAT-32)

| Bảng | Cột thêm | Ý nghĩa |
| :--- | :--- | :--- |
| `catalog_types` | `system_type_id UUID` | Loại system gốc của bản clone tenant |
| `catalog_items` | `system_item_id UUID` | Item system gốc của bản clone/override |
| `catalog_item_edges` | `system_edge_id UUID` | Cạnh system gốc |
| `catalog_type_relations` | `system_relation_id UUID` | Quan hệ loại system gốc |

- UNIQUE một chiều: `(tenant_id, system_type_id)`, `(tenant_id, system_item_id)`, `(tenant_id, system_edge_id)`, `(tenant_id, system_relation_id)` (bỏ qua NULL).
- Clone dùng `system_*_id` để map; sync so sánh theo các id này, không theo UUID tenant.
- Xoá clone: xoá type/cụm tenant (CASCADE item theo type) rồi trả về system; `system_*_id` của system row không đổi.

## 9. Lịch sử (bổ sung)

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp DDL + truy vấn mẫu + seed | Architect; chưa review |
| 0.2 | 2026-10-06 | Ghi 6 điều chỉnh khi triển khai (mục 6.1) + bằng chứng kiểm chứng trên PostgreSQL dev | Architect; nguồn: migration V4.0.0 + test catalog |
| 0.3 | 2026-10-06 | Bỏ `source`/`source_ref` khỏi DDL (mục 6.1 #9) + bằng chứng `V4.0.1` + manifest plugin | Architect; nguồn: migration V4.0.1 + `CatalogPluginManifestTest` |
