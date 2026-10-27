# [SOL-S05-002] Plugin Data Gateway qua gRPC — plugin không truy cập DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S05-002 / Giải pháp kiến trúc / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Draft — chờ chủ dự án trả lời câu hỏi §10** / 0.1 / 2026-10-27 |
| Owner / reviewer | Solution Architect / Chủ dự án + PM + QA |
| Đầu vào | [ADR-S05-001](02_ADR-S05-001_catalog_independent_plugin.md), [ADR-S05-002](03_ADR-S05-002_thin_plugin_backend.md), [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md) |
| Đọc trước / đọc tiếp | ADR-S05-002 / DES-API-S05-001 (cập nhật), TASK-401, TASK-402 (dự kiến) |

## 1. Bối cảnh

Sprint 05 đã tách catalog thành plugin container riêng. Tuy nhiên backend plugin vẫn:

- có repository Panache;
- nhận `QUARKUS_DATASOURCE_*` từ core;
- mở kết nối PostgreSQL và chạy SQL trực tiếp.

Điều này vi phạm yêu cầu: **plugin không được can thiệp trực tiếp vào DB**, đặc biệt khi plugin có system scope. Nếu container plugin bị compromise, nó có thể đọc/ghi dữ liệu tenant hoặc system catalog.

Giải pháp này thay direct DB bằng **Plugin Data Gateway** nội bộ:

```text
Plugin business logic
  → gRPC PluginDataService
  → Core Data Gateway
  → PostgreSQL
```

Core **không ôm logic catalog**. Core chỉ:

- xác thực plugin/tenant/scope;
- kiểm tra query template;
- cấp connection và thực thi SQL;
- trả kết quả;
- audit.

Plugin giữ:

- business logic;
- query template/query descriptor;
- REST API cho frontend;
- event handling.

## 2. Mục tiêu và phạm vi

### 2.1. Mục tiêu

1. Plugin container **không có DB credential**, không có `DataSource`, `EntityManager`, repository DB.
2. Core là **chủ sở hữu duy nhất** connection PostgreSQL.
3. Plugin khai báo entity, relation, repository, query template, API, WebSocket trong manifest.
4. Core thực thi migration do plugin khai báo.
5. Tenant A không đọc/ghi được dữ liệu tenant B.
6. Tenant plugin không truy cập được system schema.
7. Core scale ngang độc lập; plugin chỉ là client gRPC.

### 2.2. Ngoài phạm vi

- Thay toàn bộ REST gateway FE → plugin (giữ nguyên).
- RabbitMQ/event bus trong phase 1 (xem §8).
- Query DSL low-code đầy đủ (phase 1 dùng SQL template có kiểm duyệt).
- Module Federation/UI host (đã có ở TASK-399).

## 3. Quyết định kiến trúc

| # | Quyết định | Lý do | Trạng thái |
| :--- | :--- | :--- | :--- |
| D1 | Plugin gọi core qua **gRPC nội bộ** (`PluginDataService`), không gọi REST per plugin | Contract chặt, typed, deadline, ít payload | Proposed |
| D2 | Core **không chứa logic catalog**; chỉ validate/execute template | Tránh core phình, giữ plugin sở hữu nghiệp vụ | Proposed |
| D3 | Plugin khai báo **query template có tên**; không gửi raw SQL mỗi request | Core kiểm tra một lần lúc publish; runtime chỉ `template_id + params` | Proposed |
| D4 | Core chạy migration do plugin khai báo; plugin không có Flyway/DDL runtime | Core kiểm soát schema, thứ tự, checksum, rollback | Proposed |
| D5 | Tenant/scope lấy từ **service token/mTLS**, không lấy từ payload | Plugin không thể giả tenant/system | Proposed |
| D6 | PostgreSQL RLS + `search_path` + AST/table allowlist | Phòng thủ nhiều lớp, kể cả template sai | Proposed |
| D7 | Một gRPC call = một transaction; thêm `ExecuteBatch` cho nhiều bước | Giữ atomicity mà không mở transaction xuyên RPC | Proposed |
| D8 | Read đi read-replica; write đi primary; cờ `consistency` | Scale đọc, tránh read-after-write sai | Proposed |
| D9 | RabbitMQ chỉ dùng cho event/command async, không dùng cho query/CRUD sync | Tránh request-response qua MQ | Proposed |
| D10 | System scope có service identity/port riêng; tenant plugin không truy cập | Cách ly system catalog tuyệt đối | Proposed |

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
│      ▼                                                           │
│  PluginDataClient (SDK)                                          │
│      │ gRPC + service token/mTLS                                 │
└──────┼───────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Core Data Gateway (gRPC :9090)                                   │
│                                                                  │
│  1. AuthN: mTLS/JWT service token                                │
│  2. AuthZ: plugin ACTIVE + tenant + scope + template ACL         │
│  3. TemplateRegistry: SQL, mode, entity, hash, version           │
│  4. SqlPolicy: AST allowlist, table allowlist, no DDL/DCL        │
│  5. TenantSession: SET LOCAL search_path + app.tenant_id + RLS   │
│  6. Execute: bind params, timeout, row limit                     │
│  7. Audit + metrics + trace                                      │
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
| `PluginServiceIdentity` | Verify mTLS/JWT; trả `pluginKey`, `tenantId`, `scope` |
| `PluginTemplateRegistry` | Load/validate/cache query template từ manifest |
| `PluginSqlPolicy` | Parse AST, chặn DDL/DCL/system schema/hàm nguy hiểm |
| `PluginTenantSession` | Set `search_path`, `app.tenant_id`, RLS, statement timeout |
| `PluginMigrationExecutor` | Chạy migration plugin khai báo trước khi start container |
| `PluginDataAudit` | Ghi audit: plugin, tenant, template, actor, rows, duration |
| `PluginDataMetrics` | Latency, error rate, rows, timeouts, rate limit |

