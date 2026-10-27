# [ADR-S05-001] Catalog là plugin package độc lập trong monorepo

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S05-001 / Architecture Decision Record / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Accepted (hướng B + system catalog fan-out)** / 0.2 / 2026-10-27 |
| Owner / reviewer | Solution Architect / Chủ dự án (đã chọn B), PM + QA |
| Đầu vào | [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md), [SOL-S05-001](01_SOL-S05-001_catalog_plugin_architecture.md) (D1 bị bác), Sprint 03 [CONF-01](../../sprint_03_plugin_manager/04_confirmation/CONF-01_sprint_03_scope.md), [SOL-02](../../sprint_03_plugin_manager/05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md) |
| Đọc tiếp | DES-DB/API/UI-S05-001 (cập nhật), TASK-394…398, TP/TR-S05-001 (chạy lại) |

## 1. Bối cảnh

Sprint 05 đã triển khai `catalog` như module core in-process (D1), trái mô hình plugin độc lập của Sprint 03. Chủ dự án chọn **hướng B**: giữ source trong monorepo nhưng đóng gói thành **plugin package độc lập runtime** — container riêng, schema riêng, API qua gateway, UI bundle riêng. Hướng A (repo/submodule riêng) có thể tách sau mà không đổi contract.

## 2. Quyết định

| # | Quyết định | Lý do | Trạng thái |
| :--- | :--- | :--- | :--- |
| **A1** | Source plugin tại `plugins/catalog/` — **Maven project Quarkus độc lập**, không là module của `src/backend` | Build/deploy độc lập; core không compile catalog | Accepted |
| **A2** | Manifest `plugins/catalog/plugin.json` ở gốc package; `packaging: image`; `distribution.type: IMAGE_REGISTRY`; `render_mode: IFRAME` (nâng WC/MF sau) | Đúng schema Sprint 03; iframe là fallback được duyệt | Accepted |
| **A3** | Core **xoá** `modules/catalog`, `resources/plugins/catalog/plugin.json`, route/menu UI native; không còn `/api/v1/catalog/**` | Core tối giản; hết bypass lifecycle | Accepted |
| 1 | **A4** | Dữ liệu tenant trong schema `tenant_<short>_catalog`; plugin tự chạy Flyway `db/plugin-migration/` khi container start; DB role least privilege | Cách ly tenant theo Sprint 03 | Accepted |
| **A4.1** | Catalog là **default_install nhưng unlocked**: tenant mới nhận entitlement (`NOT_INSTALLED`) và bật trong quản lý plugin; tenant cũ giữ trạng thái ledger; gỡ giữ schema | Yêu cầu chủ dự án 2026-10-27 | Accepted |
| **A5** | Bỏ `tenant_id` khỏi bảng tenant (schema đã là tenant); `catalog_type_grants.role_id` là UUID **không FK** sang `roles` core | Không thể FK xuyên schema; tenant context lấy từ `X-Tenant-Id` do gateway ký/forward | Accepted |
| **A6** | **System catalog do plugin sở hữu**, không có schema `catalog_system` trong core. Plugin có một **platform-scoped instance** (cùng image, `PLUGIN_SCOPE=platform`) quản lý canonical system catalog trong schema `tenant_<systemShort>_catalog` của **system tenant** | Chủ dự án chốt: tách khỏi core để plugin quản lý; core không đọc/ghi dữ liệu catalog | Accepted (2026-10-27) |
| **A6.1** | Thêm `TenantType.SYSTEM` + seed **system tenant ẩn** (fixed UUID, không user, không quota, loại khỏi danh sách tenant) làm workspace platform-scoped cho plugin dùng chung | Cần một tenant thật để lifecycle/deployer/schema hiện có dùng lại, không phát minh thêm bảng deployment | Accepted |
| **A6.2** | Platform admin quản trị system catalog qua plugin UI/API của system tenant, route platform `/api/v1/platform/plugins/runtime/catalog/**` với platform token | UI/API vẫn thuộc plugin; core chỉ route + kiểm tra platform role | Accepted |
| **A6.3** | Khi publish system catalog, core `PluginFanoutService` (generic) gọi internal endpoint `POST /internal/system-catalog/sync` trên **từng tenant instance** đang ACTIVE; plugin tự ghi bản sao vào schema của mình; core ghi operation log + retry | Fan-out là orchestration, không phải logic catalog; giữ least privilege từng tenant | Accepted |
| **A6.4** | Lookup của tenant chỉ đọc schema của chính nó (system rows + tenant rows); không đọc chéo schema | Cách ly dữ liệu tuyệt đối | Accepted |
| **A7** | Tenant override system item theo `code` trong schema tenant; lookup merge **system rows + tenant rows trong cùng schema**, tenant thắng | Giữ AC-20/AC-22; không đọc chéo schema | Accepted |
| **A8** | Quyền `catalog:*` do `PluginPermissionSeeder` seed khi cài; `catalog:system:manage` do platform role guard | Đúng lifecycle; không seed bằng migration core | Accepted |
| **A9** | Entity Registry: plugin khai báo `entities` trong manifest; core registrar ghi `sys_entity_registry` khi cài/publish version | Plugin container không scan annotation core | Accepted |
| **A10** | **UI source đặt trong `plugins/catalog/web`**, dùng chung `@shared`; core shell mount **native route** `/settings/catalog` (không iframe) để giữ click/URL route-state; iframe bundle vẫn build được và giữ làm fallback | UX native + plugin sở hữu source; đổi so với iframe ban đầu theo phản hồi chủ dự án 2026-10-27 | Accepted (2026-10-27) |
| **A11** | API nội bộ plugin giữ path `/api/v1/catalog/**`; client gọi qua `/api/v1/plugins/runtime/catalog/api/v1/catalog/**` | Không đổi contract endpoint; gateway là cổng duy nhất | Accepted |
| **A12** | Migration di trú: V5 copy dữ liệu `public.catalog_*` vào schema tenant (system rows → system tenant, tenant rows → từng tenant), verify, rồi drop bảng public | Không mất dữ liệu dev/tenant hiện có | Accepted |
| **A13** | `catalog_type_grants` lưu **`role_code`** (không `role_id`) trong schema tenant; gateway forward `X-User-Roles`; plugin so khớp mã vai trò. V5 map `role_id` cũ → `roles.code` khi di trú; grant mặc định dùng `TENANT_OWNER`/`TENANT_ADMIN` | Tránh FK xuyên schema; RBAC vẫn là nguồn sự thật của core; role code unique theo tenant | Accepted |
| **A14** | Audit mutation của plugin ghi **`catalog_audit`** trong schema tenant (local, đủ truy vết); forward sang core audit là follow-up | Không phụ thuộc API core trong P1; không mất dấu vết | Accepted (follow-up) |

