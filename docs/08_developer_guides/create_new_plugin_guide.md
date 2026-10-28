# Hướng Dẫn Xây Dựng Một Plugin Mới (Plugin Development Guide)

Tài liệu này hướng dẫn tạo và phát triển plugin bằng CLI chung **`@open-erp/cli`** (khuyến nghị), kèm cấu trúc tham chiếu khi cần chỉnh tay.

---

## 1. Cài đặt CLI

```bash
npm i -g @open-erp/cli
# hoặc dùng npx
npx @open-erp/cli help
```

Yêu cầu: Node.js ≥ 20. CLI **zero-dependency**, không cần cài thêm gói.

---

## 2. Tạo dự án plugin (repo độc lập)

```bash
npx @open-erp/cli create --id open-erp-sales --name "Bán Hàng" \
  --packaging image --db postgres --with-web --non-interactive
```

CLI sinh repo riêng (mặc định `./open-erp-sales`) gồm:

```
open-erp-sales/
├── plugin.json                 # Manifest: id, version, compatibility, dependencies,
│                               # platforms, permissions, entities, ui_manifest, distribution
├── pom.xml                     # Quarkus (Java 21) backend
├── src/main/java/...           # Entity mẫu + repository + service + resource
├── src/main/resources/db/plugin-migration/
│   ├── V1.0.0__initial_schema.up.sql
│   └── V1.0.0__initial_schema.down.sql
├── src/test/java/...           # Test mẫu (JUnit 5 + RestAssured, PostgreSQL/Redis thật)
├── web/                        # Angular 22 + i18n (nếu --with-web)
├── deploy/Dockerfile + k8s.yaml
├── ci/github-actions.yml
└── README.md
```

> **DB/security do core quản trị (zero-DB plugin)**: core deployer cấp schema, chạy migration bundle và inject `PLUGIN_DATA_GATEWAY_URL`, `PLUGIN_SERVICE_TOKEN`, `PLUGIN_DATA_TLS_*` qua env. Plugin **không** khai báo URL/user/password, không dùng datasource/EntityManager/Flyway. `plugin.json` khai báo `entities[].storage_scope` (`TENANT`/`CORE`), `relations`, `repositories`, `apis`, `websockets`, và `migrations` (file + SHA-256); DDL đặt trong `migrations/` của plugin và được core chạy trong schema riêng của tenant.
> **Quyền**: đăng ký mã `domain:resource:action` trong `plugin.json`; khi cài, TENANT_OWNER nhận quyền tự động.
> **Read/write path P3–P4.1 (2026-10-28)**: plugin đọc/ghi qua `PluginDataClient` bằng `queries` descriptor trong `plugin.json` (không gửi SQL); cache Redis do **plugin tự quản lý** với namespace riêng, TTL ngắn và generation invalidation sau write. Write dùng idempotency key + `ExecuteBatch`; import, seeder và system fan-out cũng đã qua gateway. Descriptor WRITE scope `TENANT` có thể khai báo `"system_row": true` để ghi/đọc đúng các row `tenant_id IS NULL` trong schema của chính plugin (dùng cho seeding/fan-out system data; core từ chối nếu có join hoặc scope khác TENANT). Xem [TASK-402](../sprints/sprint_05_catalog_plugin/07_items/TASK-402_plugin_data_gateway_grpc.md).

---

## 3. Sinh mã trong dự án

```bash
# Entity + migration + quyền + cập nhật manifest
npx @open-erp/cli generate entity --name Invoice --fields "code:string,total:decimal,status:string"

# Màn hình riêng (menu + route + i18n) — chế độ hiển thị đầy đủ (MF/WC/iframe)
npx @open-erp/cli generate menu --route /apps/open-erp-sales --title-key PLUGIN_SALES_MENU

# UI Contribution nhúng vào màn hình có sẵn của Core/plugin khác
npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
```

- Quy ước ID: lowercase kebab-case, 3–50 ký tự, không trùng `core`, `iam`, `platform`, `organization`, `plugins`.
- `generate` merge an toàn vào `plugin.json`; file mã nguồn đã tồn tại cần `--force`.
- `--render-mode` nhận `web-component`, `module-federation` hoặc `iframe` (mặc định iframe khi không hỗ trợ WC/MF).
- Core **không hardcode menu plugin**: nó đọc `ui_manifest.screens` từ `/api/v1/plugins/ui-manifest`, map `route`/`title_key`/`permission` thành menu và mount qua host cố định `/apps/:pluginKey`. Screen chỉ xuất hiện khi tenant đang bật plugin (ACTIVE) và user có quyền. Đặt `route` theo quy ước `/apps/{pluginKey}` (hoặc sub-path) để host resolve đúng.
- Plugin iframe gọi API qua `/api/v1/plugins/runtime/{pluginKey}/...`. Runtime token chỉ sống vài phút: khi nhận `401` + `code = PLUGIN_RUNTIME_TOKEN_INVALID`, UI plugin post `{source:'open-erp-plugin', type:'session-expired'}` để host xin token mới và reload iframe; nếu refresh thất bại host tự kết thúc phiên về `/login`. Xem mẫu ở `plugins/catalog/web/src/plugin-main.ts`.

---

## 4. Kiểm tra, đóng gói và chạy local

```bash
npx @open-erp/cli validate            # kiểm tra manifest theo chuẩn nền tảng
npx @open-erp/cli package --with-web  # build + checksum SHA-256 + dist/release-manifest.json
npx @open-erp/cli dev --core-url http://localhost:8088
npx @open-erp/cli link --repo git@github.com:org/open-erp-sales.git --id open-erp-sales
```

