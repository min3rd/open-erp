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

> **Migration chạy theo tenant**: plugin tự chạy migration trong **schema riêng của tenant** khi container khởi động (`DB_SCHEMA` do Deployer cấp). Không bao giờ tạo bảng trong schema `public`.
> **Quyền**: đăng ký mã `domain:resource:action` trong `plugin.json`; khi cài, TENANT_OWNER nhận quyền tự động.

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

---

## 4. Kiểm tra, đóng gói và chạy local

```bash
npx @open-erp/cli validate            # kiểm tra manifest theo chuẩn nền tảng
npx @open-erp/cli package --with-web  # build + checksum SHA-256 + dist/release-manifest.json
npx @open-erp/cli dev --core-url http://localhost:8088
npx @open-erp/cli link --repo git@github.com:org/open-erp-sales.git --id open-erp-sales
```

- `package` tạo `dist/plugin-backend.jar`, `dist/web/`, `dist/checksums.txt`, `dist/release-manifest.json` để đăng ký với Plugin Manager (kênh Docker/registry hoặc JAR bundle upload).
- `dev` sinh `docker-compose.dev.yml` (Postgres dev + container plugin + biến `TENANT_ID`, `DB_SCHEMA`, `CORE_DEV_URL`) — chạy `docker compose -f docker-compose.dev.yml up -d` hoặc thêm `--run`.

---

## 5. Đăng ký plugin với nền tảng

1. **Super Admin** (plugin công khai) hoặc **Tenant Admin** (plugin riêng, khi được bật `allow_custom_plugins`) đăng ký artifact:
   - Docker Hub / Image Registry: nhập image ref + credentials.
   - JAR bundle: tải lên `dist/` (Core kiểm tra manifest + checksum, build image và deploy).
2. Phiên bản vào trạng thái `DRAFT` → **Công bố** để tenant cài.
3. Tenant cài từ Marketplace: hệ thống tạo container riêng cho tenant, plugin tự migrate trong schema riêng.

---

## 6. Tham chiếu kỹ thuật

- Manifest & API: `docs/sprints/sprint_03_plugin_manager/06_designs/`.
- Vòng đời & deploy: `docs/sprints/sprint_03_plugin_manager/05_solutions/SOL-02...`.
- Chuẩn UI/UX, shared components: `.agents/rules/ui_ux_standards.md`, `docs/08_developer_guides/shared_ui_contribution_guide.md`.
- **Bắt buộc**: template `.html` tách riêng, 100% i18n, không unit test frontend, backend test trên PostgreSQL/Redis thật (không H2).
