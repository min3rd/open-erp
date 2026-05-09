# TASK-SPRINT-02-SYSTEM_ADMIN-002: Audit Service — Nhật ký thao tác hệ thống

## Thông tin

| Thuộc tính       | Giá trị                          |
|------------------|----------------------------------|
| Task ID          | TASK-SPRINT-02-SYSTEM_ADMIN-002  |
| Sprint           | Sprint 02                        |
| Cluster          | system-admin                     |
| Loại             | Backend                          |
| Người phụ trách  | Backend                          |
| Story Points     | 5                                |
| Trạng thái       | ⬜ TODO                          |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-003    |

## Mô tả

Xây dựng `audit-service` — microservice chuyên thu thập và lưu trữ nhật ký toàn bộ thao tác trong hệ thống. Subscribe tất cả events từ RabbitMQ (`#` — wildcard), lưu vào MongoDB với đầy đủ thông tin: ai làm gì, trên resource nào, dữ liệu trước/sau thay đổi, IP address. Cung cấp API tìm kiếm, lọc, và xuất CSV cho Tenant Admin.

## Phạm vi kỹ thuật

### Backend (NestJS — `audit-service`, port 3006)

**Cấu trúc module:**
```
src/
├── audit.module.ts
├── main.ts
├── audit-logs/
│   ├── audit-logs.controller.ts
│   ├── audit-logs.service.ts
│   └── schemas/
│       └── audit-log.schema.ts
├── event-consumers/
│   └── all-events.consumer.ts       ← Subscribe # routing key
├── export/
│   └── export.service.ts            ← CSV/Excel export
└── retention/
    └── retention.service.ts         ← Cron job xóa log cũ
```

**Event Subscription — Wildcard:**
```typescript
@EventPattern('#')    // Subscribe tất cả events
@MessagePattern({ pattern: /.*/ })
async handleAnyEvent(data: ErpMessage<unknown>, context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMessage = context.getMessage();
  
  try {
    await this.auditLogService.create({
      tenantId: data.tenantId,
      userId: data.userId,
      eventType: data.eventType,
      resource: this.extractResource(data.eventType),  // 'user' từ 'user.created'
      action: this.extractAction(data.eventType),      // 'created'
      payload: data.payload,
      metadata: data.metadata,
      ip: data.metadata?.ip,
      userAgent: data.metadata?.userAgent,
      timestamp: new Date(data.timestamp),
    });
    channel.ack(originalMessage);
  } catch (error) {
    channel.nack(originalMessage, false, false);   // DLQ
  }
}
```

**Trực tiếp từ API (không qua event):**
```typescript
// Decorator cho controllers: tự động log khi method thực thi
@AuditLog({ resource: 'users', action: 'update' })
async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }

// AuditLogInterceptor tự động capture:
// - oldData: lấy record trước khi update
// - newData: lấy record sau khi update
// - userId từ JWT
// - IP từ request
```

**Cấu trúc Audit Log:**
```typescript
interface AuditLogDocument {
  tenantId: ObjectId;
  userId: ObjectId;              // Người thực hiện
  userEmail: string;             // Snapshot email (tránh join sau này)
  sessionId?: string;
  eventType: string;             // 'user.created', 'order.approved'
  resource: string;              // 'user', 'order', 'invoice'
  resourceId?: string;           // ID của resource bị tác động
  action: string;                // 'created', 'updated', 'deleted', 'approved'
  oldData?: object;              // Dữ liệu trước khi thay đổi (PATCH/DELETE)
  newData?: object;              // Dữ liệu sau khi thay đổi
  changes?: string[];            // Danh sách fields thay đổi
  ip: string;
  userAgent?: string;
  geolocation?: {                // Resolve IP → city (optional)
    country: string;
    city: string;
  };
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  duration?: number;             // ms thực thi
  timestamp: Date;
  createdAt: Date;
}
```

**Search/Filter Audit Logs:**
```typescript
interface AuditLogFilter {
  tenantId: string;             // Bắt buộc
  userId?: string;              // Lọc theo user
  resource?: string;            // Lọc theo loại tài nguyên
  action?: string;              // Lọc theo hành động
  resourceId?: string;          // Lọc theo ID resource cụ thể
  dateFrom?: Date;              // Từ ngày
  dateTo?: Date;                // Đến ngày
  status?: 'SUCCESS' | 'FAILURE';
  ip?: string;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp';
  sortOrder?: 'asc' | 'desc';
}
```

**Export CSV:**
```typescript
// Stream CSV để không load toàn bộ data vào memory
async exportCsv(filter: AuditLogFilter): Promise<ReadableStream> {
  const cursor = this.auditLogModel.find(filter).cursor();
  return pipeline(cursor, new CsvTransformStream());
}
```

