# [TASK-394] Scaffold plugin package `plugins/catalog` + chuyển backend

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-394 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (QA)** 2026-10-29 — scaffold + schema/API/UI plugin độc lập; TR-S05-002/003/004 PASS |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | BUG-135, [ADR-S05-001](../05_solutions/02_ADR-S05-001_catalog_independent_plugin.md) / TASK-395…398 |
| Write scope | `plugins/catalog/**`, `package.json` (script build), docs liên quan |

## 1. Mục tiêu

Tạo Maven/Quarkus project độc lập `plugins/catalog`, chuyển mã backend khỏi `src/backend/.../modules/catalog`, giữ contract API hiện tại.

## 2. Việc phải làm

- [x] `plugins/catalog/pom.xml` (Quarkus 3.x, Java 21, health, JUnit/RestAssured; zero-DB — không JDBC/Flyway/Panache).
- [x] `plugins/catalog/plugin.json` theo schema Sprint 03: `packaging: image`, `distribution.type: IMAGE_REGISTRY`, `render_mode: IFRAME`, permissions, entities, ui_manifest.
- [x] Move `model/repository/service/resource/dto/api` sang package `com.vn9melody.openerp.plugins.catalog` (repository đã bỏ, model POJO).
- [x] Thay phụ thuộc core bằng hạ tầng plugin-local: response wrapper 4 khuôn mẫu, `TenantContextFilter` đọc `X-Tenant-Id`/`X-User-Id`/`X-User-Permissions`/`X-User-Roles`, `RequirePermission` local; bỏ `@RegisterEntity`, `AuditTrail` core (dùng `catalog_audit`), `Role` entity (grants theo `role_code`).
- [x] `application.properties`: gateway URL/token/TLS, Redis cache; không datasource/Flyway.
- [x] `deploy/Dockerfile` + `deploy/k8s.yaml`; script `npm run plugin:catalog:build`.
- [x] Test compile/package standalone; không import package `com.vn9melody.openerp.core`/`modules`.

## 3. Tiêu chí nghiệm thu

- `mvn -f plugins/catalog/pom.xml -DskipTests package` PASS.
- `mvn -f plugins/catalog/pom.xml test` PASS trên PostgreSQL thật (khi có schema test).
- `grep` không còn import core trong plugin.
- Core build không còn compile `modules/catalog` (sau TASK-395).

## 3.1. Kiểm chứng P1 (2026-10-27)

| Hạng mục | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| Compile/package standalone | ✅ PASS | `mvn -f plugins/catalog/pom.xml -DskipTests package` — 53 file, Quarkus augmentation PASS |
| Flyway trên schema thật | ✅ PASS | PostgreSQL 16 dev; schema `tenant_test_catalog`, migration `1.0.0` |
| Seed system catalog | ✅ PASS | 5 system types + 34 tỉnh + 3.321 xã/phường + 3.321 cạnh |
| Seed tenant catalog | ✅ PASS | 5 tenant types + 10 grant (`TENANT_OWNER`, `TENANT_ADMIN`) |
| Native SQL đúng schema | ✅ PASS | thêm `quarkus.datasource.jdbc.additional-jdbc-properties.currentSchema=${DB_SCHEMA}`; index trigram qualify `public.gin_trgm_ops` |
| API/gateway + UI | ✅ Done | TASK-396/TASK-399/TASK-402; QA TR-S05-002/003/004 |

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task theo ADR-S05-001 hướng B | Agent; chủ dự án chọn B |
| 0.2 | 2026-10-27 | **Scaffold xong**: `plugins/catalog` standalone Quarkus project; 53 file biên dịch; `mvn -f plugins/catalog/pom.xml -DskipTests package` PASS; thêm script `npm run plugin:catalog:build/test`; contract local (`ApiResponse`, `ApiException`, `TenantContext`, `RequirePermission`); bỏ phụ thuộc core; grants chuyển `role_code`; audit local log (P1) | Developer Agent; baseline `447a2f9` + working tree |
| 0.3 | 2026-10-29 | **Done (QA)**: gateway/UI/DB role hoàn tất qua TASK-396…406; zero-DB (không JDBC/Flyway/Panache/repository); TR-S05-002/003/004 PASS | QA/Developer |
