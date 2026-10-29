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

## 2. Tạo dự án plugin (template 2.0)

```bash
# Trong monorepo (khuyến nghị — dùng @shared)
npx @open-erp/cli create --id open-erp-sales --name "Bán Hàng" \
  --packaging image --with-web --target plugins/open-erp-sales --non-interactive

# Hoặc mở wizard tương tác
npx @open-erp/cli
```

CLI sinh plugin zero-DB gồm:

```
plugins/open-erp-sales/
├── plugin.json                 # Manifest 2.0: schema_version, entities/fields,
│                               # relations, queries, migrations, ui_manifest
├── pom.xml                     # Quarkus + plugin-sdk; không JDBC/Panache/Flyway
├── src/main/java/...           # POJO + DTO + service/resource dùng PluginDataClient
├── migrations/V1.0.0__initial_schema.sql
├── src/test/java/...           # Test mẫu (JUnit 5 + RestAssured, PostgreSQL/Redis thật)
├── web/                        # Angular 22 WC: screen + header contribution
├── deploy/Dockerfile + k8s.yaml
├── ci/github-actions.yml
└── README.md
```

> **DB/security do core quản trị (zero-DB plugin)**: core deployer cấp schema, chạy migration bundle và inject `PLUGIN_DATA_GATEWAY_URL`, `PLUGIN_DATA_TLS_*` qua env. Plugin **không** khai báo URL/user/password, không dùng datasource/EntityManager/Flyway/Panache/repository, model là POJO. `plugin.json` khai báo `entities[].storage_scope` (`TENANT`/`CORE`), `relations`, `queries` (query DSL), `ui_manifest` và `migrations` (file + SHA-256); DDL đặt trong `migrations/` của plugin và được core chạy trong schema riêng của tenant. Service token được gateway mint theo từng request (`X-Plugin-Service-Token`), không dùng `TENANT_ID`/`PLUGIN_SERVICE_TOKEN` cố định.
> **Quyền**: đăng ký mã `domain:resource:action` trong `plugin.json`; khi cài, TENANT_OWNER nhận quyền tự động.
> **Read/write path P3–P4.1 (2026-10-28)**: plugin đọc/ghi qua `PluginDataClient` bằng `queries` descriptor trong `plugin.json` (không gửi SQL); cache Redis do **plugin tự quản lý** với namespace riêng, TTL ngắn và generation invalidation sau write. Write dùng idempotency key + `ExecuteBatch`; import, seeder và system fan-out cũng đã qua gateway. Descriptor WRITE scope `TENANT` có thể khai báo `"system_row": true` để ghi/đọc đúng các row `tenant_id IS NULL` trong schema của chính plugin (dùng cho seeding/fan-out system data; core từ chối nếu có join hoặc scope khác TENANT). Xem [TASK-402](../sprints/sprint_05_catalog_plugin/07_items/TASK-402_plugin_data_gateway_grpc.md).

---

## 3. Sinh mã trong dự án

```bash
# Entity + migration + quyền + query descriptor + checksum
npx @open-erp/cli generate entity --name Invoice --fields "code:string:required+unique,total:decimal,status:string"

# Field / quan hệ (FK self hoặc soft-ref Core/plugin)
npx @open-erp/cli generate field --entity Invoice --name status --type enum --enum-values ACTIVE,INACTIVE
npx @open-erp/cli generate relation --entity Invoice --name customer --target core.user --storage SOFT_REF

# CRUD Angular (list + drawer) + Java DTO/service/resource + queries + screen
npx @open-erp/cli generate crud --entity Invoice

# Màn hình riêng (menu + route + i18n) — WC/MF
npx @open-erp/cli generate menu --route /apps/open-erp-sales --title-key PLUGIN_SALES_MENU

# UI Contribution nhúng vào slot Core
npx @open-erp/cli generate ui-contribution --slot core.layout.header.actions --render-mode web-component
```

- Quy ước ID: lowercase kebab-case, 3–50 ký tự, không trùng `core`, `iam`, `platform`, `organization`, `plugins`.
- `generate` merge an toàn vào `plugin.json`; file mã nguồn đã tồn tại cần `--force`.
- `--render-mode` chỉ nhận `web-component` hoặc `module-federation`; **iframe không còn được hỗ trợ**.
- Core **không hardcode menu plugin**: đọc `ui_manifest.screens`, map `route`/`title_key`/`permission` thành menu và mount qua host cố định `/settings/apps/:pluginKey`.
- Contribution đọc context (`theme`, `language`, `tenant`, `user`, `permissions`) và phát event `op:navigate`/`op:notify`/`op:resize`; Core là bên render slot.
- Entry/static asset tải qua gateway với `plugin_token` ngắn hạn; API calls dùng JWT Core.

