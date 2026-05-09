# TASK-SPRINT-01-TENANT-001: Tenant Service — Quản lý doanh nghiệp

## Thông tin

| Thuộc tính       | Giá trị                                                          |
|------------------|------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-01-TENANT-001                                        |
| Sprint           | Sprint 01                                                        |
| Cluster          | tenant                                                           |
| Loại             | Backend                                                          |
| Người phụ trách  | Backend                                                          |
| Story Points     | 8                                                                |
| Trạng thái       | ⬜ TODO                                                          |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004     |

## Mô tả

Xây dựng `tenant-service` — microservice quản lý toàn bộ vòng đời của các doanh nghiệp (tenants) trong nền tảng SaaS. Super Admin có thể tạo, xem, cập nhật, kích hoạt/tạm ngưng tenants. Tenant Admin có thể xem và chỉnh sửa thông tin của tenant mình. Publish event `tenant.created` để các service khác khởi tạo dữ liệu mặc định.

## Phạm vi kỹ thuật

### Backend (NestJS — `tenant-service`, port 3002)

**Cấu trúc module:**
```
src/
├── tenant.module.ts
├── main.ts
├── tenants/
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   ├── schemas/
│   │   ├── tenant.schema.ts
│   │   └── tenant-settings.schema.ts
│   └── dto/
│       ├── create-tenant.dto.ts
│       ├── update-tenant.dto.ts
│       └── update-tenant-settings.dto.ts
└── onboarding/
    └── onboarding.service.ts       ← Orchestrate luồng onboarding
```

**Tenant status lifecycle:**
```
PENDING_SETUP → TRIAL → ACTIVE → SUSPENDED → TERMINATED
                          ↑            |
                          └────────────┘ (reactivate)
```

**Luồng tạo Tenant mới (Super Admin):**
```
1. POST /api/v1/tenants
   → Validate subdomain unique (kiểm tra trong DB)
   → Tạo tenant document (status: PENDING_SETUP)
   → Tạo Tenant Admin user (status: ACTIVE)
   → Gửi email welcome với credentials
   → Publish event: tenant.created { tenantId, adminUserId, plan }
   → Cập nhật status → TRIAL

2. user-service subscribe tenant.created → tạo super-user mặc định
3. rbac-service subscribe tenant.created → tạo built-in roles
4. catalog-service subscribe tenant.created → tạo catalogs mặc định
```

**Tenant settings có thể cấu hình:**
```typescript
interface TenantSettings {
  // Localisation
  timezone: string;          // 'Asia/Ho_Chi_Minh'
  locale: string;            // 'vi-VN'
  currency: string;          // 'VND'
  dateFormat: string;        // 'DD/MM/YYYY'
  numberFormat: string;      // '1.234,56' (VN style)

  // Security
  mfaRequired: boolean;
  mfaRequiredForRoles: string[];
  sessionTimeoutMinutes: number;     // default: 480 (8 giờ)
  allowedIpRanges: string[];         // CIDR notation, empty = all

  // Features
  enabledModules: string[];          // ['hr', 'sale', 'accounting', ...]
  
  // Branding
  primaryColor: string;              // '#1890ff'
  logoUrl: string;                   // MinIO URL
  faviconUrl: string;
  companyName: string;               // Tên hiển thị
}
```

### Database (MongoDB)

**Collection: `tenants`** (Platform-level, không có `tenantId` field)

| Trường                 | Kiểu     | Ràng buộc                              | Mô tả                       |
|------------------------|----------|----------------------------------------|-----------------------------|
| `_id`                  | ObjectId | —                                      | Primary key                 |
| `companyName`          | string   | required, trim, max 200                | Tên doanh nghiệp            |
| `subdomain`            | string   | required, unique, 3-30, lowercase      | Subdomain hệ thống          |
| `slug`                 | string   | = subdomain                            | URL slug                    |
| `taxCode`              | string   | optional, 10 hoặc 13 số               | Mã số thuế                  |
| `address`              | object   | optional                               | Địa chỉ doanh nghiệp        |
| `logo`                 | string   | optional                               | MinIO URL                   |
| `status`               | enum     | PENDING_SETUP/TRIAL/ACTIVE/SUSPENDED/TERMINATED | Trạng thái    |
| `plan`                 | enum     | TRIAL/STARTER/BUSINESS/ENTERPRISE      | Gói dịch vụ                 |
| `trialEndsAt`          | Date     | —                                      | Hết hạn dùng thử            |
| `subscriptionEndsAt`   | Date     | —                                      | Hết hạn đăng ký             |
| `quotas`               | object   | —                                      | Giới hạn tài nguyên         |
| `quotas.maxUsers`      | number   | —                                      | Số user tối đa              |
| `quotas.maxStorageBytes`| number  | —                                      | Dung lượng tối đa (bytes)   |
| `quotas.maxApiCallsPerDay`| number| —                                      | API calls tối đa/ngày       |
| `usageStats`           | object   | —                                      | Thống kê sử dụng hiện tại   |
| `config`               | object   | —                                      | Tenant settings             |
| `adminEmail`           | string   | required                               | Email Tenant Admin đầu tiên |
| `createdBy`            | ObjectId | —                                      | Super Admin tạo tenant      |
| `isDeleted`            | boolean  | default: false                         | Soft delete                 |
| `createdAt`            | Date     | auto                                   | —                           |
| `updatedAt`            | Date     | auto                                   | —                           |

