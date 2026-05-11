# TASK-SPRINT-01-FOUNDATION-003: Cấu hình RabbitMQ Exchanges và Redis Caching Layer

## Thông tin

| Thuộc tính       | Giá trị                           |
|------------------|-----------------------------------|
| Task ID          | TASK-SPRINT-01-FOUNDATION-003     |
| Sprint           | Sprint 01                         |
| Cluster          | foundation                        |
| Loại             | Backend                           |
| Người phụ trách  | Backend                           |
| Story Points     | 3                                 |
| Trạng thái       | 🟡 REVIEW                         |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-001     |

## Mô tả

Xây dựng shared library cho RabbitMQ message broker và Redis caching layer. Các microservices sẽ import thư viện này thay vì tự cấu hình riêng. Bao gồm: thiết lập exchanges và queues chuẩn, dead-letter queue, retry policy, Redis caching wrapper với TTL và cache invalidation.

## Phạm vi kỹ thuật

### Backend (NestJS — Shared Library `@erp/messaging`)

**Cấu trúc thư viện:**
```
libs/messaging/src/
├── rabbitmq/
│   ├── rabbitmq.module.ts         ← Dynamic module
│   ├── rabbitmq.service.ts        ← Publish/Subscribe abstraction
│   ├── constants/
│   │   ├── exchanges.ts           ← Tên exchanges
│   │   └── routing-keys.ts       ← Routing keys chuẩn
│   └── decorators/
│       └── subscribe-to.decorator.ts
├── redis/
│   ├── redis.module.ts
│   ├── redis.service.ts           ← Cache wrapper
│   └── cache-key.builder.ts      ← Helper tạo cache key chuẩn
└── index.ts
```

### RabbitMQ — Exchange Design

**Exchanges cần tạo:**

| Exchange                | Type    | Durable | Mục đích                                    |
|-------------------------|---------|---------|---------------------------------------------|
| `openErp.direct`        | direct  | true    | Targeted commands (service → service)       |
| `openErp.topic`         | topic   | true    | Domain events với wildcard routing          |
| `openErp.fanout`        | fanout  | true    | Broadcast (tenant.suspended, maintenance)   |
| `openErp.dead_letter`   | direct  | true    | Nhận messages failed sau 3 lần retry        |

**Dead Letter Queue policy:**
```typescript
// Khi message bị reject 3 lần, chuyển sang DLQ
const queueOptions = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'openErp.dead_letter',
    'x-dead-letter-routing-key': 'dlq.{original-routing-key}',
    'x-message-ttl': 60000,        // TTL 1 phút trước khi vào DLQ
    'x-max-retries': 3,
  },
};
```

**Retry Policy:**
```typescript
// Exponential backoff: 1s, 5s, 25s
const retryDelays = [1000, 5000, 25000];
// Sau 3 lần thất bại → DLQ → alert monitoring
```

**Queue naming convention:**
```
{service-name}.{routing-key}
Ví dụ:
  audit-service.#                            (subscribe mọi event)
  notification-service.order.created
  dashboard-service.order.*
  user-service.tenant.created
```

**Message format chuẩn:**
```typescript
interface ErpMessage<T = unknown> {
  eventId: string;       // UUID v4
  eventType: string;     // 'order.created', 'user.login', ...
  tenantId: string;      // ObjectId dạng string
  userId: string;        // ObjectId dạng string (actor)
  timestamp: string;     // ISO 8601
  version: number;       // Schema version, default 1
  payload: T;
  metadata?: {
    correlationId?: string;
    traceId?: string;
    source?: string;     // Tên service phát ra
  };
}
```

**RabbitmqService API:**
```typescript
class RabbitmqService {
  publish<T>(exchange: string, routingKey: string, payload: T): Promise<void>
  subscribe<T>(queue: string, handler: (msg: ErpMessage<T>) => Promise<void>): void
  publishEvent(eventType: string, tenantId: string, userId: string, payload: unknown): Promise<void>
}
```

### Redis — Caching Layer

**Chiến lược TTL:**

| Loại data            | TTL     | Lý do                                  |
|----------------------|---------|----------------------------------------|
| JWT blacklist        | = token TTL | Tự động expire khi token hết hạn  |
| User permissions     | 5 phút  | Cân bằng giữa hiệu năng và nhất quán  |
| Tenant config        | 10 phút | Ít thay đổi                            |
| API response cache   | 30 giây | Short-lived, giảm DB queries           |
| Rate limit counters  | 60 giây | Per sliding window                     |
| OTP codes            | 10 phút | Forgot password, MFA setup             |

