# Catalog Plugin

Plugin độc lập của Open-ERP: hạ tầng danh mục dùng chung.

- `plugin.json` — manifest theo schema Sprint 03.
- `src/main/java` — Quarkus backend, package `com.vn9melody.openerp.plugins.catalog`.
- `src/main/resources/db/plugin-migration` — migration chạy trong schema tenant (`DB_SCHEMA`).
- `deploy/Dockerfile` — image runtime.
- `web/` — Angular iframe bundle (P4).

Chạy local (sau khi core tạo schema/role):

```bash
# SDK dùng chung (ApiResponse/ApiException/ResponseKey/ErrorCode) — cài một lần
mvn -f plugins/sdk/pom.xml install -DskipTests

mvn -f plugins/catalog/pom.xml quarkus:dev \
  -Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/openerp_dev \
  -Dquarkus.datasource.username=openerp \
  -Dquarkus.datasource.password=openerp_dev_password \
  -Dquarkus.hibernate-orm.database.default-schema=tenant_demo_catalog \
  -Dquarkus.flyway.schemas=tenant_demo_catalog
```

Hoặc build cả reactor: `mvn -f plugins/pom.xml -pl catalog -am package -DskipTests`.

Contract: mọi request từ core gateway mang `X-Tenant-Id`, `X-User-Id`, `X-User-Permissions`, `X-User-Roles`.

> Lưu ý: native query dùng tên bảng không qualify, nên JDBC phải đặt `currentSchema=${DB_SCHEMA}` (đã cấu hình trong `application.properties`). `quarkus.hibernate-orm.database.default-schema` một mình không đủ cho native SQL.
