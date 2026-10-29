# [TASK-407] CLI scaffold theo kiến trúc zero-DB (bỏ Panache/Flyway/datasource)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-407 / Tooling refactor / Backlog sau Sprint 05 |
| Mức độ / trạng thái | **Medium** / **Open** 2026-10-29 |
| Owner / reviewer | Developer / Architect |
| Liên quan | [TASK-401](TASK-401_shared_runtime_and_plugin_styles.md), [TASK-402](TASK-402_plugin_data_gateway_grpc.md), [TASK-406](TASK-406_plugin_runtime_per_version.md), `docs/08_developer_guides/create_new_plugin_guide.md` |

## 1. Vấn đề

Plugin runtime catalog đã zero-DB, nhưng **CLI generator** vẫn scaffold plugin theo kiến trúc cũ:

- `tools/open-erp-cli/src/lib/templates.js`: POM có `quarkus-hibernate-orm-panache`, `quarkus-jdbc-postgresql`, `quarkus-flyway`; `application.properties` có datasource/Flyway; entity là `@Entity`/Panache; sinh `SampleItemRepository`; resource đọc `TENANT_ID`.
- `tools/open-erp-cli/src/commands/generate.js`: entity mới vẫn dùng Panache + migration có `tenant_id`.
- `npx @open-erp/cli dev` vẫn sinh compose với `TENANT_ID`/`PLUGIN_SERVICE_TOKEN` cố định.

Sinh plugin mới theo template này sẽ vi phạm invariant zero-DB và không chạy đúng trên shared runtime TASK-406.

## 2. Phạm vi

- POM: bỏ JDBC/Hibernate/Flyway; thêm `plugin-sdk` (hoặc hướng dẫn cài SDK local).
- `application.properties`: chỉ gateway URL/TLS/Redis; không datasource/Flyway.
- Entity: POJO; bỏ `SampleItemRepository`.
- Service/resource: mẫu gọi `PluginDataClient` + `queries` descriptor, hoặc stub 501 rõ ràng nếu chưa có query.
- Migration: plain SQL trong `migrations/`, khai báo `plugin.json.migrations` + SHA-256; bỏ `tenant_id` khỏi bảng per-tenant schema.
- `generate entity`: cập nhật POJO + migration + manifest checksum.
- `dev`: compose không inject `TENANT_ID`/`PLUGIN_SERVICE_TOKEN`; dùng gateway/bootstrap.
- Cập nhật test CLI (`tools/open-erp-cli/test/cli.test.mjs`) và README mẫu.

## 3. Tiêu chí nghiệm thu

- Plugin scaffold ra không còn `jakarta.persistence`, Panache, JDBC, Flyway, datasource, repository.
- `mvn package` + `node --test tools/open-erp-cli/test/cli.test.mjs` PASS.
- Generated plugin chạy được với data gateway (hoặc stub 501 rõ ràng, không giả lập DB).
- Không còn `TENANT_ID`/`PLUGIN_SERVICE_TOKEN` trong compose do CLI sinh.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo task sau khi rà soát zero-DB: runtime plugin sạch nhưng CLI template còn Panache/Flyway/datasource | QA/Architect |
