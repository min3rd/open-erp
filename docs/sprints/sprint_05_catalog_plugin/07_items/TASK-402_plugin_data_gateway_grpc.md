# [TASK-402] Plugin Data Gateway gRPC — plugin zero DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-402 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do** — triển khai theo SOL-S05-002 |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-401, SOL-S05-002 / QA TASK-398 |
| Write scope | `plugins/sdk/**`, `plugins/catalog/**`, `src/backend/src/main/java/**/plugin/**`, `docker-compose.yml`, `deployments/k8s/**` |

## 1. Mục tiêu

Chuyển toàn bộ đọc/ghi DB của catalog sang core gRPC data gateway; plugin không còn DB credential, datasource, repository DB, Flyway. Core chỉ validate descriptor/tenant/scope và thực thi SQL/migration.

## 2. Phases

- [ ] **P1**: proto `PluginDataService`, SDK client, core gRPC server, mTLS dev/prod.
- [ ] **P2**: descriptor registry + query compiler + migration executor; publish/validate/migrate.
- [ ] **P3**: read path catalog + Redis cache namespace.
- [ ] **P4**: write path + `ExecuteBatch` + idempotency + outbox.
- [ ] **P5**: system scope identity/port riêng; xoá DB env khỏi plugin.
- [ ] **P6**: RabbitMQ event/command (khi cần).

## 3. Tiêu chí nghiệm thu

- Plugin container không còn `QUARKUS_DATASOURCE_*`, `DB_URL`, `DB_SCHEMA`.
- Plugin code không còn `DataSource`, `EntityManager`, Panache repository.
- 100% đọc/ghi catalog qua gRPC descriptor.
- Tenant isolation + system scope PASS.
- Migration core thực thi; plugin chỉ khai báo bundle + checksum.
- mTLS + service token PASS.
- Redis cache namespace/TTL/invalidation PASS.
- `PluginLifecycleApiTest`, catalog API/browser QA PASS.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task sau khi SOL-S05-002 được Approved | Chủ dự án |
