# TASK-SPRINT-02-SYSTEM_ADMIN-007: Subscription Nâng cao — Quản lý gói dịch vụ

## Thông tin

| Thuộc tính      | Giá trị                         |
| --------------- | ------------------------------- |
| Task ID         | TASK-SPRINT-02-SYSTEM_ADMIN-007 |
| Sprint          | Sprint 02                       |
| Cluster         | system-admin                    |
| Loại            | Backend                         |
| Người phụ trách | Backend                         |
| Story Points    | 5                               |
| Trạng thái      | ⬜ TODO                         |
| Phụ thuộc       | TASK-SPRINT-01-TENANT-002       |

## Mô tả

Nâng cấp hệ thống subscription từ Sprint 01 với các tính năng: nâng/hạ gói dịch vụ (upgrade/downgrade), quản lý thời gian dùng thử 14 ngày, grace period 7 ngày khi hết hạn (không tắt hoàn toàn ngay), API báo cáo usage chi tiết, và chuẩn bị sẵn sàng cho tích hợp payment gateway.

## Phạm vi kỹ thuật

### Backend (NestJS — `tenant-service`, nâng cấp Subscription module)

**Cấu trúc bổ sung:**

```
src/
├── subscription/
│   ├── subscription.controller.ts
│   ├── subscription.service.ts
│   ├── upgrade-downgrade.service.ts
│   ├── trial.service.ts
│   ├── billing-event.service.ts    ← Ready cho payment integration
│   └── schemas/
│       ├── subscription-history.schema.ts
│       └── billing-event.schema.ts
```

**Upgrade/Downgrade Flow:**

```
Upgrade (STARTER → BUSINESS):
1. POST /api/v1/tenants/:id/subscription/upgrade { targetPlan: 'BUSINESS' }
2. Validate: targetPlan > currentPlan
3. Tính phí prorated (nếu có payment gateway)
4. Cập nhật tenant.plan = 'BUSINESS', quota ngay lập tức
5. Lưu subscription_history record
6. Publish event: subscription.upgraded
7. Gửi notification cho Tenant Admin

Downgrade (BUSINESS → STARTER):
1. Validate: usage hiện tại <= quota của plan mới
   - Nếu vượt → trả error "Cần giảm số users xuống ≤ 20 trước khi hạ gói"
2. Lịch áp dụng: cuối chu kỳ thanh toán hiện tại (không ngay lập tức)
3. Lưu scheduled_downgrade record
4. Notify Tenant Admin
```

**Trial Period (14 ngày):**

```typescript
// Khi tạo tenant mới
const trialEndsAt = addDays(new Date(), 14);

// Cron job hàng ngày 09:00
@Cron('0 9 * * *')
async processTrialExpiry() {
  const expiredTrials = await this.tenantModel.find({
    status: 'TRIAL',
    trialEndsAt: { $lte: new Date() },
  });

  for (const tenant of expiredTrials) {
    // Gửi email cảnh báo: 3 ngày trước, 1 ngày trước
    // Sau khi hết hạn: chuyển sang GRACE_PERIOD
    await this.startGracePeriod(tenant);
  }
}
```

**Grace Period (7 ngày sau khi hết hạn):**

```typescript
// Grace period: tenant vẫn hoạt động nhưng hiển thị banner cảnh báo
// Status: GRACE_PERIOD (thêm vào enum)
// Sau 7 ngày: chuyển SUSPENDED (không xóa data)
// Nếu gia hạn trong grace period: trở về ACTIVE

interface TenantGracePeriod {
  tenantId: ObjectId;
  startedAt: Date;
  endsAt: Date; // startedAt + 7 days
  reason: "trial_expired" | "subscription_expired";
}
```

**Billing Event (sẵn sàng cho payment gateway):**

```typescript
// Ghi lại tất cả billing events, sẵn sàng kết nối Stripe/VNPay
interface BillingEvent {
  tenantId: ObjectId;
  type:
    | "subscription_upgraded"
    | "subscription_renewed"
    | "payment_received"
    | "payment_failed";
  amount?: number; // VNĐ
  currency: "VND" | "USD";
  fromPlan?: string;
  toPlan?: string;
  externalPaymentId?: string; // Stripe payment intent ID, VNPay transaction ID
  metadata?: object;
  createdAt: Date;
}
```

**Usage Report API:**

```typescript
interface UsageReport {
  tenantId: string;
  reportDate: Date;
  plan: string;
  quotas: {
    maxUsers: number;
    maxStorageBytes: number;
    maxApiCallsPerDay: number;
  };
  usage: {
    users: number;
    storageBytes: number;
    apiCallsToday: number;
    apiCallsThisMonth: number;
  };
  history: {
    date: string;
    users: number;
    storageBytes: number;
    apiCalls: number;
  }[];
  alerts: string[];
  subscription: {
    status: string;
    endsAt: Date | null;
    gracePeriodEndsAt: Date | null;
    daysUntilExpiry: number | null;
  };
}
```