## 3. Cấu trúc mục tiêu

```
plugins/catalog/
├── plugin.json
├── pom.xml                         # Quarkus 3.x, Java 21
├── src/main/java/com/vn9melody/openerp/plugins/catalog/
│   ├── api/                        # error codes, response keys
│   ├── dto/
│   ├── model/                      # entities (no tenant_id)
│   ├── repository/
│   ├── service/
│   ├── resource/                   # @Path /api/v1/catalog/**
│   └── runtime/                    # TenantContextFilter (X-Tenant-Id), health
├── src/main/resources/
│   ├── application.properties      # DB_SCHEMA, DB_URL, flyway
│   ├── db/plugin-migration/
│   │   ├── V1.0.0__initial_schema.up.sql
│   │   └── V1.0.0__initial_schema.down.sql
│   └── seed/provinces-communes.csv # copy từ core
├── web/                            # Angular 22 standalone (iframe UI)
├── deploy/Dockerfile
├── deploy/k8s.yaml
└── src/test/java/...               # JUnit + RestAssured, PostgreSQL thật
```

Core sau khi xong:

```
src/backend/
├── modules/plugin/                 # lifecycle, gateway, deployer, fan-out (giữ)
├── modules/plugin/service/PluginFanoutService.java
├── db/migration/V5.0.0__move_catalog_to_plugin.sql
├── db/migration/V5.0.1__seed_system_tenant.sql
└── (không còn modules/catalog; không có bảng catalog_*)
```