- `package` tạo `dist/plugin-backend.jar`, `dist/web/`, `dist/checksums.txt`, `dist/release-manifest.json` để đăng ký với Plugin Manager (kênh Docker/registry hoặc JAR bundle upload).
- `dev` sinh `docker-compose.dev.yml` (Postgres dev + container plugin + biến `TENANT_ID`, `PLUGIN_DATA_GATEWAY_URL`, `PLUGIN_SERVICE_TOKEN`, `PLUGIN_DATA_TLS_CA/CERT/KEY`, `CORE_DEV_URL`) — chạy `docker compose -f docker-compose.dev.yml up -d` hoặc thêm `--run`.

---

## 5. Đăng ký plugin với nền tảng

1. **Super Admin** (plugin công khai) hoặc **Tenant Admin** (plugin riêng, khi được bật `allow_custom_plugins`) đăng ký artifact:
   - Docker Hub / Image Registry: nhập image ref + credentials.
   - JAR bundle: tải lên `dist/` (Core kiểm tra manifest + checksum, build image và deploy).
2. Phiên bản vào trạng thái `DRAFT` → **Công bố** để tenant cài.
3. Tenant cài từ Marketplace: hệ thống tạo container riêng cho tenant, plugin tự migrate trong schema riêng.

---

## 6. Plugin **core in-process** (không đóng gói) — bản mẫu: plugin `catalog`

> **⚠️ 2026-10-27 — KHÔNG DÙNG LÀM MẪU:** Mô hình `CORE_IN_PROCESS` dưới đây đang bị bác theo [BUG-135](../../docs/sprints/sprint_05_catalog_plugin/07_items/BUG-135_catalog_not_independent_plugin.md). Plugin nghiệp vụ (kể cả `catalog`) phải là plugin độc lập theo mục 1–5 (artifact/container riêng, schema tenant riêng, API gateway, UI manifest). Mục này giữ làm lịch sử cho đến khi ADR-S05-001 ban hành.

Plugin chạy ngay trong tiến trình core **không** đi qua CLI/registry: mã nằm trong `modules/<plugin>/` của backend, không có `plugin.json` ở gốc repo. Descriptor vẫn được khai báo theo **cùng định dạng** (để sau này tách ra đóng gói không phải sửa gì), đặt tại `src/backend/src/main/resources/plugins/<id>/plugin.json`, khác 2 điểm:

| Khác biệt | Plugin đóng gói | Plugin core in-process |
| :--- | :--- | :--- |
| Vị trí manifest | gốc repo plugin | `src/backend/src/main/resources/plugins/<id>/plugin.json` |
| `packaging` / `distribution.type` | theo cờ `--packaging` | `CORE_IN_PROCESS` (không chạy `npx @open-erp/cli validate` cho file này) |
| Migration | `migrations/` + `plugin.json.migrations` (core chạy) | `db/migration/V*.sql` của core (chung Flyway) |
| Cách xem descriptor | đọc file trong repo plugin | `GET /api/v1/catalog/plugin/manifest` (endpoint riêng của plugin) |

**Bản mẫu tham chiếu — plugin `catalog` (Sprint 05):**

| Phần | Vị trí |
| :--- | :--- |
| Descriptor | `src/backend/src/main/resources/plugins/catalog/plugin.json` (`platforms.desktop/mobile.features`, `permissions`, `entities`, `ui_manifest`) |
| Mã backend | `src/backend/src/main/java/com/vn9melody/openerp/modules/catalog/` (`model/`, `repository/`, `service/`, `resource/`, `dto/`, `api/`) |
| Migration + seed | `db/migration/V4.0.0__catalog_core_plugin.sql`, `V4.0.1__drop_catalog_type_source.sql`; seeder địa giới `db/seed/provinces-communes.csv` (`npm run data:admin-units`) |
| UI dùng chung | `src/frontend/shared/components/catalog-picker/`, `src/frontend/shared/services/catalog.service.ts`, `src/frontend/shared/models/catalog.model.ts` |
| UI Desktop | `src/frontend/web/src/app/features/settings/catalog/` + `core/services/catalog-admin.service.ts` |
| UI Mobile (read-only) | `src/frontend/mobile/src/app/features/settings/catalog/` + menu ở `shared/components/mobile-nav-drawer` |
| Test chống lệch descriptor | `src/backend/src/test/java/com/vn9melody/openerp/modules/catalog/resource/CatalogPluginManifestTest.java` (5 quyền seed + 4 entity đã đăng ký + row `plugin_catalog`) |

Quy ước bắt buộc khi thêm plugin core: descriptor là **nguồn khai báo duy nhất** cho ma trận Desktop/Mobile; khai báo phải có test đối chiếu với DB (như `CatalogPluginManifestTest`), entity phải `@RegisterEntity` (Entity Registry), và mỗi loại chức năng phải ghi rõ chạy được ở Desktop / Mobile / cả hai.

---

## 7. Tham chiếu kỹ thuật

- Manifest & API: `docs/sprints/sprint_03_plugin_manager/06_designs/`.
- Vòng đời & deploy: `docs/sprints/sprint_03_plugin_manager/05_solutions/SOL-02...`.
- Chuẩn UI/UX, shared components: `.agents/rules/ui_ux_standards.md`, `docs/08_developer_guides/shared_ui_contribution_guide.md`.
- **Bắt buộc**: template `.html` tách riêng, 100% i18n, không unit test frontend, backend test trên PostgreSQL/Redis thật (không H2).
