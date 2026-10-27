# [SOL-S05-002] Plugin Data Gateway qua gRPC — plugin không truy cập DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S05-002 / Giải pháp kiến trúc / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Approved — chủ dự án chốt 2026-10-27** / 1.0 / 2026-10-27 |
| Owner / reviewer | Solution Architect / Chủ dự án + PM + QA |
| Đầu vào | [ADR-S05-001](02_ADR-S05-001_catalog_independent_plugin.md), [ADR-S05-002](03_ADR-S05-002_thin_plugin_backend.md), [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md) |
| Đọc trước / đọc tiếp | ADR-S05-002 / DES-API-S05-001 (cập nhật), TASK-402 (triển khai) |

## 1. Bối cảnh

Catalog plugin hiện vẫn có repository Panache, nhận `QUARKUS_DATASOURCE_*` từ core và mở kết nối PostgreSQL trực tiếp. Điều này vi phạm yêu cầu **plugin không được can thiệp trực tiếp vào DB**, đặc biệt khi plugin có system scope.

Giải pháp thay direct DB bằng **Plugin Data Gateway** nội bộ:

```text
Plugin business logic
  → gRPC PluginDataService
  → Core Data Gateway
  → PostgreSQL
```

Core **không ôm logic catalog**. Core chỉ:

- xác thực plugin/tenant/scope;
- kiểm tra query descriptor;
- cấp connection và thực thi SQL;
- trả kết quả;
- audit.

Plugin giữ business logic, query descriptor, REST API cho frontend, cache và event handling.

## 2. Mục tiêu và phạm vi

### 2.1. Mục tiêu

1. Plugin container **không có DB credential**, không có `DataSource`, `EntityManager`, repository DB.
2. Core là **chủ sở hữu duy nhất** connection PostgreSQL.
3. Plugin khai báo entity, relation, repository, query descriptor, API, WebSocket trong manifest.
4. Core thực thi migration do plugin khai báo.
5. Tenant A không đọc/ghi được dữ liệu tenant B.
6. Tenant plugin không truy cập được system schema.
7. Core scale ngang độc lập; plugin chỉ là client gRPC.
8. Plugin được cache read-only qua Redis để giảm tải core gateway.

### 2.2. Ngoài phạm vi

- Thay REST API FE → plugin (giữ nguyên).
- RabbitMQ/event bus trong phase 1 — để phase sau.
- Query DSL cho mọi loại truy vấn phức tạp ngay từ đầu; phase 1 hỗ trợ các operation chuẩn + mở rộng có kiểm duyệt.
- Module Federation/UI host (đã có ở TASK-399).

## 3. Quyết định kiến trúc

| # | Quyết định | Lý do | Trạng thái |
| :--- | :--- | :--- | :--- |
| D1 | Plugin gọi core qua **gRPC nội bộ** (`PluginDataService`) | Contract chặt, typed, deadline, ít payload | Approved |
| D2 | Core **không chứa logic catalog**; chỉ compile/validate/execute descriptor | Tránh core phình, giữ plugin sở hữu nghiệp vụ | Approved |
| D3 | Plugin khai báo **query descriptor/DSL có tên**; core compile sang SQL | Không gửi raw SQL; core kiểm tra cấu trúc, table/field allowlist | Approved |
| D4 | Core chạy migration do plugin khai báo; plugin không có Flyway/DDL runtime | Core kiểm soát schema, thứ tự, checksum | Approved |
| D5 | Tenant/scope lấy từ **mTLS identity + service token**, không lấy từ payload | Plugin không thể giả tenant/system | Approved |
| D6 | PostgreSQL RLS + `search_path` + query compiler allowlist | Phòng thủ nhiều lớp | Approved |
| D7 | Một gRPC call = một transaction; thêm `ExecuteBatch` | Giữ atomicity mà không mở transaction xuyên RPC | Approved |
| D8 | READ đi read-replica; WRITE đi primary; cờ `consistency` | Scale đọc, tránh read-after-write sai | Approved |
| D9 | RabbitMQ chỉ dùng cho event/command async, để phase sau | Tránh request-response qua MQ | Approved |
| D10 | System scope dùng **cùng gRPC server, service identity/port riêng** | Cách ly system catalog, không tách quá nhiều hạ tầng | Approved |
| D11 | **mTLS bắt buộc cả dev/prod**; service token ngắn hạn mang scope/template ACL | Bảo vệ transport + claims | Approved |
| D12 | Plugin cache read-only qua **Redis namespace riêng**, TTL ngắn | Giảm latency; không cache write/system | Approved |
| D13 | Giữ **thin container plugin**; không chuyển core-hosted JAR | Bảo toàn isolation | Approved |
| D14 | Cho phép **join trực tiếp có allowlist** qua query descriptor | Đáp ứng nghiệp vụ; core compiler giới hạn bảng/relation | Approved |