## 4. Luồng chính

**L1 — Cài đặt**
`tenant mới` → `PluginProvisioningService.provisionDefaults` → `PluginLifecycleService.install("catalog")` → `TenantDatasourceService.ensureDatasource` tạo `tenant_<short>_catalog` → deploy container image `open-erp/catalog:<version>` với `DB_SCHEMA`, `DB_URL`, `TENANT_ID` → health → seed permissions → ledger ACTIVE.

**L2 — Lookup form động**
Client → `/api/v1/plugins/runtime/catalog/api/v1/catalog/lookup/{type}/options` → gateway kiểm tra ledger ACTIVE + forward `X-Tenant-Id`, `X-User-Id` → plugin query schema của chính tenant (system rows + tenant rows) → merge theo `code`, tenant thắng → trả 4 khuôn mẫu.

**L3 — Platform system catalog + fan-out**
Platform admin → plugin UI/API của **system tenant** (platform token) → plugin ghi canonical system catalog vào schema `tenant_<systemShort>_catalog` → publish → core `PluginFanoutService` lấy danh sách tenant ACTIVE (trừ system tenant) → gọi `POST /internal/system-catalog/sync` trên từng plugin instance → plugin upsert system rows vào schema tenant → trả kết quả; core ghi operation log + retry các tenant lỗi.

**L4 — Gỡ/tắt**
Tenant admin gọi uninstall/disable → lifecycle dừng container (hoặc giữ dữ liệu) → gateway trả `PLUGIN_DISABLED_FOR_TENANT`; UI iframe không tải được; bật lại → container start, dữ liệu schema còn nguyên.

## 5. Thay đổi DB

### 5.1. System tenant + schema canonical (plugin sở hữu)

- Seed tenant ẩn `TenantType.SYSTEM` (fixed UUID) + `tenant_plugins` row cho `catalog` ở trạng thái ACTIVE.
- Schema `tenant_<systemShort>_catalog` chứa canonical system catalog (PROVINCE, COMMUNE, INDUSTRY, JOB, …) + system edges.
- Platform admin chỉ thao tác trên system tenant; không có bảng catalog nào trong core.

### 5.2. `tenant_<short>_catalog` (plugin sở hữu)

- `catalog_types`, `catalog_items`, `catalog_item_edges`, `catalog_type_grants` — không `tenant_id`; `code` unique trong schema.
- `catalog_type_grants` dùng `role_code` (TENANT_OWNER, TENANT_ADMIN, custom code) thay `role_id`.
- Seed 5 loại tenant (JOB_TITLE, DEPARTMENT, CONTRACT_TYPE, SHIFT, EDUCATION_LEVEL) + grant mặc định.
- Bản sao system rows được fan-out vào đây; tenant override theo `code`.
- Không FK sang `tenants`/`roles`; mọi tham chiếu core là soft reference qua Entity Registry.

### 5.3. Di trú V5

1. Seed system tenant ẩn + `tenant_plugins` ACTIVE.
2. Tạo schema system tenant + bảng; copy `public.catalog_*` có `tenant_id IS NULL` vào đó.
3. Với mỗi tenant: tạo schema `tenant_<short>_catalog` + bảng; copy `catalog_types/items/edges/grants` theo `tenant_id`.
4. Verify row counts; fail-fast nếu lệch.
5. Drop `public.catalog_type_grants`, `catalog_item_edges`, `catalog_items`, `catalog_types`.
6. Cập nhật `plugin_catalog`/`plugin_versions` cho `catalog` (published, distribution image); provisioning dùng lifecycle.

## 6. API/UI contract