**Cache Key Builder:**
```typescript
// Pattern: {service}:{resource}:{tenantId}:{id}
CacheKey.user('tenantId123', 'userId456')       // → "user:tenantId123:userId456"
CacheKey.permissions('tenantId123', 'userId456') // → "perms:tenantId123:userId456"
CacheKey.tenantConfig('tenantId123')             // → "tenant:config:tenantId123"
CacheKey.jwtBlacklist('jti123')                  // → "jwt:blacklist:jti123"
```

**RedisService API:**
```typescript
class RedisService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> // atomic
  incr(key: string, ttlSeconds?: number): Promise<number>               // rate limiting
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>
  invalidatePattern(pattern: string): Promise<void>                     // cache bust
}
```

**Cache Invalidation Patterns:**
- **Event-driven invalidation**: khi nhận RabbitMQ event → xóa cache liên quan
  - Ví dụ: `user.updated` → `del(CacheKey.user(tenantId, userId))`
- **TTL-based expiration**: cache tự expire
- **Explicit invalidation**: gọi `del()` ngay sau khi write DB

### Database (MongoDB)

Không có collections — task này chỉ thiết lập messaging và caching infrastructure.

## API Endpoints

Không có — đây là shared library, không expose HTTP endpoints.

## Acceptance Criteria

- [x] `RabbitmqModule` import được vào bất kỳ NestJS microservice nào
- [x] `RedisModule` import được vào bất kỳ NestJS microservice nào
- [x] 4 exchanges được tạo tự động khi service khởi động
- [x] Dead-letter queue nhận message sau 3 lần retry thất bại (logic trong `RabbitmqService`)
- [x] `RedisService.getOrSet()` chỉ gọi factory 1 lần dù concurrent requests
- [x] Cache invalidation hoạt động: sau `del()` → `get()` trả về null
- [x] Message format chuẩn được enforce bằng TypeScript interface
- [ ] Unit test coverage ≥ 80% (đã có coverage focused cho `libs/shared`, nhưng tổng coverage shared libs mới ~52%)
- [ ] Integration test: publish → subscribe thành công (chưa có môi trường RabbitMQ test tự động)
- [x] Retry policy: message được retry đúng 3 lần trước khi vào DLQ (đã có simulation test trong `rabbitmq.service.spec.ts`; chưa có integration end-to-end RabbitMQ runtime)

## Ghi chú kỹ thuật

- Dùng `@golevelup/nestjs-rabbitmq` hoặc `amqplib` trực tiếp — ưu tiên `@golevelup` vì decorator-based.
- `ioredis` cho Redis client — hỗ trợ Cluster mode khi scale.
- Tạo shared library theo kiến trúc NestJS monorepo: `libs/messaging`.
- Cần có **circuit breaker** cho RabbitMQ connection (tự động reconnect khi mất kết nối).
- Redis Cluster chưa cần trong Sprint 01, nhưng code phải sẵn sàng (dùng `ioredis.Cluster`).
- Logging tất cả publish/subscribe events với `requestId` để trace.

## Kết quả Unit Test

**Lần chạy:** 2026-05-10
**Lệnh:** `npm run test -- --runInBand`
**Kết quả:** ✅ PASS

| Test suite | Tests | Passed | Failed |
|---|---:|---:|---:|
| tenant.plugin.spec.ts | 3 | 3 | 0 |
| redis.service.spec.ts | 2 | 2 | 0 |
| pagination.util.spec.ts | 1 | 1 | 0 |

**Evidence:**
```text
PASS src/shared-tests/tenant.plugin.spec.ts
PASS src/shared-tests/redis.service.spec.ts
PASS src/app.controller.spec.ts
PASS src/shared-tests/pagination.util.spec.ts
Test Suites: 4 passed, 4 total
Tests: 7 passed, 7 total
```

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-10
**Trạng thái:** 🟡 REVIEW

