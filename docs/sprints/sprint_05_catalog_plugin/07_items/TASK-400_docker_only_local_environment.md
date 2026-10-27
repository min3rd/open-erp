# [TASK-400] Docker-only local development environment

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-400 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev)** — Web, Backend, plugin và plugin UI build đều chạy trong Docker |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-394, TASK-397 / TASK-398 |
| Write scope | `docker-compose.yml`, `docker/web/**`, `docker/mobile/**`, `plugins/catalog/deploy/Dockerfile`, `src/frontend/web/proxy.docker.conf.json`, `package.json`, `.dockerignore` |

## 1. Mục tiêu

Môi trường local chạy sát production: một lệnh Docker Compose dựng Postgres, Redis, core backend, web dev server và plugin container; không chạy Java/Angular dev server trực tiếp trên host.

## 2. Việc phải làm

- [x] Thêm `web-dev` (Node 22 + `ng serve --host 0.0.0.0 --poll 2000`) và `mobile-dev` (:8100) vào profile `dev`, volume source + node_modules.
- [x] Proxy Docker `proxy.docker.conf.json` trỏ `backend-dev:8080`.
- [x] `npm run dev` / `npm run web` / `npm run backend` / `npm run dev:stop` dùng Docker Compose.
- [x] Build UI bundle trong plugin image (Node stage → `META-INF/resources`) thay vì dùng bundle build trên host.
- [x] `group_add: ["0"]` cho backend để deployer dùng được Docker socket trên Docker Desktop.
- [x] `TenantDatasourceService` grant quyền bảng/sequence cho role runtime để container plugin tự migrate/seed.
- [x] `PLUGIN_FANOUT_TOKEN` + `PLUGIN_SCOPE` truyền vào container do deployer tạo.
- [x] `.dockerignore` loại node_modules/dist/target/logs khỏi build context.

## 3. Tiêu chí nghiệm thu

- `npm run dev` dựng `openerp-web-dev` tại `http://localhost:4200` và `openerp-mobile-dev` tại `http://localhost:8100`; proxy `/api` sang backend container.
- `docker compose --profile dev build web-dev catalog-plugin-dev backend-dev` PASS.
- Plugin image chứa bundle UI build trong image; không cần `npm run catalog:ui:build` trên host.
- Backend container gọi được Docker API (`docker ps` trong container) cho deployer.
- Disable → enable plugin tạo container mới healthy; API gateway trả 200.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task; web-dev Docker, plugin UI build trong image, sửa quyền socket + DB role; build/browser PASS | Chủ dự án chỉ đạo trực tiếp |