- Endpoint nội bộ plugin giữ nguyên path/response hiện tại; client đổi base URL sang gateway.
- Manifest `ui_manifest.screens`: `/apps/catalog` (desktop, IFRAME, permission `catalog:item:read`), `/apps/catalog` (mobile, IFRAME, read_only) — route do core plugin-host quản lý, không hardcode trong `app.routes.ts`.
- `catalog-picker` shared dùng `CATALOG_API_BASE_URL` trỏ gateway; không gọi core.
- Gateway forward `X-Tenant-Id`, `X-User-Id`, `X-User-Permissions`, `X-User-Roles` (role code); plugin `TenantContextFilter` + `RequirePermission` local enforce.
- `catalog_type_grants` API dùng `role_code`; UI lấy danh sách vai trò từ core API (không đọc chéo schema).
- Platform system catalog UI nằm trong plugin UI, route `/platform/apps/catalog` (system tenant + platform token); core portal chỉ host iframe.

## 7. Kế hoạch triển khai

| Phase | Nội dung | Output | Ước lượng |
| :--- | :--- | :--- | :--- |
| **P1** | Scaffold `plugins/catalog`, move backend code, migration/schema, build standalone | Plugin compile + test DB | 0.5 sprint |
| **P2** | Core V5 di trú + system tenant + xoá `modules/catalog`; seed `plugin_versions`; lifecycle/provisioning/fan-out | Core build + migration PASS | 0.5 sprint |
| **P3** | Gateway + permission/entity registrar + bỏ route native; sửa `catalog-picker` | API qua gateway, UI core không còn catalog | 0.25 sprint |
| **P4** | UI Angular iframe bundle + manifest + QA dual-mode | Ảnh/evidence mới | 0.5 sprint |
| **P5** | Test/QA/docs/closure | TR/REV mới | 0.25 sprint |

## 8. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Mất dữ liệu khi drop bảng public | High | V5 copy + verify row count + backup trước; chỉ drop sau khi verify |
| Fan-out lỗi một phần (tenant offline/container down) | High | Operation log từng tenant; retry job; trạng thái `SYNC_PENDING`/`SYNC_FAILED`; không chặn tenant khác |
| System tenant lộ ra danh sách/quota | Medium | `TenantType.SYSTEM` bị loại khỏi list API, quota, báo cáo; test riêng |
| Platform token bị dùng sai tenant | High | Platform token chỉ route system tenant; gateway kiểm tra `scope=platform` + `plugin_key` |
| Container không start do thiếu env/DB | High | Healthcheck + log; fallback `deployer.runtime=noop` chỉ cho test |
| Hai bản system rows lệch giữa các tenant | Medium | Sync idempotent theo `code`; so sánh checksum/version; retry + báo cáo drift |

## 9. Open issues

1. **A6.1**: cần chốt UUID/seed của system tenant và cách loại khỏi mọi danh sách/quota/auth tenant. Đề xuất fixed UUID `00000000-0000-0000-0000-000000000001`, `TenantType.SYSTEM`, status ACTIVE, không user.
2. **A6.3**: `PluginFanoutService` là hạ tầng generic của plugin manager; cần contract internal sync versioned (`contract_version`) để plugin khác dùng lại.
3. **A10**: native route mount UI source từ plugin; iframe bundle là fallback. Cần giữ đồng bộ `@shared` khi plugin UI đổi.
4. **Multi-version**: plugin `1.0.0` là baseline; upgrade/rollback dùng hạ tầng Sprint 03, cần test riêng.

## 10. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Chốt hướng B; 12 quyết định; kế hoạch 5 phase | Chủ dự án chọn B; Agent soạn |
| 0.2 | 2026-10-27 | **Đổi A6**: bỏ `catalog_system` core; plugin sở hữu system catalog qua system tenant + fan-out `PluginFanoutService` tới từng tenant schema | Chủ dự án chỉ đạo trực tiếp |
| 0.3 | 2026-10-27 | **A4.1**: catalog default_install, unlocked; tenant bật/tắt/gỡ trong quản lý plugin; V5.0.1 bỏ locked | Chủ dự án chỉ đạo trực tiếp |
| 0.4 | 2026-10-27 | **A10 đổi**: UI source trong `plugins/catalog/web`, mount native route `/settings/catalog`; bỏ iframe khỏi luồng chính; thêm context menu + URL route-state | Chủ dự án chỉ đạo trực tiếp |
