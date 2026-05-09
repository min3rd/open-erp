# TASK-SPRINT-01-TENANT-002: Tenant Service — Subscription và Quota Management

## Thông tin

| Thuộc tính       | Giá trị                         |
|------------------|---------------------------------|
| Task ID          | TASK-SPRINT-01-TENANT-002       |
| Sprint           | Sprint 01                       |
| Cluster          | tenant                          |
| Loại             | Backend                         |
| Người phụ trách  | Backend                         |
| Story Points     | 5                               |
| Trạng thái       | ⬜ TODO                         |
| Phụ thuộc        | TASK-SPRINT-01-TENANT-001       |

## Mô tả

Triển khai hệ thống quản lý gói đăng ký (subscription) và quota cho từng tenant. Bao gồm định nghĩa các tiers, cơ chế enforce quota khi tenant vượt giới hạn, theo dõi usage realtime bằng Redis counter, và gửi cảnh báo khi gần đạt ngưỡng.

## Phạm vi kỹ thuật

### Backend (NestJS — `tenant-service`, bổ sung vào module tenant)

**Subscription Tiers:**

| Tier         | Max Users | Max Storage | Max API/ngày | Giá (VNĐ/tháng) | Modules             |
|--------------|-----------|-------------|--------------|-----------------|---------------------|
| TRIAL        | 5         | 512 MB      | 1.000        | 0               | Tất cả (14 ngày)   |
| STARTER      | 20        | 10 GB       | 10.000       | 500.000         | HR, Sale, Office    |
| BUSINESS     | 100       | 50 GB       | 100.000      | 2.000.000       | Tất cả modules      |
| ENTERPRISE   | Không giới hạn | Không giới hạn | Không giới hạn | Thỏa thuận | Tất cả + custom |

**Quota Enforcement Middleware:**
```typescript
// Chạy trên api-gateway, kiểm tra trước khi forward request
@Injectable()
export class QuotaMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    
    // Kiểm tra API calls quota
    const apiCalls = await this.redisService.incr(`quota:api:${tenantId}`, 86400); // TTL 24h
    const quota = await this.getQuota(tenantId);
    
    if (apiCalls > quota.maxApiCallsPerDay) {
      throw new TooManyRequestsException('Đã vượt giới hạn API calls hàng ngày');
    }
    
    next();
  }
}
```

**Usage Tracking (Redis Counters):**
```
quota:api:{tenantId}          → Số API calls hôm nay (expire: 86400s)
quota:users:{tenantId}        → Số users hiện tại (không expire, update khi create/delete user)
quota:storage:{tenantId}      → Dung lượng đang dùng bytes (update khi upload/delete file)
```

**Quota Alert Service:**
```typescript
// Cron job mỗi giờ kiểm tra usage
@Cron('0 * * * *')
async checkQuotaAlerts() {
  const tenants = await this.tenantModel.find({ status: { $in: ['ACTIVE', 'TRIAL'] } });
  
  for (const tenant of tenants) {
    const usage = await this.getUsage(tenant._id.toString());
    const quotaPercent = {
      users: (usage.users / tenant.quotas.maxUsers) * 100,
      storage: (usage.storage / tenant.quotas.maxStorageBytes) * 100,
      api: (usage.api / tenant.quotas.maxApiCallsPerDay) * 100,
    };
    
    // Alert 80%: cảnh báo sắp đạt giới hạn
    // Alert 100%: đã đạt giới hạn, chặn thêm tài nguyên
    if (quotaPercent.users >= 80) {
      await this.publishAlert(tenant._id, 'USER_QUOTA_80', quotaPercent.users);
    }
    if (quotaPercent.storage >= 80) {
      await this.publishAlert(tenant._id, 'STORAGE_QUOTA_80', quotaPercent.storage);
    }
  }
}
```

### Database (MongoDB)

**Collection: `subscription_plans`** (System-level, không có tenantId)