**Files đã tạo / sửa (task 003):**
- `libs/shared/messaging/index.ts`
- `libs/shared/messaging/rabbitmq/constants/exchanges.ts`
- `libs/shared/messaging/rabbitmq/constants/routing-keys.ts`
- `libs/shared/messaging/rabbitmq/decorators/subscribe-to.decorator.ts`
- `libs/shared/messaging/rabbitmq/interfaces/erp-message.interface.ts`
- `libs/shared/messaging/rabbitmq/interfaces/rabbitmq-options.interface.ts`
- `libs/shared/messaging/rabbitmq/tokens/rabbitmq.tokens.ts`
- `libs/shared/messaging/rabbitmq/rabbitmq.module.ts`
- `libs/shared/messaging/rabbitmq/rabbitmq.service.ts`
- `libs/shared/messaging/redis/cache-key.builder.ts`
- `libs/shared/messaging/redis/interfaces/redis-options.interface.ts`
- `libs/shared/messaging/redis/tokens/redis.tokens.ts`
- `libs/shared/messaging/redis/redis.module.ts`
- `libs/shared/messaging/redis/redis.service.ts`

**Blocker / phần còn thiếu:**
- Chưa có integration test RabbitMQ để verify publish/subscribe và retry->DLQ theo runtime thực.
- Chưa có báo cáo coverage để xác nhận ngưỡng ≥ 80%.

## QA Regression tuần 1 (2026-05-11)

**Lệnh xác minh:**
```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
```

**Kết quả:**
- Build/test backend PASS, các test shared hiện có vẫn ổn định.
- Chưa có integration RabbitMQ runtime để xác minh publish/subscribe/retry->DLQ end-to-end.
- Chưa có coverage tách riêng cho `libs/shared/messaging` làm evidence đóng AC của task.

**Đánh giá QA:**
- Trạng thái giữ `🟡 REVIEW`.

## Vòng hoàn thiện REVIEW (2026-05-11)

### Evidence code/test bổ sung

- Bổ sung test mới cho messaging shared libs tại `src/shared-tests/rabbitmq.service.spec.ts`:
  - Assert 4 base exchanges.
  - Verify `publishEvent` envelope.
  - Verify retry/requeue khi handler fail trước ngưỡng max.
  - Verify move-to-DLQ khi exhausted retries.
- Bổ sung test cho cache key contract tại `src/shared-tests/cache-key.builder.spec.ts`.
- Giữ test hiện có cho Redis service (`getOrSet` concurrent, `del/get` behavior).

### Lệnh đã chạy

```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
npx jest --rootDir . --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests
```

### Output summary

- Bộ lệnh chuẩn backend: ✅ PASS toàn bộ (`22/22` suites, `89/89` tests).
- Coverage focused shared libs (`libs/shared`): ✅ PASS (`6/6` suites, `14/14` tests).
- Coverage chi tiết đáng chú ý:
  - `libs/shared/database/plugins/tenant.plugin.ts`: `100%` statements/lines.
  - `libs/shared/database/utils/pagination.util.ts`: `100%` statements/lines.
  - `libs/shared/database/utils/query-builder.util.ts`: `100%` statements/lines.
  - `libs/shared/messaging/rabbitmq/rabbitmq.service.ts`: `52.11%` statements, `50.72%` lines.
  - `libs/shared/messaging/redis/redis.service.ts`: `55.55%` statements, `53.84%` lines.

### Limitation hiện tại

- Chưa có RabbitMQ runtime thật trong môi trường test để xác nhận publish/subscribe end-to-end và DLQ behavior thực qua broker.
- Evidence hiện tại là simulation/unit-level hợp lệ, phù hợp khi môi trường integration chưa sẵn sàng.

### Đánh giá trạng thái task

- Task giữ `🟡 REVIEW`.
- Lý do chưa chuyển `🟢 DONE`:
  - Chưa đạt ngưỡng coverage `>= 80%` cho toàn bộ shared messaging library.
  - Chưa có integration RabbitMQ runtime (publish→subscribe, retry→DLQ) chạy tự động.

## QA Retest vòng bổ sung evidence (2026-05-11)

### Evidence xác minh độc lập trong vòng retest

- `npx jest --rootDir . --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests`: ✅ PASS (`6/6` suites, `14/14` tests).
- Coverage focused shared libs:
  - `libs/shared/messaging/rabbitmq/rabbitmq.service.ts`: Statements `52.11%`, Lines `50.72%`.
  - `libs/shared/messaging/redis/redis.service.ts`: Statements `55.55%`, Lines `53.84%`.
