# [TASK-394] Scaffold plugin package `plugins/catalog` + chuyển backend

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-394 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress** — scaffold compile/package PASS; chờ TASK-395 (schema test) |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | BUG-135, [ADR-S05-001](../05_solutions/02_ADR-S05-001_catalog_independent_plugin.md) / TASK-395…398 |
| Write scope | `plugins/catalog/**`, `package.json` (script build), docs liên quan |

## 1. Mục tiêu

Tạo Maven/Quarkus project độc lập `plugins/catalog`, chuyển mã backend khỏi `src/backend/.../modules/catalog`, giữ contract API hiện tại.

## 2. Việc phải làm

- [ ] `plugins/catalog/pom.xml` (Quarkus 3.x, Java 21, Flyway, PostgreSQL, health, JUnit/RestAssured).
- [ ] `plugins/catalog/plugin.json` theo schema Sprint 03: `packaging: image`, `distribution.type: IMAGE_REGISTRY`, `render_mode: IFRAME`, permissions, entities, ui_manifest.
- [ ] Move `model/repository/service/resource/dto/api` sang package `com.vn9melody.openerp.plugins.catalog`.
- [ ] Thay phụ thuộc core bằng hạ tầng plugin-local: response wrapper 4 khuôn mẫu, `TenantContextFilter` đọc `X-Tenant-Id`/`X-User-Id`/`X-User-Permissions`/`X-User-Roles`, `RequirePermission` local; bỏ `@RegisterEntity`, `AuditTrail` core (dùng `catalog_audit`), `Role` entity (grants theo `role_code`).
- [ ] `application.properties`: `quarkus.datasource.*`, `quarkus.flyway.locations=classpath:db/plugin-migration`, `quarkus.flyway.schemas=${DB_SCHEMA}`.
- [ ] `deploy/Dockerfile` + `deploy/k8s.yaml`; script `npm run plugin:catalog:build`.
- [ ] Test compile/package standalone; không import package `com.vn9melody.openerp.core`/`modules`.

## 3. Tiêu chí nghiệm thu

- `mvn -f plugins/catalog/pom.xml -DskipTests package` PASS.
- `mvn -f plugins/catalog/pom.xml test` PASS trên PostgreSQL thật (khi có schema test).
- `grep` không còn import core trong plugin.
- Core build không còn compile `modules/catalog` (sau TASK-395).

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task theo ADR-S05-001 hướng B | Agent; chủ dự án chọn B |
| 0.2 | 2026-10-27 | **Scaffold xong**: `plugins/catalog` standalone Quarkus project; 53 file biên dịch; `mvn -f plugins/catalog/pom.xml -DskipTests package` PASS; thêm script `npm run plugin:catalog:build/test`; contract local (`ApiResponse`, `ApiException`, `TenantContext`, `RequirePermission`); bỏ phụ thuộc core; grants chuyển `role_code`; audit local log (P1) | Developer Agent; baseline `447a2f9` + working tree |
