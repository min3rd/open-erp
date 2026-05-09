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
| Trạng thái       | ⬜ TODO                           |
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

- [ ] `RabbitmqModule` import được vào bất kỳ NestJS microservice nào
- [ ] `RedisModule` import được vào bất kỳ NestJS microservice nào
- [ ] 4 exchanges được tạo tự động khi service khởi động
- [ ] Dead-letter queue nhận message sau 3 lần retry thất bại
- [ ] `RedisService.getOrSet()` chỉ gọi factory 1 lần dù concurrent requests
- [ ] Cache invalidation hoạt động: sau `del()` → `get()` trả về null
- [ ] Message format chuẩn được enforce bằng TypeScript interface
- [ ] Unit test coverage ≥ 80%
- [ ] Integration test: publish → subscribe thành công
- [ ] Retry policy: message được retry đúng 3 lần trước khi vào DLQ

## Ghi chú kỹ thuật

- Dùng `@golevelup/nestjs-rabbitmq` hoặc `amqplib` trực tiếp — ưu tiên `@golevelup` vì decorator-based.
- `ioredis` cho Redis client — hỗ trợ Cluster mode khi scale.
- Tạo shared library theo kiến trúc NestJS monorepo: `libs/messaging`.
- Cần có **circuit breaker** cho RabbitMQ connection (tự động reconnect khi mất kết nối).
- Redis Cluster chưa cần trong Sprint 01, nhưng code phải sẵn sàng (dùng `ioredis.Cluster`).
- Logging tất cả publish/subscribe events với `requestId` để trace.
