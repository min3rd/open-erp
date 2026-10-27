# [TASK-402] Plugin Data Gateway gRPC — plugin zero DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-402 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress** — P1/P2/P2.1 done, P3 next |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-401, SOL-S05-002 / QA TASK-398 |
| Write scope | `plugins/sdk/**`, `plugins/catalog/**`, `src/backend/src/main/java/**/plugin/**`, `docker-compose.yml`, `deployments/k8s/**` |

## 1. Mục tiêu

Chuyển toàn bộ đọc/ghi DB của catalog sang core gRPC data gateway; plugin không còn DB credential, datasource, repository DB, Flyway. Core chỉ validate descriptor/tenant/scope và thực thi SQL/migration.

## 2. Phases

- [x] **P1 (core)**: proto `PluginDataService`, core gRPC server `:9090`, service identity + token ngắn hạn (`PLUGIN_SERVICE`), Ping/Execute/ExecuteBatch; mTLS dev/prod **còn pending**.
- [x] **P2 (core)**: descriptor registry + query DSL compiler + tenant-scoped executor + migration bundle executor (checksum/history); test PostgreSQL thật PASS.
- [x] **P2.1**: khai báo 18 `queries` read-path cho catalog trong manifest + migration seed `plugin_versions.manifest` (V5.0.2); compiler hỗ trợ `TENANT_OR_SYSTEM`, `SYSTEM`, `EFFECTIVE_AT`, multi-field `search`.
- [ ] **P3**: SDK client + read path catalog + Redis cache namespace do plugin quản lý.
- [ ] **P4**: write path + `ExecuteBatch` + idempotency + outbox.
- [ ] **P5**: system scope identity/port riêng; xoá DB env khỏi plugin.
- [ ] **P6**: RabbitMQ event/command (khi cần).

## 3. Tiến độ

- **2026-10-27 — P1/P2 core**:
  - `plugin_data.proto`: `Ping`, `Execute`, `ExecuteBatch`, `Row`, `Value` params, `total_rows`.
  - `PluginServiceIdentityResolver` + `JwtTokenService.generatePluginServiceToken`: token type `PLUGIN_SERVICE`, audience `plugin-data`, scope `TENANT|SYSTEM`; mTLS metadata interceptor.
  - `PluginDescriptorRegistry`: đọc manifest đã publish, validate entity/field/relation/query.
  - `PluginQueryCompiler`: LIST/GET/INSERT/UPDATE/DELETE, filter/sort/page/join allowlist, tenant predicate tự sinh, identifier quote, parameter hóa.
  - `PluginDataExecutor`: `search_path` + `app.tenant_id` + `statement_timeout`, ledger ACTIVE check, row limit, LIST count, `ExecuteBatch` một transaction.
  - `PluginMigrationExecutor`: đọc zip bundle, checksum SHA-256, version order, `plugin_schema_history`; lifecycle install/upgrade gọi trước deploy (no-op khi manifest không khai báo migrations).
  - Test: `PluginDataGatewayTest` 9/9 PASS, `PluginMigrationExecutorTest` 2/2 PASS, `PluginLifecycleApiTest` 10/10 PASS; `mvn package` PASS.
  - Chưa làm: mTLS cert/config, SDK client, Redis.
- **2026-10-27 — P2.1 catalog descriptors**:
  - `plugins/catalog/plugin.json` (+ resource copy): thêm `queries` read path và public fields `attributes_schema`, `attributes`, `created_by`/`updated_by`.
  - 18 descriptors: types visible/system/by code/by id; items by type/id/ids/code/version group; system item queries; edges by child/children/parent/parents; grants by type/id/role.
  - `PluginQueryCompiler`: thêm `tenant_scope` (`TENANT`, `TENANT_OR_SYSTEM`, `SYSTEM`), filter `EFFECTIVE_AT` (`valid_from <= ? AND (valid_to IS NULL OR valid_to > ?)`), multi-field `search` (OR ILIKE).
  - Core migration `V5.0.2__catalog_query_descriptors.sql`: cập nhật `plugin_versions.entities` + `manifest.entities/queries` cho `catalog@1.0.0`.
  - Test: `CatalogQueryDescriptorManifestTest` PASS (18 queries load/validate); `PluginDataGatewayTest` 11/11 PASS.

## 4. Tiêu chí nghiệm thu

- Plugin container không còn `QUARKUS_DATASOURCE_*`, `DB_URL`, `DB_SCHEMA`.
- Plugin code không còn `DataSource`, `EntityManager`, Panache repository.
- 100% đọc/ghi catalog qua gRPC descriptor.
- Tenant isolation + system scope PASS.
- Migration core thực thi; plugin chỉ khai báo bundle + checksum.
- mTLS + service token PASS.
- Redis cache namespace/TTL/invalidation PASS.
- `PluginLifecycleApiTest`, catalog API/browser QA PASS.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task sau khi SOL-S05-002 được Approved | Chủ dự án |
| 0.2 | 2026-10-27 | P1/P2 core done: proto, identity/token, registry, compiler, executor, migration executor, test PASS | Developer Agent |
| 0.3 | 2026-10-27 | P2.1 done: 18 catalog query descriptors, V5.0.2 seed, tenant scope/effective/search compiler support | Developer Agent |
