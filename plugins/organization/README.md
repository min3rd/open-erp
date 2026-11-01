# Organization plugin

Plugin `org-structure` (always-on; tên nghiệp vụ: Organization): branch, department, access membership và outbox cập nhật Core scope projection.

- Zero-DB: đọc/ghi qua `PluginDataClient` + query descriptor.
- API: `/api/v1/org/branches`, `/departments`, `/memberships`.
- Bootstrap: `POST /api/v1/org/internal/bootstrap` tạo `HQ` + `GENERAL` + membership owner (idempotent).
- UI: chưa có trong TASK-426; TASK-429.

## Build

```bash
mvn -q -f plugins/pom.xml -pl organization -am package -DskipTests
```

## Migration

`migrations/V1.0.0__initial_schema.sql` tạo `plg_organization_*`; checksum trong `plugin.json`.