**Notification schedule alerts:**

| Thời điểm                          | Thông báo                                     |
| ---------------------------------- | --------------------------------------------- |
| 7 ngày trước hết trial             | "Thời gian dùng thử sắp kết thúc"             |
| 3 ngày trước hết trial             | "Còn 3 ngày — nâng cấp để không bị gián đoạn" |
| 1 ngày trước hết trial             | "Ngày cuối dùng thử"                          |
| Hết hạn → bắt đầu grace period     | "Tài khoản vào grace period 7 ngày"           |
| 1 ngày trước kết thúc grace period | "Tài khoản sẽ bị tạm ngưng vào ngày mai"      |
| Quota đạt 80%                      | "Cảnh báo quota"                              |
| Quota đạt 100%                     | "Đã đạt giới hạn"                             |

### Database (MongoDB)

**Cập nhật collection `tenants`** — thêm fields:

| Trường                | Kiểu   | Mô tả                                     |
| --------------------- | ------ | ----------------------------------------- |
| `gracePeriodEndsAt`   | Date   | Kết thúc grace period                     |
| `scheduledPlanChange` | object | `{ toPlan, effectiveDate }` cho downgrade |
| `trialConvertedAt`    | Date   | Khi nào chuyển từ TRIAL sang paid         |

**Cập nhật `status` enum:** thêm `GRACE_PERIOD`

**Collection: `subscription_history`** (Không có tenantId — platform level)

| Trường        | Kiểu     | Mô tả                   |
| ------------- | -------- | ----------------------- |
| `_id`         | ObjectId | —                       |
| `tenantId`    | ObjectId | Tenant                  |
| `fromPlan`    | string   | Gói cũ                  |
| `toPlan`      | string   | Gói mới                 |
| `changedBy`   | ObjectId | Super Admin hoặc system |
| `reason`      | string   | Lý do thay đổi          |
| `effectiveAt` | Date     | Thời điểm có hiệu lực   |
| `createdAt`   | Date     | —                       |

**Collection: `billing_events`** (Platform level)

## API Endpoints

| Method | Path                                                | Mô tả                            | Auth         |
| ------ | --------------------------------------------------- | -------------------------------- | ------------ |
| POST   | `/api/v1/tenants/:id/subscription/upgrade`          | Nâng cấp gói                     | Super Admin  |
| POST   | `/api/v1/tenants/:id/subscription/downgrade`        | Hạ gói (schedule)                | Super Admin  |
| POST   | `/api/v1/tenants/:id/subscription/extend-trial`     | Gia hạn dùng thử                 | Super Admin  |
| POST   | `/api/v1/tenants/:id/subscription/cancel-downgrade` | Hủy lịch hạ gói                  | Super Admin  |
| GET    | `/api/v1/tenants/:id/usage`                         | Usage report đầy đủ              | Super Admin  |
| GET    | `/api/v1/tenants/me/usage`                          | Usage report của tenant hiện tại | Tenant Admin |
| GET    | `/api/v1/tenants/:id/billing-events`                | Lịch sử billing                  | Super Admin  |
| GET    | `/api/v1/subscription-plans/compare`                | So sánh các plans                | Public       |

## Acceptance Criteria

- [ ] Upgrade STARTER → BUSINESS: quota tăng ngay lập tức
- [ ] Downgrade BUSINESS → STARTER khi đang có 50 users → lỗi validation
- [ ] Downgrade khi usage <= quota mới → tạo scheduled downgrade
- [ ] Trial hết hạn → status chuyển GRACE_PERIOD
- [ ] Grace period 7 ngày → status chuyển SUSPENDED
- [ ] Gia hạn trong grace period → status về ACTIVE
- [ ] Usage report có đủ lịch sử 30 ngày
- [ ] Alert notification gửi đúng thời điểm
- [ ] Subscription history lưu đầy đủ
- [ ] Unit test coverage ≥ 80%

## Ghi chú kỹ thuật

- Payment gateway integration sẽ được thêm trong Sprint sau (Stripe hoặc VNPay).
- Billing events model đã chuẩn bị sẵn `externalPaymentId` để link với payment gateway.
- Cron jobs: dùng `@nestjs/schedule` với lock Redis để tránh chạy song song khi scale nhiều instances.
- Prorated billing calculation cho mid-cycle upgrades: `(daysRemaining / totalDays) * priceDiff`.
- Tenant status `GRACE_PERIOD`: API vẫn hoạt động bình thường nhưng banner cảnh báo hiển thị.