### 4.2. Thành phần plugin

| Thành phần | Trách nhiệm |
| :--- | :--- |
| `plugin-data-client` (SDK) | gRPC stub, token, retry idempotent, error mapping |
| Business service | Logic catalog; gọi client theo template |
| REST resource | API cho FE; không truy cập DB |
| Query templates | Khai báo trong `plugin.json` |
| Migration files | Khai báo trong `plugin.json`/artifact, core thực thi |

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
  string template_id = 1;          // ví dụ catalog.items.page
  string request_id = 2;           // trace
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
}

message Row {
  map<string, Value> values = 1;
}

enum Consistency {
  DEFAULT = 0;
  PRIMARY = 1;
}
```

Ghi chú:

- `Value` dùng `google.protobuf.Value` hoặc `oneof` typed.
- Không có `tenant_id` trong request; core lấy từ token.
- `template_id` thuộc plugin/version đã publish.
- `ExecuteBatch` chỉ cho phép các template đã duyệt, cùng transaction.

### 5.2. Metadata xác thực

```text
authorization: Bearer <plugin-service-token>
x-request-id: <uuid>
```

Production bổ sung mTLS. Token chứa:

```json
{
  "iss": "openerp-core",
  "aud": "plugin-data",
  "plugin_key": "catalog",
  "tenant_id": "aafea2fa-...",
  "scope": "TENANT",
  "allowed_templates": ["catalog.items.page", "catalog.item.insert"],
  "exp": 1793099999
}
```

## 6. Query template

### 6.1. Khai báo trong `plugin.json`

```json
{
  "queries": [
    {
      "id": "catalog.items.page",
      "mode": "READ",
      "entity": "CatalogItem",
      "sql": "SELECT id, code, name, status FROM catalog_items WHERE type_id = :type_id AND (:q IS NULL OR name ILIKE :q) ORDER BY sort_order LIMIT :limit OFFSET :offset",
      "max_rows": 100,
      "timeout_ms": 3000
    },
    {
      "id": "catalog.item.insert",
      "mode": "WRITE",
      "entity": "CatalogItem",
      "sql": "INSERT INTO catalog_items (id, tenant_id, type_id, code, name) VALUES (gen_random_uuid(), current_setting('app.tenant_id')::uuid, :type_id, :code, :name) RETURNING id",
      "timeout_ms": 3000
    }
  ]
}
```

Quy ước:

- `mode`: `READ` hoặc `WRITE`.
- `entity`: phải có trong `entities`.
- `sql`: một statement, named parameters `:param`, không nội suy.
- Không tự truyền `tenant_id`; core set qua RLS/`app.tenant_id`.
- `max_rows`, `timeout_ms` do core enforce, không tin plugin.

### 6.2. Kiểm tra template

Lúc publish/install:

- parse SQL AST;
- chỉ cho `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WITH` (read/write tương ứng);
- chặn `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `COPY`, `CALL`, `DO`, `SET`, `RESET`, `GRANT`, `REVOKE`;
- chặn `pg_catalog`, `information_schema`, `public`, schema khác tenant;
- bảng phải thuộc `entities` của plugin;
- chặn function ngoài allowlist;
- một statement duy nhất;
- kiểm tra `tenant_id` có được bảo vệ bởi RLS (không bắt buộc viết tay);
- lưu hash + plugin version để audit.