## 4. Kiến trúc thành phần

```text
┌──────────────────────────────────────────────────────────────────┐
│ Plugin Container                                                 │
│                                                                  │
│  REST API (FE gọi)                                               │
│      │                                                           │
│      ▼                                                           │
│  Business Service                                                │
│      │                                                           │
│      ├── Redis cache (read-only, namespace riêng)                │
│      │                                                           │
│      ▼                                                           │
│  PluginDataClient (SDK)                                          │
│      │ gRPC + mTLS + service token                               │
└──────┼───────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Core Data Gateway (gRPC :9090)                                   │
│                                                                  │
│  1. AuthN: mTLS + service token                                  │
│  2. AuthZ: plugin ACTIVE + tenant + scope + descriptor ACL       │
│  3. DescriptorRegistry: operation/entity/fields/joins            │
│  4. QueryCompiler: DSL → SQL parameterized                       │
│  5. SqlPolicy: allowlist table/field/join/function               │
│  6. TenantSession: SET LOCAL search_path + app.tenant_id + RLS   │
│  7. Execute: bind params, timeout, row limit                     │
│  8. Audit + metrics + trace                                      │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ├── read-replica (READ)
       └── primary (WRITE)
              │
              ▼
        PostgreSQL
        tenant_<short>_catalog
```

### 4.1. Thành phần core

| Thành phần | Trách nhiệm |
| :--- | :--- |
| `PluginDataGrpcService` | Nhận `Execute`, `ExecuteBatch`; map lỗi gRPC |
| `PluginServiceIdentity` | Verify mTLS + token; trả `pluginKey`, `tenantId`, `scope` |
| `PluginDescriptorRegistry` | Load/validate/cache query descriptor từ manifest |
| `PluginQueryCompiler` | Compile DSL → SQL parameterized; không nhận SQL thô |
| `PluginSqlPolicy` | Allowlist entity/field/join/function; chặn system schema |
| `PluginTenantSession` | Set `search_path`, `app.tenant_id`, RLS, statement timeout |
| `PluginMigrationExecutor` | Chạy migration plugin khai báo trước khi start container |
| `PluginDataAudit` | Ghi audit: plugin, tenant, descriptor, actor, rows, duration |
| `PluginDataMetrics` | Latency, error rate, rows, timeouts, rate limit |

### 4.2. Thành phần plugin

| Thành phần | Trách nhiệm |
| :--- | :--- |
| `plugin-data-client` (SDK) | gRPC stub, mTLS, token, retry idempotent, error mapping |
| Business service | Logic catalog; gọi client theo descriptor |
| REST resource | API cho FE; không truy cập DB |
| Redis cache client | Cache read-only, namespace `plugin:{tenant}:{plugin}` |
| Query descriptors | Khai báo trong `plugin.json` |
| Migration files | Khai báo trong bundle + checksum; core thực thi |

## 5. gRPC contract

### 5.1. Proto

```proto
syntax = "proto3";
package openerp.plugin.data.v1;

service PluginDataService {
  rpc Execute(ExecuteRequest) returns (ExecuteResponse);
  rpc ExecuteBatch(ExecuteBatchRequest) returns (ExecuteBatchResponse);
}

message ExecuteRequest {
  string query_id = 1;             // descriptor id, ví dụ catalog.items.page
  string request_id = 2;
  string idempotency_key = 3;      // bắt buộc với WRITE
  Consistency consistency = 4;     // DEFAULT | PRIMARY
  map<string, Value> params = 5;
}

message ExecuteBatchRequest {
  repeated ExecuteRequest statements = 1; // cùng transaction
}

message ExecuteResponse {
  bool success = 1;
  string code = 2;
  repeated Row rows = 3;
  int64 affected_rows = 4;
  string request_id = 5;
  int64 schema_version = 6;
}

message Row {
  map<string, Value> values = 1;
}

enum Consistency {
  DEFAULT = 0;
  PRIMARY = 1;
}
```