**Retention Policy:**
```typescript
// Cron job chạy mỗi đêm 02:00
@Cron('0 2 * * *')
async enforceRetention() {
  const retentionDays = await this.getTenantRetentionDays();   // default: 90
  const cutoffDate = subDays(new Date(), retentionDays);
  await this.auditLogModel.deleteMany({ 
    createdAt: { $lt: cutoffDate } 
  });
}
```

### Database (MongoDB)

**Collection: `audit_logs`** (tenantId-scoped)

| Trường        | Kiểu     | Ràng buộc                    | Mô tả                          |
|---------------|----------|------------------------------|--------------------------------|
| `_id`         | ObjectId | —                            | Primary key                    |
| `tenantId`    | ObjectId | required, indexed            | Tenant                         |
| `userId`      | ObjectId | required                     | Actor                          |
| `userEmail`   | string   | required                     | Snapshot email                 |
| `eventType`   | string   | required                     | 'user.created'                 |
| `resource`    | string   | required, indexed            | 'user'                         |
| `resourceId`  | string   | optional                     | ID resource                    |
| `action`      | string   | required, indexed            | 'created'                      |
| `oldData`     | object   | optional                     | Dữ liệu cũ                     |
| `newData`     | object   | optional                     | Dữ liệu mới                    |
| `changes`     | array    | optional                     | Fields thay đổi                |
| `ip`          | string   | required                     | IP address                     |
| `userAgent`   | string   | optional                     | —                              |
| `status`      | enum     | SUCCESS/FAILURE              | —                              |
| `errorMessage`| string   | optional                     | Lỗi nếu FAILURE                |
| `timestamp`   | Date     | required, indexed            | Thời điểm xảy ra               |
| `createdAt`   | Date     | auto                         | —                              |

**Indexes:**
```
{ tenantId: 1, timestamp: -1 }                    — Default sort
{ tenantId: 1, userId: 1, timestamp: -1 }         — Filter by user
{ tenantId: 1, resource: 1, timestamp: -1 }       — Filter by resource
{ tenantId: 1, action: 1, timestamp: -1 }
{ tenantId: 1, resourceId: 1, timestamp: -1 }
{ createdAt: 1 }                                  — TTL index (retention policy)
```

## API Endpoints

| Method | Path                               | Mô tả                                    | Auth            |
|--------|------------------------------------|------------------------------------------|-----------------|
| GET    | `/api/v1/audit-logs`               | Danh sách audit logs (filter, phân trang)| Tenant Admin    |
| GET    | `/api/v1/audit-logs/:id`           | Chi tiết một log                         | Tenant Admin    |
| GET    | `/api/v1/audit-logs/export`        | Xuất CSV (stream)                        | Tenant Admin    |
| GET    | `/api/v1/audit-logs/stats`         | Thống kê (actions by resource, by user)  | Tenant Admin    |

**Query params mẫu:**
```
GET /api/v1/audit-logs
  ?userId=xxx
  &resource=users
  &action=updated
  &dateFrom=2026-01-01
  &dateTo=2026-01-31
  &status=SUCCESS
  &page=1
  &limit=50
```

## Yêu cầu bảo mật

- [ ] Tenant Admin chỉ xem được audit logs của tenant mình
- [ ] `oldData` và `newData` phải mask các trường nhạy cảm (passwordHash, mfaSecret, bankAccount)
- [ ] Audit logs là immutable — không cho phép UPDATE hoặc DELETE qua API
- [ ] Export CSV phải có logging (ai export, khi nào)
- [ ] Super Admin có thể xem audit logs của mọi tenant

## Acceptance Criteria

- [ ] Subscribe tất cả events RabbitMQ → log đầy đủ vào MongoDB
- [ ] Filter theo user + resource + date range trả về đúng kết quả
- [ ] Export CSV stream (không timeout với dataset lớn)
- [ ] oldData/newData được lưu khi có update event
- [ ] Trường nhạy cảm (passwordHash) bị mask trong oldData/newData
- [ ] Retention policy: logs cũ hơn 90 ngày bị xóa tự động
- [ ] Stats API trả về số lượng actions grouped by resource, by user
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Dùng MongoDB TTL index (`{ createdAt: 1 }, { expireAfterSeconds: 7776000 }` = 90 ngày) thay vì cron job để đảm bảo hiệu năng.
- `oldData` và `newData` cần compress nếu lớn — có thể dùng MongoDB BSON compression.
- Sensitive field masking list được cấu hình trong config file, không hardcode.
- Với volume lớn, cân nhắc partition by tenant hoặc archiving sang cold storage (S3/MinIO) sau 90 ngày.
- `AuditLogInterceptor` trong API Gateway capture mọi mutating requests (POST, PUT, PATCH, DELETE) và gửi sang audit-service qua RabbitMQ.