Runtime không parse lại toàn bộ SQL; chỉ kiểm tra `template_id`, `mode`, token, params count/type, timeout.

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
- System scope dùng role/policy riêng.

### 7.2. System scope

- `scope=SYSTEM` chỉ cấp cho system plugin/core system runtime.
- Service identity riêng, port/endpoint riêng hoặc token audience riêng.
- Không cho tenant plugin gửi `scope=SYSTEM`; core từ chối theo token, không theo payload.
- Audit system command tách riêng.

### 7.3. Bảng core / plugin khác

- Phase 1: plugin chỉ đọc/ghi entity của chính plugin trong schema tenant.
- Quan hệ với core (ví dụ `tenant_id → core.Tenant`) khai báo trong manifest nhưng **không join SQL trực tiếp**.
- Nếu cần join core, core cung cấp **view/read model** đã kiểm soát; không cho plugin query `public` tùy ý.

## 8. Migration do core thực thi

### 8.1. Khai báo

```json
{
  "migrations": [
    {
      "version": "1.0.0",
      "description": "initial catalog schema",
      "checksum": "sha256:...",
      "sql": "CREATE TABLE ...;"
    }
  ]
}
```

Với plugin đóng gói dạng bundle, có thể dùng:

```json
{
  "migrations": [
    { "version": "1.0.0", "file": "db/plugin-migration/V1.0.0__initial_schema.sql", "checksum": "sha256:..." }
  ]
}
```

Core đọc từ artifact bundle; nếu chỉ có OCI image, SQL phải nằm trong manifest/artifact metadata (xem câu hỏi Q2).

### 8.2. Thực thi

1. Core validate version tăng dần, checksum.
2. Tạo bảng `plugin_schema_history` trong schema tenant.
3. Chạy migration trong transaction.
4. Ghi history.
5. Chỉ start plugin container khi migration thành công.
6. Migration fail → install/enable fail, không start container.

Plugin không còn:

- `quarkus-flyway`;
- `quarkus.flyway.*`;
- quyền DDL.

## 9. Giao tiếp và vận hành

### 9.1. Docker/K8s

Docker Compose:

```yaml
services:
  backend-dev:
    # gRPC :9090 nội bộ, HTTP :8080
  catalog-dev:
    environment:
      PLUGIN_DATA_GATEWAY_URL: http://backend-dev:9090
      PLUGIN_SERVICE_TOKEN: ...
```

K8s:

```text
openerp-core.openerp.svc.cluster.local:9090
```