- Không có `tenant_id` trong request; core lấy từ mTLS/token.
- `query_id` thuộc plugin/version đã publish.
- `ExecuteBatch` chỉ cho phép descriptor đã duyệt, cùng transaction.

### 5.2. mTLS và service token

- mTLS bắt buộc ở **dev, staging, production**.
- Client cert chứa identity `plugin:<pluginKey>:<tenantId>` (hoặc SAN/SPIFFE).
- Service token ngắn hạn mang `scope`, `allowed_queries`, `exp`.
- Core map cert + token với `tenant_plugins`; không tin payload.

```text
authorization: Bearer <plugin-service-token>
x-request-id: <uuid>
```

Dev cần script sinh CA/cert và mount vào container core/plugin; K8s dùng cert-manager/Secret.

## 6. Query descriptor (DSL)

### 6.1. Khai báo

```json
{
  "queries": [
    {
      "id": "catalog.items.page",
      "mode": "READ",
      "operation": "LIST",
      "entity": "CatalogItem",
      "select": ["id", "code", "name", "status"],
      "filters": [
        { "field": "type_id", "op": "EQ", "param": "type_id" },
        { "field": "name", "op": "ILIKE", "param": "q" },
        { "field": "status", "op": "IN", "param": "statuses" }
      ],
      "sort": [{ "field": "sort_order", "direction": "ASC" }],
      "page": { "pageParam": "page", "sizeParam": "size", "maxSize": 100 },
      "maxRows": 100
    },
    {
      "id": "catalog.item.insert",
      "mode": "WRITE",
      "operation": "INSERT",
      "entity": "CatalogItem",
      "values": {
        "type_id": { "param": "type_id" },
        "code": { "param": "code" },
        "name": { "param": "name" }
      },
      "returning": ["id", "code", "version"]
    },
    {
      "id": "catalog.tree",
      "mode": "READ",
      "operation": "TREE",
      "entity": "CatalogItem",
      "rootParam": "root_id",
      "maxDepth": 20
    },
    {
      "id": "catalog.lookup",
      "mode": "READ",
      "operation": "LOOKUP",
      "entity": "CatalogItem",
      "codeParam": "code",
      "includeSystem": true
    }
  ]
}
```

### 6.2. Operation phase 1

| Operation | Mục đích |
| :--- | :--- |
| `LIST` | filter/sort/page |
| `GET` | theo id |
| `INSERT` | tạo mới + returning |
| `UPDATE` | theo id + optimistic version |
| `DELETE` | soft/hard theo descriptor |
| `TREE` | recursive CTE cho cây |
| `GRAPH` | cha/con, kiểm tra chu trình |
| `LOOKUP` | options/resolve cho form động |
| `AGGREGATE` | count/sum/group an toàn |
| `BATCH` | nhiều operation trong transaction |

Operation đặc thù catalog (DAG, version, effective) được core compiler hỗ trợ như **operation generic**, không phải logic catalog hardcode.

### 6.3. Join allowlist

- `joins` chỉ được dùng relation đã khai báo trong `entities[].relations`.
- Chỉ join trong cùng tenant schema; cross-plugin join chỉ khi:
  - plugin đích ACTIVE,
  - relation được khai báo hai phía,
  - join là read-only,
  - core compiler kiểm tra allowlist.
- Không cho join `public`, system schema, `pg_catalog`.

Ví dụ:

```json
{
  "id": "catalog.items.with.type",
  "operation": "LIST",
  "entity": "CatalogItem",
  "joins": [
    { "relation": "type", "select": ["code", "name_key"] }
  ]
}
```

### 6.4. Validate descriptor

Lúc publish/install:

- operation/entity/field/relation phải tồn tại trong manifest;
- filter op chỉ trong allowlist (`EQ`, `IN`, `ILIKE`, `BETWEEN`, `IS_NULL`...);
- sort field thuộc entity/join;
- page size ≤ max;
- join relation được khai báo;
- write descriptor có `idempotency`;
- lưu hash + plugin version.

