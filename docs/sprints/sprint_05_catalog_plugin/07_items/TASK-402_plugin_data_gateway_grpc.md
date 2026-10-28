# [TASK-402] Plugin Data Gateway gRPC — plugin zero DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-402 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress** — P1/P2/P2.1/P3/P3.1/P4 done; P4.1 + P5 next |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-401, SOL-S05-002 / QA TASK-398 |
| Write scope | `plugins/sdk/**`, `plugins/catalog/**`, `src/backend/src/main/java/**/plugin/**`, `docker-compose.yml`, `deployments/k8s/**` |

## 1. Mục tiêu

Chuyển toàn bộ đọc/ghi DB của catalog sang core gRPC data gateway; plugin không còn DB credential, datasource, repository DB, Flyway. Core chỉ validate descriptor/tenant/scope và thực thi SQL/migration.

## 2. Phases

- [x] **P1 (core)**: proto `PluginDataService`, core gRPC server `:9090`, service identity + token ngắn hạn (`PLUGIN_SERVICE`), Ping/Execute/ExecuteBatch; mTLS dev/prod **còn pending**.
- [x] **P2 (core)**: descriptor registry + query DSL compiler + tenant-scoped executor + migration bundle executor (checksum/history); test PostgreSQL thật PASS.
- [x] **P2.1**: khai báo 18 `queries` read-path cho catalog trong manifest + migration seed `plugin_versions.manifest` (V5.0.2); compiler hỗ trợ `TENANT_OR_SYSTEM`, `SYSTEM`, `EFFECTIVE_AT`, multi-field `search`.
- [x] **P3**: SDK client + read path catalog + Redis cache do plugin quản lý. Hot paths + `descendants`/export qua gateway.
- [x] **P3.1**: `TREE` recursive descendants + bulk export descriptors (items/edges/parent lookups) qua gateway.
- [x] **P4**: main write path (types, items, edges, grants, inline) qua gRPC; `ExecuteBatch` cho version update/grant replace; idempotency key + DB response replay.
- [ ] **P4.1**: import writes, system catalog sync, seeders chuyển khỏi DB (P5 khi xoá datasource).
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
- **2026-10-27 — P3 SDK + read path + Redis cache**:
  - `plugin-sdk`: thêm `PluginDataClient` (gRPC, deadline, service token/mTLS optional), `PluginQueryResult`; generated proto stubs từ `plugins/sdk/src/main/proto`.
  - Core DSL: `MERGED_LIST` (tenant/system merge, tenant thắng, post-filter), `exists` filter (parent/relation guard), `post_filters`; executor trả array/temporal ISO chuẩn.
  - Manifest: thêm `catalog.items.admin`, `catalog.items.merged.options`, `catalog.items.system.codes`, `catalog.edges.parents.with.children`; migration `V5.0.3__catalog_read_descriptors.sql` (22 descriptors); DSL thêm `distinct`.
  - Catalog: `CatalogGateway` map row → entity; `CatalogPermissionGuard`, type list/grants, item list/get/versions/parents, lookup types/options/resolve/path, edges/grant reads chuyển sang gateway.
  - Redis cache do **plugin** quản lý: `CatalogCache` namespace `plugin:catalog:{tenant}:g{generation}:{key}`, TTL 60s, fail-open; `CatalogCacheInvalidationFilter` tăng generation sau mọi write thành công.
  - Runtime: `PluginLifecycleService` inject `PLUGIN_DATA_GATEWAY_URL`, `QUARKUS_REDIS_HOSTS`, `PLUGIN_SERVICE_TOKEN` (7 ngày) vào container; compose dev set gateway/Redis; `%dev` cho phép metadata fallback (không dùng ở prod).
  - Kiểm chứng: API tenant types/lookup PROVINCE/COMMUNE options/items 200; cache hit 358ms → 59ms và 100ms → 52ms; system catalog types/items 200; write type invalidates cache; web + mobile catalog 0 console error, mobile overflow 0.
  - Còn: `descendants` recursive + export vẫn DB; write path P4; mTLS P5.
- **2026-10-28 — P3.1 + P4**:
  - P3.1: core `TREE` recursive operation (generic edge descriptor), bulk LIST (`bulk=true`, max 20k) cho export; catalog `descendants`, export items/edges/parent lookup qua gateway.
  - P4: write descriptors cho type/item/edge/grant + current-row duplicate lookups; plugin writes qua `PluginDataClient.write`/`executeBatch`.
  - `ExecuteBatch` dùng cho item version update (close + insert) và grant replace (delete + inserts), một transaction core.
  - Idempotency: `plugin_data_idempotency` (V5.1.0), request hash, response replay/conflict/in-progress; SDK tự sinh key cho write/batch.
  - Compiler value spec: optional/allow_null, `jsonb`, `varchar[]`, `text[]`, `LOWER_EQ`; executor bind array + row limit bulk.
  - Kiểm chứng: tạo/sửa type, tạo/sửa/đóng item, tạo edge + parents, inline, descendants, export CSV, read cache; V5.1.1 seed 49 descriptors.
  - Còn: import/system sync/seeders vẫn DB (P4.1/P5); outbox để P6; mTLS P5.

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
| 0.4 | 2026-10-27 | P3 done: SDK client, merged/exists DSL, read paths via gRPC, plugin-owned Redis cache + invalidation, compose/runtime env; web/mobile smoke PASS | Developer Agent |
| 0.5 | 2026-10-28 | P3.1 + P4 done: TREE/bulk export, write descriptors, ExecuteBatch, DB idempotency; type/item/edge/grant/inline writes via gateway, integration PASS | Developer Agent |
