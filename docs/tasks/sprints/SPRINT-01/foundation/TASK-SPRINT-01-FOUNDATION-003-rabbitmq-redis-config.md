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
| Trạng thái       | 🟡 REVIEW                        |
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
- [ ] Unit test coverage ≥ 80% (chưa chạy `test:cov`)
- [ ] Integration test: publish → subscribe thành công (chưa có môi trường RabbitMQ test tự động)
- [ ] Retry policy: message được retry đúng 3 lần trước khi vào DLQ (đã có logic, chưa có integration test xác nhận end-to-end)

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
