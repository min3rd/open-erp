# [FEAT-22] Plugin Scaffolding CLI (`@open-erp/cli`)

- **Mã Tính Năng**: FEAT-22
- **Phân Loại**: Feature / Developer Tooling (Node.js)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (Gate 2026-09-19 — package `@open-erp/cli`, lệnh `dev` bắt buộc)
- **Người Xử Lý (Assignee)**: Developer Agent (Node Tooling)
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [x] In Review / [ ] Done / [ ] Deferred
- **Ngày Tạo**: 2026-09-20
- **Tài Liệu Thiết Kế**: [ANL-02](../02_analysis/ANL-02_plugin_scaffold_cli.md), [SOL-03](../05_solutions/SOL-03_plugin_ui_extension_and_cli_dev_experience.md), [DES-03-DB](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [BENCH-02](../03_benchmarks/BENCH-02_plugin_distribution_cli_ui_and_isolation.md)

---

## 1. Mô Tả Yêu Cầu

CLI Node/npm **`@open-erp/cli`** (CLI chung hệ sinh thái; nhóm lệnh plugin là nhóm đầu tiên) đủ vòng đời nhà phát triển: `create` (repo riêng + git init), `generate entity/menu/ui-contribution` (render mode WC/MF/iframe), **`dev`** (plugin local + kết nối Core dev), `validate`, `package` (image/bundle + checksum SHA-256), `link`, `inspect`.

## 2. Tiêu Chí Nghiệm Thu (Theo CONF-01)

- [ ] AC-22.1 `create` sinh repo plugin build PASS ngay; test backend mẫu PASS trên PostgreSQL/Redis thật; không sinh `.spec.ts`.
- [ ] AC-22.2 `generate entity/menu/ui-contribution` sinh đúng mã + i18n + quyền + Entity Registry + slot hợp lệ; chạy lại không phá file đã sửa.
- [ ] AC-22.3 `package` sinh image/bundle + checksum SHA-256 + Dockerfile/K8s; checksum mismatch bị Core từ chối (liên kết AC-23.2).
- [ ] AC-22.4 `link` thêm submodule thành công vào repo chính.
- [ ] `dev` chạy plugin local (Docker Compose) + hot reload + kết nối Core dev; tài liệu hóa.

## 3. Phân Rã Sub-Task (Inline)

| Mã | Nhiệm Vụ | Phụ Trách | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **TASK-321** | Khởi tạo package `@open-erp/cli` (Node ≥20, ESM, `bin/open-erp.js`, cấu trúc `commands/lib`), **zero-dependency** (chỉ Node built-ins) | Dev Tooling | In Review |
| **TASK-322** | Validate manifest (`src/lib/manifest.js`): plugin_key regex + reserved keys, SemVer, permission format, entity trùng, render_mode, contribution slot — dùng chung `validate`/`inspect`/`package` | Dev Tooling | In Review |
| **TASK-323** | Template bundle versioned (`template_version` trong manifest): backend Quarkus + migration up/down + test + Web Angular + deploy Dockerfile/K8s + CI + README + `.gitignore` | Dev Tooling | In Review |
| **TASK-324** | Lệnh `create`: interactive + `--non-interactive`, `--packaging image\|bundle`, `--db postgres\|mongodb`, `--with-web/--with-mobile`, `--dry-run`, `--force`, `--git-init`, `git init` + commit đầu | Dev Tooling | In Review |
| **TASK-325** | Lệnh `generate entity`: entity + migration up/down + quyền + merge an toàn `plugin.json`; `--force` cho file đã tồn tại | Dev Tooling | In Review |
| **TASK-326** | Lệnh `generate menu` và `generate ui-contribution` (`--render-mode web-component\|module-federation\|iframe`, `--slot`) + i18n keys | Dev Tooling | In Review |
| **TASK-327** | Lệnh `package`: build Maven/npm (tùy chọn skip), copy artifact vào `dist/`, **checksum SHA-256** + `release-manifest.json` (distribution, migration policy, rollback strategy) | Dev Tooling | In Review |
| **TASK-328** | Lệnh `dev`: sinh `docker-compose.dev.yml` (Postgres dev + plugin container + env tenant dev + `CORE_DEV_URL`), tùy chọn `--run` | Dev Tooling | In Review |
| **TASK-329** | Lệnh `link` (git submodule) + `inspect`; `publish` push registry **chưa triển khai** (cần cấu hình registry/credentials — chuyển khi FEAT-23 hoàn tất) | Dev Tooling | In Progress |
| **TASK-330** | Smoke test `node --test` (**3/3 PASS**: create→validate, generate entity+ui-contribution, inspect+package) + cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` theo CLI | Dev Tooling | In Review |

## 4. Ghi Chú Triển Khai

- **Vị trí**: `tools/open-erp-cli/` (package private, phát hành npm registry nội bộ khi cần).
- **Zero-dependency**: chỉ dùng Node built-ins (`parseArgs` tự viết, `node:readline/promises`, `node:child_process`, `node:crypto`, `node:fs`) — vượt yêu cầu "hạn chế thư viện bên thứ 3".
- **Kiểm chứng**: `node --test test/*.test.mjs` **3/3 PASS** (2026-09-20) trên Windows; `node bin/open-erp.js help` hoạt động.
- **Còn lại**: `publish` (TASK-329) và build smoke thực tế của dự án sinh ra với `mvn test` + `npm run build` sẽ chạy trong QA (TASK-344/08_testing).