- Không expose gRPC qua ingress.
- NetworkPolicy chỉ cho plugin pods gọi core gateway.
- mTLS ở staging/prod.

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
  "code": "PLUGIN_DATA_TEMPLATE_NOT_ALLOWED",
  "message": "Template is not registered for this plugin version",
  "params": {"template_id": "..."},
  "retryable": false
}
```

Plugin map sang API envelope 4 khuôn mẫu; không trả message tiếng Việt từ core.

### 9.4. Audit và observability

- OpenTelemetry trace xuyên plugin → core → DB.
- Metrics: latency, error, rows, timeout, pool wait.
- Audit: request_id, plugin, tenant, template, actor, mode, rows, duration.
- Log không chứa param nhạy cảm.

## 10. Câu hỏi cần chủ dự án trả lời

> Trả lời theo số thứ tự; nếu đồng ý với đề xuất thì ghi “OK”.

**Q1. Xác thực gRPC trong local/dev và production?**
Đề xuất: dev dùng service JWT ngắn hạn; staging/prod dùng **mTLS + JWT**. Bạn muốn dùng mTLS ngay từ dev hay chỉ production?

**Q2. Migration SQL nằm ở đâu?**
Đề xuất: plugin package/bundle có thư mục `migrations/` + manifest khai báo file + checksum; core đọc từ artifact bundle. Nếu plugin chỉ là OCI image, có chấp nhận nhúng SQL vào `plugin.json` không?

**Q3. Query template dùng SQL template hay DSL?**
Đề xuất: **SQL template có tên**, core validate AST lúc publish. Chấp nhận SQL template hay muốn DSL/query descriptor hoàn toàn?

**Q4. Transaction nhiều bước?**
Đề xuất: thêm `ExecuteBatch` để chạy nhiều template trong một transaction. Có cần không, hay mỗi RPC một statement là đủ?

**Q5. Read consistency?**
Đề xuất: READ mặc định đi read-replica; sau WRITE, plugin truyền `consistency=PRIMARY` cho lần đọc kế tiếp. Chấp nhận eventual consistency mặc định không?

**Q6. System scope dùng chung gRPC service hay tách riêng?**
Đề xuất: cùng server nhưng **service identity/port riêng** cho system; tenant plugin không thể truy cập. Bạn muốn tách hẳn service/port hay chỉ tách token?

**Q7. RabbitMQ làm ngay hay sau?**
Đề xuất: phase 1 chỉ gRPC data gateway; RabbitMQ cho event/command async ở phase sau. Có cần RabbitMQ ngay trong Sprint 05 không?

**Q8. Ai duyệt query template?**
Đề xuất: core tự validate AST + table allowlist, audit; không cần platform admin duyệt từng template. Có cần bước duyệt thủ công cho plugin bên thứ ba không?

**Q9. Quan hệ liên plugin/core?**
Đề xuất: phase 1 không cho SQL join trực tiếp sang core/plugin khác; chỉ dùng read model/view do core cung cấp. Bạn có cần join trực tiếp không?

**Q10. Plugin có còn giữ REST API cho FE không?**
Đề xuất: giữ nguyên REST API trong plugin; chỉ thay DB access bằng gRPC. Xác nhận?

**Q11. Có giữ container plugin hay chuyển core-hosted JAR?**
Đề xuất: giữ **thin container** để bảo toàn isolation; gRPC data gateway là đường duy nhất tới DB. Xác nhận?

**Q12. Có cần cache read model trong plugin không?**
Đề xuất: phase 1 không cache; plugin gọi core mỗi lần đọc. Nếu cần giảm latency, phase sau thêm Redis/cache do core cấp. Bạn muốn cache ngay không?

## 11. Lộ trình triển khai

| Phase | Nội dung | Tiêu chí xong |
| :--- | :--- | :--- |
| P0 | Chốt SOL/ADR, trả lời câu hỏi §10 | Doc Approved |
| P1 | Proto + SDK client + gRPC server skeleton + service token | Plugin gọi `ping` qua gRPC |
| P2 | Template registry + AST validator + migration executor | Publish/validate/migrate PASS |
| P3 | Read path catalog qua gRPC | Catalog reads không còn DB trong plugin |
| P4 | Write path + transaction + idempotency + outbox | CRUD qua gRPC; audit đầy đủ |
| P5 | System scope + remove DB env/credentials | Tenant plugin không truy cập system |
| P6 | RabbitMQ event/command (nếu chốt) | Event fan-out/DLQ PASS |

## 12. Tiêu chí nghiệm thu

- [ ] Plugin container không còn `QUARKUS_DATASOURCE_*`, `DB_URL`, `DB_SCHEMA`.
- [ ] Plugin code không còn `DataSource`, `EntityManager`, Panache repository.
- [ ] 100% đọc/ghi catalog đi qua gRPC template.
- [ ] Tenant A không đọc/ghi được dữ liệu tenant B.
- [ ] Tenant plugin không truy cập system schema.
- [ ] Migration do core chạy; plugin chỉ khai báo file/checksum.
- [ ] Query template sai bị từ chối lúc publish, không chờ runtime.
- [ ] gRPC timeout/error trả envelope chuẩn, không lộ SQL/DB.
- [ ] Audit đủ plugin/tenant/template/rows/duration.
- [ ] Core gateway scale ngang; DB pool không bị cạn.

## 13. Rủi ro và biện pháp

| Rủi ro | Biện pháp |
| :--- | :--- |
| SQL template chứa truy vấn nguy hiểm | AST + table/function allowlist; test bypass |
| Plugin giả tenant/scope | Token/mTLS; core derive từ identity |
| RLS bị bypass do role owner | Dùng role riêng không phải owner/superuser |
| Query nặng làm treo DB | timeout, row limit, rate limit, explain cost |
| Core gateway thành bottleneck | scale ngang, pool, read replica |
| Migration fail giữa chừng | transaction + history + rollback/restore |
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
| 0.1 | 2026-10-27 | Tạo giải pháp gRPC Plugin Data Gateway; plugin zero DB; câu hỏi §10 | Chủ dự án chỉ đạo |