---

## 4. Kiểm tra, đóng gói và chạy local

```bash
npx @open-erp/cli validate            # offline: manifest/field/relation/slot/checksum
npx @open-erp/cli validate --core-url http://localhost:8088 --token "$OPENERP_TOKEN"
npx @open-erp/cli upgrade --check     # MISSING/OUTDATED/CUSTOMIZED so với template 2.0
npx @open-erp/cli upgrade --apply --yes  # backup .open-erp/upgrade-*; không ghi đè file custom
npx @open-erp/cli package --with-web  # build + checksum SHA-256 + dist/release-manifest.json
npx @open-erp/cli dev --core-url http://localhost:8088
npx @open-erp/cli link --repo git@github.com:org/open-erp-sales.git --id open-erp-sales
```

- `package` tạo `dist/plugin-backend.jar`, `dist/web/`, `dist/checksums.txt`, `dist/release-manifest.json` để đăng ký với Plugin Manager (kênh Docker/registry hoặc JAR bundle upload).
- `dev` sinh `docker-compose.dev.yml` (Postgres dev + container plugin + biến `PLUGIN_DATA_GATEWAY_URL`, `PLUGIN_DATA_TLS_CA/CERT/KEY`, `PLUGIN_SCOPE`, `CORE_DEV_URL`); service token do gateway mint theo request, không cấu hình `TENANT_ID`/`PLUGIN_SERVICE_TOKEN` cố định. Chạy `docker compose -f docker-compose.dev.yml up -d` hoặc thêm `--run`.

---

## 5. Đăng ký plugin với nền tảng

1. **Super Admin** (plugin công khai) hoặc **Tenant Admin** (plugin riêng, khi được bật `allow_custom_plugins`) đăng ký artifact:
   - Docker Hub / Image Registry: nhập image ref + credentials.
   - JAR bundle: tải lên `dist/` (Core kiểm tra manifest + checksum, build image và deploy).
2. Phiên bản vào trạng thái `DRAFT` → **Công bố** để tenant cài.
3. Tenant cài từ Marketplace: Core tạo schema tenant, chạy migration bundle của plugin và deploy runtime tương ứng.

---

## 6. Template 2.0 & plugin độc lập

Sprint 06 đã bỏ mô hình plugin core in-process. Mọi plugin nghiệp vụ (kể cả `catalog`) là **plugin độc lập**:
artifact/container riêng, schema tenant riêng, API qua gateway, UI manifest riêng. Template CLI 2.0 sinh đúng mô hình zero-DB.

| Phần | Quy ước |
| :--- | :--- |
| Manifest | `plugin.json` tại gốc plugin; `schema_version: "2.0"`, `template_version: "2.0.0"` |
| Backend | Quarkus + `plugin-sdk`; POJO/DTO/service/resource; DB qua `PluginDataClient` |
| Migration | `migrations/` + SHA-256 trong `plugin.json.migrations[]`; core chạy trong schema tenant |
| UI | Web Component (`main.js`) hoặc Module Federation; screen + contribution trong `ui_manifest` |
| Nguồn dùng chung | `@shared` (monorepo) hoặc UI SDK publish (follow-up cho repo ngoài) |

**Bản mẫu tham chiếu:** `plugins/catalog/` (backend zero-DB, data gateway) và plugin `in-app-notification` (Sprint 06).

---

## 7. Tham chiếu kỹ thuật

- Manifest & UI slot API: `docs/sprints/sprint_06_plugin_dev_platform/06_designs/api/01_DES-API-S06-001_manifest_and_ui_manifest.md`.
- Vòng đời & deploy: `docs/sprints/sprint_03_plugin_manager/05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md`.
- CLI/codegen: `docs/sprints/sprint_06_plugin_dev_platform/06_designs/arch/02_DES-ARCH-S06-002_cli_interactive_and_codegen.md`.
- Chuẩn UI/UX, shared components: `.agents/rules/ui_ux_standards.md`, `docs/08_developer_guides/shared_ui_contribution_guide.md`.
- **Bắt buộc**: template `.html` tách riêng, 100% i18n, không unit test frontend, backend test trên PostgreSQL/Redis thật (không H2).
