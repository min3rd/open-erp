# [FEAT-22] Plugin Scaffolding CLI (`@open-erp/cli`)

- **Mã Tính Năng**: FEAT-22
- **Phân Loại**: Feature / Developer Tooling (Node.js)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (Gate 2026-09-19 — package `@open-erp/cli`, lệnh `dev` bắt buộc)
- **Người Xử Lý (Assignee)**: Developer Agent (Node Tooling)
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ngày Tạo**: 2026-09-20
- **Tài Liệu Thiết Kế**: [ANL-02](../02_analysis/ANL-02_plugin_scaffold_cli.md), [SOL-03](../05_solutions/SOL-03_plugin_ui_extension_and_cli_dev_experience.md), [DES-03-DB](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [BENCH-02](../03_benchmarks/BENCH-02_plugin_distribution_cli_ui_and_isolation.md)

---

## 1. Mô Tả Yêu Cầu

CLI Node/npm **`@open-erp/cli`** (CLI chung hệ sinh thái; nhóm lệnh plugin là nhóm đầu tiên) đủ vòng đời nhà phát triển: `create` (repo riêng + git submodule), `generate entity/menu/ui-contribution` (render mode WC/MF/iframe), **`dev`** (plugin local + hot reload + kết nối Core dev), `validate`, `package` (image/bundle + checksum SHA-256 + Dockerfile/K8s), `link`, `inspect`, `publish`.

## 2. Phạm Vi & Tham Chiếu

- Lệnh & tham số: [ANL-02 mục 3–5](../02_analysis/ANL-02_plugin_scaffold_cli.md); kiến trúc CLI: [SOL-03 mục 3](../05_solutions/SOL-03_plugin_ui_extension_and_cli_dev_experience.md).
- Template sinh vertical slice mẫu: manifest `plugin.json`, backend Quarkus Java 21, migration idempotent (up/down), Web Angular 22 (template `.html`, i18n, `@shared`), `deploy/` Dockerfile + K8s, `ci/`, README.
- **Ngoại lệ thư viện dev tooling** (đã chốt SOL-03 mục 6): `commander`, `prompts`, `ajv`, `execa`, `tar`/`adm-zip`; test smoke bằng `node --test`.

## 3. Tiêu Chí Nghiệm Thu (Theo CONF-01)

- [ ] AC-22.1 `create` sinh repo plugin build PASS ngay; test backend mẫu PASS trên PostgreSQL/Redis thật; không sinh `.spec.ts`.
- [ ] AC-22.2 `generate entity/menu/ui-contribution` sinh đúng mã + i18n + quyền + Entity Registry + slot hợp lệ; chạy lại không phá file đã sửa.
- [ ] AC-22.3 `package` sinh image/bundle + checksum SHA-256 + Dockerfile/K8s; checksum mismatch bị Core từ chối (liên kết AC-23.2).
- [ ] AC-22.4 `link` thêm submodule thành công vào repo chính.
- [ ] `dev` chạy plugin local (Docker Compose) + hot reload + kết nối Core dev; tài liệu hóa.

## 4. Phân Rã Sub-Task (Inline)

| Mã | Nhiệm Vụ | Phụ Trách | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **TASK-321** | Khởi tạo package `@open-erp/cli` (Node 22 + TypeScript, `bin/open-erp.js`, cấu trúc `commands/core/packaging/dev/templates`), config build & publish npm private | Dev Tooling | To Do |
| **TASK-322** | JSON Schema `plugin.schema.json` + module `validate` (SemVer, permission format, slot tồn tại, entity trùng, core compatibility) dùng chung cho CLI & Core | Dev Tooling | To Do |
| **TASK-323** | Template bundle versioned (`template.json` gắn core compatibility): backend Quarkus + migration up/down + test mẫu + Web Angular + mobile stub + deploy + ci + README; cơ chế token-replace | Dev Tooling | To Do |
| **TASK-324** | Lệnh `create`: prompt/non-interactive, `--packaging image\|bundle`, `--db postgres\|mongodb`, `--with-web/mobile`, `--dry-run/--force`, `git init`, dọn file khi lỗi | Dev Tooling | To Do |
| **TASK-325** | Lệnh `generate entity` (entity + migration + repo/service/resource/DTO + `@RegisterEntity` + permission + i18n) với merge an toàn `plugin.json` | Dev Tooling | To Do |
| **TASK-326** | Lệnh `generate menu` (screens + route stub) và `generate ui-contribution` (`--render-mode web-component\|module-federation\|iframe`, slot validate + stub tương ứng) | Dev Tooling | To Do |
| **TASK-327** | Lệnh `package`: build backend/frontend, image build (docker build) hoặc bundle zip, **checksum SHA-256**, manifest phát hành, K8s manifests | Dev Tooling | To Do |
| **TASK-328** | Lệnh `dev`: sinh `docker-compose.dev.yml` (container plugin + Postgres/MinIO dev + tenant dev context), chạy Quarkus/Angular dev server, proxy `--core-url`, watch/hot reload | Dev Tooling | To Do |
| **TASK-329** | Lệnh `link` (git submodule) + `inspect` + `publish` (push registry theo cấu hình) | Dev Tooling | To Do |
| **TASK-330** | Smoke test CLI (`node --test`) trong CI (create → build → test backend; validate lỗi manifest; package --dry-run) + cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` | Dev Tooling | To Do |

## 5. Ghi Chú

- CLI **không** kết nối production, không chứa credentials; `create`/`generate` không ghi đè file không có `--force`.
- Template phải cập nhật khi Core đổi hợp đồng (API envelope, manifest, permission).
- `package` phục vụ trực tiếp FEAT-23 (kênh `JAR_BUNDLE` / image registry).
