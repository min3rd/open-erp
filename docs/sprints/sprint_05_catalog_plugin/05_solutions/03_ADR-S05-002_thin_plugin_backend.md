# ADR-S05-002 — Backend plugin tối giản, core quản trị DB/security

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S05-002 / Architecture Decision / Sprint 05 |
| Trạng thái | Accepted (dev) — 2026-10-27 |
| Owner / reviewer | Architect / Chủ dự án |
| Liên quan | [ADR-S05-001](02_ADR-S05-001_catalog_independent_plugin.md), [TASK-401](../07_items/TASK-401_shared_runtime_and_plugin_styles.md) |

## 1. Bối cảnh

Backend catalog đang là một Quarkus app độc lập phải tự khai báo datasource, Hibernate schema, Flyway, security filter, exception mapper. Điều này làm plugin nặng, dễ lệch cấu hình giữa các môi trường và tăng rủi ro triển khai.

## 2. Quyết định

1. **Plugin chỉ khai báo nghiệp vụ**: entity, quan hệ với core/plugin khác, repository (storage scope `CORE`/`TENANT`), API, websocket trong `plugin.json`.
2. **Core quản trị kết nối DB**: core deployer truyền `QUARKUS_DATASOURCE_*`, schema, Flyway runtime qua env; plugin không chứa URL/user/password.
3. **SDK dùng chung**: `plugin-sdk` chứa API envelope, error codes, response keys, enum parser, security filters (`TenantContextFilter`, `PermissionEnforcementFilter`) và exception mappers. Plugin bật index dependency để Quarkus nhận provider.
4. **Schema vẫn là tài sản plugin**: migration SQL nằm trong plugin (`db/plugin-migration`) để plugin sở hữu DDL; core quyết định khi nào chạy (baseline/schema). Giai đoạn sau có thể đưa DDL vào manifest để core thi hành hoàn toàn.
5. **Container vẫn giữ**: plugin chạy container riêng, nhận context qua gateway; không quay lại core in-process.

## 3. Hệ quả

- Plugin `application.properties` chỉ còn cấu hình nghiệp vụ + `quarkus.flyway.locations` (build-time).
- Plugin không còn `runtime/TenantContextFilter`, `PermissionEnforcementFilter`, datasource config.
- Core deployer/compose chịu trách nhiệm cấp schema/DB env.
- Rủi ro còn lại: Flyway vẫn chạy trong plugin; nếu muốn core chạy DDL hoàn toàn, cần bổ sung schema executor generic (TASK-401 follow-up).

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Chốt mô hình thin container + core data/security runtime | Chủ dự án |