Runtime không nhận SQL thô; chỉ `query_id + params`.

## 7. Tenant, scope và system DB

### 7.1. Tenant schema

Core mở connection với role `core_plugin_data` (không phải superuser), sau đó:

```sql
SET LOCAL search_path = tenant_<short>_catalog, public;
SET LOCAL app.tenant_id = '<uuid>';
```

Bảng plugin bật RLS:

```sql
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog_items
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

- Tenant plugin chỉ thấy row của tenant.
- System rows (`tenant_id IS NULL`) không thấy trong tenant scope.

### 7.2. System scope

- `scope=SYSTEM` chỉ cấp cho system plugin/core system runtime.
- Cùng gRPC server nhưng **service identity/port riêng**; tenant plugin không thể truy cập.
- Audit system command tách riêng.

### 7.3. Cache Redis

- Namespace: `plugin:{tenantId}:{pluginKey}:...`.
- Chỉ cache kết quả `READ`, TTL ngắn (30–60 giây), key gồm query id + params hash + schema version.
- Không cache dữ liệu system hoặc kết quả write.
- Sau write, plugin xoá cache liên quan; khi có RabbitMQ sẽ invalidate qua event.
- Redis credential do core cấp, ACL giới hạn namespace.

## 8. Migration do core thực thi

### 8.1. Khai báo

Plugin bundle có:

```text
migrations/
  V1.0.0__initial_schema.sql
manifest:
  migrations:
    - version: 1.0.0
      file: migrations/V1.0.0__initial_schema.sql
      checksum: sha256:...
```

Core đọc từ artifact bundle. Nếu chỉ có OCI image, SQL phải nằm trong artifact metadata/manifest.

### 8.2. Thực thi

1. Core validate version tăng dần, checksum.
2. Tạo bảng `plugin_schema_history` trong schema tenant.
3. Chạy migration trong transaction.
4. Ghi history.
5. Chỉ start plugin container khi migration thành công.
6. Migration fail → install/enable fail, không start container.

Plugin không còn `quarkus-flyway`, `quarkus.flyway.*`, quyền DDL.

## 9. Giao tiếp và vận hành

### 9.1. Docker/K8s

Docker Compose:

```yaml
services:
  backend-dev:
    # gRPC :9090 nội bộ, HTTP :8080
  catalog-dev:
    environment:
      PLUGIN_DATA_GATEWAY_URL: https://backend-dev:9090
      PLUGIN_SERVICE_TOKEN: ...
    volumes:
      - ./docker/certs/plugin-catalog:/certs:ro