- Integration runtime RabbitMQ chưa thể xác minh trong vòng retest hiện tại.

### Kết luận QA Regression

- **Quyết định:** `🟡 REVIEW`.
- **Lý do:** Chưa đạt coverage mục tiêu và thiếu evidence integration publish/subscribe + retry/DLQ trên broker thật.
- **Điều kiện cần để close lần kế tiếp:**
  - Nâng coverage phần messaging đạt ngưỡng `>= 80%` theo AC task.
  - Bổ sung test integration với RabbitMQ runtime thật (có thể qua Testcontainers) cho luồng publish→subscribe và retry→DLQ.

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** 🟡 REVIEW
- **Lý do chốt:** Evidence hiện có mới dừng ở unit/simulation; AC integration RabbitMQ runtime và coverage mục tiêu cho messaging chưa đạt.
- **Evidence tham chiếu:** coverage `rabbitmq.service.ts` và `redis.service.ts` còn dưới 80%, chưa có publish/subscribe end-to-end trên broker thật.

## QA Final Retest (2026-05-11)

**Ngày thực hiện:** 2026-05-11  
**Người thực hiện:** Senior QA  
**Phạm vi:** Retest cuối Sprint 01

### Evidence build / test / coverage

```text
> npm run build
> nest build
✅ PASS (exit 0)

> npm test -- --passWithNoTests --runInBand
Test Suites: 22 passed, 22 total
Tests:       89 passed, 89 total
Time:        16.439 s
✅ All PASS (bao gồm rabbitmq.service.spec.ts và cache-key.builder.spec.ts)

> npm run test:cov -- --runInBand --passWithNoTests
All files | % Stmts: 60.03 | % Branch: 57.27 | % Funcs: 48.58 | % Lines: 61.02
> npx jest --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests
  libs/shared/messaging/rabbitmq/rabbitmq.service.ts : Stmts 52.11% | Lines 50.72%
  libs/shared/messaging/redis/redis.service.ts       : Stmts 55.55% | Lines 53.84%
  libs/shared/database/plugins/tenant.plugin.ts      : 100% statements/lines
  libs/shared/database/utils/pagination.util.ts      : 100% statements/lines
  libs/shared/database/utils/query-builder.util.ts   : 100% statements/lines
Test Suites: 6 passed, 6 total
Tests:       14 passed, 14 total
```

### Đánh giá AC

| AC | Trạng thái | Ghi chú |
|---|---|---|
| RabbitmqModule import được vào NestJS microservice | ✅ | Module tồn tại, build PASS |
| RedisModule import được vào NestJS microservice | ✅ | Module tồn tại, build PASS |
| 4 exchanges được tạo tự động khi khởi động | ✅ | Test simulation `rabbitmq.service.spec.ts` xác nhận 4 base exchanges |
| Dead-letter queue sau 3 lần retry | ✅ | Simulation test: move-to-DLQ khi exhausted retries PASS |
| `RedisService.getOrSet()` chỉ gọi factory 1 lần | ✅ | Concurrent test trong `redis.service.spec.ts` PASS |
| Cache invalidation: sau `del()` → `get()` trả null | ✅ | Unit test PASS |
| Message format chuẩn enforce bằng TypeScript | ✅ | Interface `ErpMessage<T>` và `cache-key.builder.spec.ts` PASS |
| Unit test coverage ≥ 80% | ❌ | `rabbitmq.service.ts` 52.11%, `redis.service.ts` 55.55% — dưới ngưỡng |
| Integration test: publish → subscribe thành công | ❌ | RabbitMQ broker runtime không khả dụng (Docker daemon lỗi) |
| Retry policy: retry đúng 3 lần trước khi vào DLQ | ✅ (simulation) | Unit simulation pass; chưa có broker thật |

### Kết luận QA Final

- **Quyết định:** Giữ 🟡 REVIEW
- **Lý do:** 2 AC chưa đạt: coverage messaging libs < 80% và thiếu integration test với RabbitMQ broker thật.
- **Điều kiện đóng:**
  1. Nâng coverage `rabbitmq.service.ts` và `redis.service.ts` lên ≥ 80%.
  2. Bổ sung integration test publish→subscribe + retry→DLQ với RabbitMQ runtime thật (Testcontainers hoặc CI service) khi môi trường sẵn sàng.
