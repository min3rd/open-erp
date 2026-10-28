# Catalog Plugin

Plugin độc lập của Open-ERP: hạ tầng danh mục dùng chung.

- `plugin.json` — manifest theo schema Sprint 03.
- `src/main/java` — Quarkus backend, package `com.vn9melody.openerp.plugins.catalog`.
- `migrations/` — DDL bundle do **core** chạy trong schema tenant; manifest khai báo file + SHA-256, plugin không có datasource/Flyway.
- `deploy/Dockerfile` — image runtime.
- `web/` — Angular iframe bundle (P4).

Plugin zero DB: mọi đọc/ghi đi qua core Plugin Data Gateway (gRPC + service token/mTLS); cache Redis do plugin tự quản lý.

Chạy local (core đã tạo schema và mount `plugins/catalog/migrations` vào `OPENERP_PLUGIN_MIGRATIONS_DIR`):

```bash
# SDK dùng chung (API envelope + security filters)
mvn -f plugins/sdk/pom.xml install -DskipTests

# Không cần bất kỳ biến QUARKUS_DATASOURCE_* nào.
mvn -f plugins/catalog/pom.xml quarkus:dev
```

Hoặc build cả reactor: `mvn -f plugins/pom.xml -pl catalog -am package -DskipTests`.

Contract: mọi request từ core gateway mang `X-Tenant-Id`, `X-User-Id`, `X-User-Permissions`, `X-User-Roles`.