```

K8s:

```text
openerp-core.openerp.svc.cluster.local:9090
```

- Không expose gRPC qua ingress.
- NetworkPolicy chỉ cho plugin pods gọi core gateway.
- mTLS cert do cert-manager/Secret cấp.

### 9.2. Timeout, retry, rate limit

- Deadline gRPC bắt buộc.
- READ retry idempotent tối đa 2 lần.
- WRITE chỉ retry khi có `idempotency_key`.
- Giới hạn theo plugin/tenant: QPS, concurrency, max rows, max payload.
- Circuit breaker khi core gateway lỗi.

### 9.3. Lỗi

gRPC status + `ErrorDetail`:

```json
{
  "code": "PLUGIN_DATA_QUERY_NOT_ALLOWED",
  "message": "Query descriptor is not registered for this plugin version",
  "params": {"query_id": "..."},
  "retryable": false
}
```

Plugin map sang API envelope 4 khuôn mẫu; không trả message tiếng Việt từ core.

### 9.4. Audit và observability

- OpenTelemetry trace xuyên plugin → core → DB.
- Metrics: latency, error, rows, timeout, pool wait, cache hit.
- Audit: request_id, plugin, tenant, query_id, actor, mode, rows, duration.
- Log không chứa param nhạy cảm.

## 10. Quyết định đã chốt

| # | Câu hỏi | Quyết định |
| :--- | :--- | :--- |
| Q1 | Xác thực gRPC | **mTLS cả dev/prod**; service token ngắn hạn cho scope/ACL |
| Q2 | Migration SQL | **Bundle + checksum**, core đọc artifact |
| Q3 | Query format | **Query DSL/descriptor**, core compile SQL |
| Q4 | Transaction | **Có `ExecuteBatch`** |
| Q5 | Read consistency | **Replica mặc định + `PRIMARY` flag** |
| Q6 | System scope | **Cùng server, identity/port riêng** |
| Q7 | RabbitMQ | **Để phase sau** |
| Q8 | Duyệt descriptor | **Core auto-validate + audit** |
| Q9 | Join core/plugin khác | **Join trực tiếp có allowlist** |
| Q10 | REST API plugin | **Giữ REST trong plugin** |
| Q11 | Runtime model | **Giữ thin container** |
| Q12 | Cache | **Redis ngay**, namespace riêng, TTL ngắn |

## 11. Lộ trình triển khai

| Phase | Nội dung | Tiêu chí xong |
| :--- | :--- | :--- |
| P0 | ADR/SOL approve, tạo TASK-402 | Doc Approved |
| P1 | Proto + SDK client + gRPC server skeleton + mTLS | Plugin gọi `ping` qua mTLS |
| P2 | Descriptor registry + query compiler + migration executor | Publish/validate/migrate PASS |
| P3 | Read path catalog qua gRPC + Redis cache | Catalog reads không còn DB trong plugin |
| P4 | Write path + `ExecuteBatch` + idempotency + outbox | CRUD qua gRPC; audit đầy đủ |
| P5 | System scope + remove DB env/credentials | Tenant plugin không truy cập system |
| P6 | RabbitMQ event/command (nếu cần) | Event fan-out/DLQ PASS |

## 12. Tiêu chí nghiệm thu

- [ ] Plugin container không còn `QUARKUS_DATASOURCE_*`, `DB_URL`, `DB_SCHEMA`.
- [ ] Plugin code không còn `DataSource`, `EntityManager`, Panache repository.
- [ ] 100% đọc/ghi catalog đi qua gRPC descriptor.
- [ ] Tenant A không đọc/ghi được dữ liệu tenant B.
- [ ] Tenant plugin không truy cập system schema.
- [ ] Migration do core chạy; plugin chỉ khai báo file/checksum.
- [ ] Descriptor sai bị từ chối lúc publish, không chờ runtime.
- [ ] mTLS hoạt động ở dev/staging/prod.
- [ ] gRPC timeout/error trả envelope chuẩn, không lộ SQL/DB.
- [ ] Audit đủ plugin/tenant/query/rows/duration.
- [ ] Core gateway scale ngang; DB pool không bị cạn.
- [ ] Redis cache có namespace riêng, TTL, invalidation sau write.

## 13. Rủi ro và biện pháp

| Rủi ro | Biện pháp |
| :--- | :--- |
| Query descriptor bị lạm dụng | Compiler allowlist; test bypass |
| Plugin giả tenant/scope | mTLS + token; core derive từ identity |
| RLS bị bypass do role owner | Role riêng không phải owner/superuser |
| Query nặng làm treo DB | timeout, row limit, rate limit, explain cost |
| Core gateway thành bottleneck | scale ngang, pool, read replica |
| Migration fail giữa chừng | transaction + history + rollback/restore |
| Cache stale | TTL ngắn + xoá sau write; event invalidation phase sau |
| Plugin vẫn giữ code DB cũ | xoá repository/entity manager; CI grep cấm |

## 14. Tài liệu tham chiếu

- [ADR-S05-002](03_ADR-S05-002_thin_plugin_backend.md)
- [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md)
- [TASK-401](../07_items/TASK-401_shared_runtime_and_plugin_styles.md)
- [DES-API-S05-001](../06_designs/api/01_DES-API-S05-001_catalog_api.md)
- [DES-DB-S05-001](../06_designs/db/01_DES-DB-S05-001_catalog_schema.md)

## 15. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Draft giải pháp gRPC data gateway; 12 câu hỏi | Chủ dự án chỉ đạo |
| 1.0 | 2026-10-27 | Chốt Q1–Q12: mTLS dev/prod, bundle migration, query DSL, ExecuteBatch, replica+primary, system identity riêng, RabbitMQ sau, auto-validate, join allowlist, REST plugin, thin container, Redis cache | Chủ dự án trả lời interact |