**Indexes:**
```
{ subdomain: 1 }              — unique
{ status: 1 }
{ plan: 1 }
{ trialEndsAt: 1 }            — Cron job kiểm tra hết hạn
{ subscriptionEndsAt: 1 }
```

**Collection: `tenant_settings`** (embedded vào tenants, nhưng có thể tách riêng nếu lớn)

Cấu trúc xem `TenantSettings` interface ở trên.

## API Endpoints

| Method | Path                                  | Mô tả                                    | Auth                    |
|--------|---------------------------------------|------------------------------------------|-------------------------|
| GET    | `/api/v1/tenants`                     | Danh sách tất cả tenants (phân trang)    | Super Admin             |
| POST   | `/api/v1/tenants`                     | Tạo tenant mới                           | Super Admin             |
| GET    | `/api/v1/tenants/:id`                 | Chi tiết một tenant                      | Super Admin             |
| PATCH  | `/api/v1/tenants/:id`                 | Cập nhật thông tin tenant                | Super Admin             |
| DELETE | `/api/v1/tenants/:id`                 | Xoá mềm tenant                           | Super Admin             |
| POST   | `/api/v1/tenants/:id/activate`        | Kích hoạt tenant                         | Super Admin             |
| POST   | `/api/v1/tenants/:id/suspend`         | Tạm ngưng tenant                         | Super Admin             |
| GET    | `/api/v1/tenants/me`                  | Thông tin tenant hiện tại               | Tenant Admin            |
| PATCH  | `/api/v1/tenants/me/settings`         | Cập nhật tenant settings                 | Tenant Admin            |
| GET    | `/api/v1/tenants/me/settings`         | Xem tenant settings                      | Tenant Admin/Employee   |
| PATCH  | `/api/v1/tenants/:id/plan`            | Nâng/hạ gói dịch vụ                      | Super Admin             |

**Request/Response mẫu:**

```
POST /api/v1/tenants
Body:
{
  "companyName": "ACME Corporation",
  "subdomain": "acme-corp",
  "adminEmail": "admin@acme.com",
  "plan": "STARTER",
  "taxCode": "0123456789"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "...",
    "companyName": "ACME Corporation",
    "subdomain": "acme-corp",
    "status": "TRIAL",
    "plan": "STARTER",
    "trialEndsAt": "2026-05-23T00:00:00Z"
  }
}
```

## Yêu cầu bảo mật

- [ ] CRUD tenants chỉ Super Admin (role: `SUPER_ADMIN`) mới được thực hiện
- [ ] Tenant Admin chỉ xem/sửa được tenant của mình (`/tenants/me`)
- [ ] Subdomain validation: chỉ cho phép `[a-z0-9-]`, không có từ khoá hệ thống (`admin`, `api`, `www`, v.v.)
- [ ] Tenant đã bị terminate không thể reactivate
- [ ] Validate taxCode theo định dạng Việt Nam (10 hoặc 13 chữ số)

## Acceptance Criteria

- [ ] Tạo tenant mới → tenant document được tạo, status `TRIAL`
- [ ] Event `tenant.created` được publish lên RabbitMQ
- [ ] Subdomain trùng → trả về 409 Conflict
- [ ] Tenant Admin xem được `/tenants/me` với đúng thông tin tenant mình
- [ ] Tenant Admin cập nhật settings thành công (timezone, locale, etc.)
- [ ] Super Admin suspend/activate tenant thành công
- [ ] Tenant bị suspended → users trong tenant không thể đăng nhập (auth-service kiểm tra)
- [ ] Pagination hoạt động đúng (`/tenants?page=1&limit=20`)
- [ ] Filter theo status (`/tenants?status=ACTIVE`)
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: Tenant Admin không thể xem tenant khác

## Ghi chú kỹ thuật

- `tenant-service` dùng `auth-service` để xác thực JWT và phân quyền.
- Khi suspend tenant: publish `tenant.suspended` event → notification-service gửi email cảnh báo cho Tenant Admin.
- Cron job (NestJS `@nestjs/schedule`): kiểm tra `trialEndsAt` và `subscriptionEndsAt` mỗi ngày lúc 01:00 → tự động chuyển status.
- MinIO bucket `tenant-{tenantId}/` được tạo tự động khi tenant được khởi tạo.
- Subdomain blacklist: `admin`, `api`, `www`, `mail`, `support`, `app`, `dashboard`, `status`, `docs`, `help`.