| Trường           | Kiểu     | Mô tả                           |
|------------------|----------|---------------------------------|
| `_id`            | ObjectId | —                               |
| `code`           | string   | TRIAL, STARTER, BUSINESS, ENTERPRISE |
| `name`           | string   | Tên hiển thị                    |
| `price`          | number   | VNĐ/tháng                       |
| `billingPeriod`  | enum     | MONTHLY, YEARLY                 |
| `quotas`         | object   | maxUsers, maxStorageBytes, maxApiCallsPerDay |
| `features`       | array    | Danh sách tính năng được phép   |
| `enabledModules` | array    | Modules được bật                |
| `isActive`       | boolean  | Plan còn được bán không         |
| `displayOrder`   | number   | Thứ tự hiển thị                 |
| `createdAt`      | Date     | —                               |

**Collection: `tenant_usage_history`** (Lịch sử usage theo ngày)

| Trường           | Kiểu     | Mô tả                           |
|------------------|----------|---------------------------------|
| `_id`            | ObjectId | —                               |
| `tenantId`       | ObjectId | Tenant                          |
| `date`           | Date     | Ngày (không có giờ phút)        |
| `apiCalls`       | number   | Tổng API calls trong ngày       |
| `activeUsers`    | number   | Số users active                 |
| `storageBytes`   | number   | Dung lượng dùng                 |
| `createdAt`      | Date     | —                               |

**Indexes:**
```
{ tenantId: 1, date: -1 }    — Lấy usage theo ngày
{ date: 1 }                  — TTL index (giữ 90 ngày)
```

## API Endpoints

| Method | Path                                        | Mô tả                                    | Auth            |
|--------|---------------------------------------------|------------------------------------------|-----------------|
| GET    | `/api/v1/subscription-plans`                | Danh sách các gói đăng ký               | Không (public)  |
| GET    | `/api/v1/tenants/me/usage`                  | Usage hiện tại của tenant               | Tenant Admin    |
| GET    | `/api/v1/tenants/me/usage/history`          | Lịch sử usage 30 ngày                   | Tenant Admin    |
| GET    | `/api/v1/tenants/:id/usage`                 | Usage của tenant bất kỳ                 | Super Admin     |
| POST   | `/api/v1/tenants/:id/subscription`          | Cập nhật gói đăng ký                    | Super Admin     |

**Response mẫu — Usage:**

```json
{
  "success": true,
  "data": {
    "plan": "STARTER",
    "quotas": {
      "maxUsers": 20,
      "maxStorageBytes": 10737418240,
      "maxApiCallsPerDay": 10000
    },
    "usage": {
      "users": 12,
      "usersPercent": 60,
      "storageBytes": 3221225472,
      "storagePercent": 30,
      "apiCallsToday": 4521,
      "apiCallsPercent": 45.21
    },
    "alerts": ["STORAGE_QUOTA_80"]
  }
}
```

## Yêu cầu bảo mật

- [ ] Quota enforcement không bị bypass khi gọi trực tiếp microservice (middleware ở api-gateway)
- [ ] Chỉ Super Admin mới thay đổi được subscription plan
- [ ] Redis counter dùng atomic `INCR` để tránh race condition
- [ ] Usage history không chứa dữ liệu nhạy cảm của tenant

## Acceptance Criteria

- [ ] Tạo user khi đã đạt maxUsers → 422 với message "Đã đạt giới hạn số lượng người dùng"
- [ ] API calls vượt quota → 429 với message phù hợp
- [ ] Redis counter đúng: mỗi request tăng 1, expire sau 24 giờ
- [ ] Usage percent hiển thị đúng trong `/tenants/me/usage`
- [ ] Alert 80% được publish event khi usage đạt ngưỡng
- [ ] Nâng plan → maxUsers/storage/apiCalls tăng ngay lập tức
- [ ] TRIAL tenant hết 14 ngày → auto suspend
- [ ] Lịch sử usage có đủ 30 ngày
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Seed data cho `subscription_plans` bằng migration script khi service khởi động lần đầu.
- Redis atomic increment đảm bảo đếm chính xác dưới high concurrency.
- Dùng `@nestjs/schedule` cho cron jobs quota alert.
- Usage tracking storage: cập nhật counter khi MinIO event `s3:ObjectCreated` và `s3:ObjectRemoved` (webhook từ MinIO).
- Trong Sprint 02, bổ sung payment gateway integration cho tự động gia hạn.
- Cân nhắc `stripe-metered-billing` trong dài hạn cho usage-based pricing.
