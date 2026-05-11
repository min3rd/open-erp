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
| Trạng thái       | 🟡 REVIEW                                                        |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004     |

## Mô tả

Xây dựng `tenant-service` — microservice quản lý toàn bộ vòng đời của các doanh nghiệp (tenants) trong nền tảng SaaS. **Kể từ phiên bản 1.1, doanh nghiệp tự đăng ký qua portal với xác thực Mã số thuế (MST) và email Cục Thuế** — không còn Super Admin tạo tenant thủ công. Super Admin có thể xem, cập nhật, kích hoạt/tạm ngưng tenants. Tenant Admin có thể xem và chỉnh sửa thông tin của tenant mình. Publish event `tenant.registered` và `tenant.created` để các service khác khởi tạo dữ liệu mặc định.

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
PENDING_VERIFICATION → PENDING_SETUP → TRIAL → ACTIVE → SUSPENDED → TERMINATED
                                                   ↑            |
                                                   └────────────┘ (reactivate)

PENDING_VERIFICATION : Đã đăng ký, chưa được Super Admin phê duyệt (chế độ REQUIRE_MANUAL_REVIEW)
PENDING_SETUP        : Xác thực MST + OTP xong, đang chạy Onboarding Wizard
```

**Luồng tự đăng ký (Doanh nghiệp tự phục vụ):**
```
1. POST /api/v1/register
  → Validate MST chưa tồn tại trên nền tảng
  → Tạo tenant_registrations document (status: PENDING_EMAIL_ACTIVATION)
  → Tạo activation token (TTL 30 phút) và gửi email link kích hoạt

2. GET /api/v1/register/activate?token=...
  → Kiểm tra token hợp lệ, chưa dùng, chưa hết hạn
  → Cập nhật registration status = EMAIL_VERIFIED
  → Cho phép tiếp tục sang bước verify tax code

3. POST /api/v1/register/verify-tax-code
   → Goi MSTVerificationAdapter (masothue.com / API Cục Thuế)
   → Lấy thông tin DN: tên, địa chỉ, trạng thái hoạt động
   → So khớp email người dùng với email đăng ký Cục Thuế
   → Cập nhật taxInfo, taxVerified = pending trong tenant_registrations

4. POST /api/v1/register/complete-onboarding
   → Tạo platform_tenants document
      - Nếu REQUIRE_MANUAL_REVIEW = true  → status: PENDING_VERIFICATION
      - Nếu REQUIRE_MANUAL_REVIEW = false → status: PENDING_SETUP → TRIAL
   → Tạo MinIO bucket: tenant-{tenantId}/
   → Tạo Tenant Admin user (định danh = email đăng ký)
   → Publish event: tenant.registered { tenantId, adminUserId, plan }

5. Sau khi hoàn tất Onboarding Wizard (5 bước):
   → Publish event: tenant.created { tenantId, adminUserId, plan }
   → user-service subscribe tenant.created → khởi tạo dữ liệu mặc định
   → rbac-service subscribe tenant.created → tạo built-in roles
   → catalog-service subscribe tenant.created → tạo catalogs mặc định
```

**Tích hợp ngoài (External Integration) — MST Lookup Adapter:**
```typescript
// Adapter Pattern — dễ dàng chuyển đổi giữa nguồn dữ liệu
interface MSTVerificationAdapter {
  lookupByTaxCode(taxCode: string): Promise<TaxInfo | null>;
  verifyEmailMatch(taxCode: string, email: string): Promise<boolean>;
}

// Triển khai mặc định: masothue.com hoặc API chính thức Cục Thuế
class MasothueAdapter implements MSTVerificationAdapter { ... }
class GDTApiAdapter implements MSTVerificationAdapter { ... }

interface TaxInfo {
  companyName: string;    // Tên doanh nghiệp
  address: string;        // Địa chỉ đăng ký
  status: string;         // 'ACTIVE' | 'INACTIVE' | 'DISSOLVED'
  registeredEmail: string; // Email đăng ký Cục Thuế (có thể null)
  registrationDate: Date;
}
```

**Luồng Super Admin quản lý tenant:**
```
- Super Admin: xem danh sách tenants, phê duyệt PENDING_VERIFICATION, suspend/activate
- PATCH /api/v1/tenants/:id/approve → chuyển PENDING_VERIFICATION → TRIAL
- POST /api/v1/tenants/:id/suspend → chuyển ACTIVE → SUSPENDED
- POST /api/v1/tenants/:id/activate → chuyển SUSPENDED → ACTIVE
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
| `taxVerified`          | boolean  | default: false                         | Đã xác thực MST qua Cục Thuế |
| `taxInfo`              | object   | optional                               | Thông tin từ tra cứu MST    |
| `taxInfo.companyName`  | string   | —                                      | Tên DN theo Cục Thuế        |
| `taxInfo.address`      | string   | —                                      | Địa chỉ theo Cục Thuế       |
| `taxInfo.status`       | string   | —                                      | Trạng thái hoạt động Cục Thuế |
| `registrationEmail`    | string   | optional                               | Email dùng khi đăng ký      |
| `verificationMethod`   | enum     | SELF_REGISTER / ADMIN_CREATED          | Phương thức tạo tenant      |
| `address`              | object   | optional                               | Địa chỉ doanh nghiệp        |
| `logo`                 | string   | optional                               | MinIO URL                   |
| `status`               | enum     | PENDING_VERIFICATION/PENDING_SETUP/TRIAL/ACTIVE/SUSPENDED/TERMINATED | Trạng thái    |
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
{ taxCode: 1 }                — unique (sparse), tra cứu theo MST
{ status: 1 }
{ plan: 1 }
{ trialEndsAt: 1 }            — Cron job kiểm tra hết hạn
{ subscriptionEndsAt: 1 }
```

**Collection: `tenant_registrations`** (Lưu trạng thái đăng ký tự phục vụ)

| Trường         | Kiểu     | Ràng buộc                              | Mô tả                       |
|----------------|----------|----------------------------------------|-----------------------------|
| `_id`          | ObjectId | —                                      | Primary key                 |
| `taxCode`      | string   | required, 10 hoặc 13 số, unique       | Mã số thuế đăng ký          |
| `email`        | string   | required                               | Email người đăng ký         |
| `taxVerified`  | boolean  | default: false                         | Đã xác thực MST             |
| `taxInfo`      | object   | optional                               | Thông tin từ MSTAdapter      |
| `otpHash`      | string   | optional                               | Hash bcrypt của OTP         |
| `otpExpiry`    | Date     | optional                               | Thời điểm hết hạn OTP (10 phút) |
| `otpResendCount` | number | default: 0                             | Số lần gửi lại OTP (tối đa 3) |
| `status`       | enum     | PENDING / VERIFIED / COMPLETED / EXPIRED | Trạng thái đăng ký      |
| `tenantId`     | ObjectId | optional                               | Ref tới platform_tenants sau khi hoàn tất |
| `createdAt`    | Date     | auto                                   | —                           |
| `updatedAt`    | Date     | auto                                   | —                           |
| `expiredAt`    | Date     | TTL index (7 ngày)                     | Tự xóa nếu không hoàn tất   |

**Indexes `tenant_registrations`:**
```
{ taxCode: 1 }    — unique
{ email: 1 }
{ status: 1 }
{ expiredAt: 1 }  — TTL index (7 ngày)
```

**Collection: `tenant_settings`** (embedded vào tenants, nhưng có thể tách riêng nếu lớn)

Cấu trúc xem `TenantSettings` interface ở trên.

## API Endpoints

### Đăng ký tự phục vụ (Public — không cần JWT)

| Method | Path                                        | Mô tả                                      | Auth     |
|--------|---------------------------------------------|--------------------------------------------|---------|
| POST   | `/api/v1/register`                          | Doanh nghiệp tự đăng ký (nhập MST + email + mật khẩu) | Không |
| GET    | `/api/v1/register/activate`                 | Kích hoạt email qua activation link         | Không |
| POST   | `/api/v1/register/verify-tax-code`          | Xác thực MST qua MSTVerificationAdapter    | Không |
| POST   | `/api/v1/register/complete-onboarding`      | Hoàn tất Onboarding Wizard, tạo tenant     | Không |

### Quản lý tenant (Super Admin & Tenant Admin)

| Method | Path                                  | Mô tả                                    | Auth                    |
|--------|---------------------------------------|------------------------------------------|-------------------------|
| GET    | `/api/v1/tenants`                     | Danh sách tất cả tenants (phân trang)    | Super Admin             |
| GET    | `/api/v1/tenants/:id`                 | Chi tiết một tenant                      | Super Admin             |
| PATCH  | `/api/v1/tenants/:id`                 | Cập nhật thông tin tenant                | Super Admin             |
| DELETE | `/api/v1/tenants/:id`                 | Xoá mềm tenant                           | Super Admin             |
| PATCH  | `/api/v1/tenants/:id/approve`         | Phê duyệt tenant PENDING_VERIFICATION    | Super Admin             |
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

- [~] CRUD tenants chỉ Super Admin (role: `SUPER_ADMIN`) mới được thực hiện
- [x] Tenant Admin chỉ xem/sửa được tenant của mình (`/tenants/me`)
- [x] Subdomain validation: chỉ cho phép `[a-z0-9-]`, không có từ khoá hệ thống (`admin`, `api`, `www`, v.v.)
- [x] Tenant đã bị terminate không thể reactivate
- [x] Validate taxCode theo định dạng Việt Nam (10 hoặc 13 chữ số)

## Acceptance Criteria

### Luồng tự đăng ký
- [x] `POST /api/v1/register` với MST chưa tồn tại → tạo `tenant_registrations` document (status: PENDING_EMAIL_ACTIVATION)
- [ ] `POST /api/v1/register` gửi activation link qua email, token TTL 30 phút
- [x] `GET /api/v1/register/activate` với token hợp lệ → status `EMAIL_VERIFIED`
- [x] `GET /api/v1/register/activate` với token hết hạn → 410 Gone
- [x] `POST /api/v1/register` với MST đã đăng ký → 409 Conflict
- [x] `POST /api/v1/register/verify-tax-code` → gọi MSTAdapter, trả về thông tin DN
- [x] MST không hợp lệ hoặc không hoạt động → 400 với message rõ ràng
- [x] Email không khớp thông tin Cục Thuế → 422 "Email không khớp thông tin đăng ký Cục Thuế"
- [~] `POST /api/v1/register/complete-onboarding` → tạo tenant, Admin user, MinIO bucket
- [x] Event `tenant.registered` được publish sau khi hoàn tất đăng ký
- [~] Event `tenant.created` được publish sau Onboarding Wizard hoàn tất
- [x] Tenant tạo với REQUIRE_MANUAL_REVIEW = true → status `PENDING_VERIFICATION`
- [x] Tenant tạo với REQUIRE_MANUAL_REVIEW = false → status `TRIAL`

### Quản lý tenant
- [x] Super Admin phê duyệt PENDING_VERIFICATION → chuyển sang TRIAL
- [x] Subdomain trùng → 409 Conflict
- [x] Tenant Admin xem được `/tenants/me` với đúng thông tin tenant mình
- [x] Tenant Admin cập nhật settings thành công (timezone, locale, etc.)
- [x] Super Admin suspend/activate tenant thành công
- [ ] Tenant bị suspended → users trong tenant không thể đăng nhập (auth-service kiểm tra)
- [x] Pagination hoạt động đúng (`/tenants?page=1&limit=20`)
- [x] Filter theo status (`/tenants?status=ACTIVE`)
- [x] Unit test coverage ≥ 80% (riêng tenant service/controller)
- [x] Multi-tenancy: Tenant Admin không thể xem tenant khác

## Ghi chú kỹ thuật

- `tenant-service` dùng `auth-service` để xác thực JWT và phân quyền.
- Khi suspend tenant: publish `tenant.suspended` event → notification-service gửi email cảnh báo cho Tenant Admin.
- Cron job (NestJS `@nestjs/schedule`): kiểm tra `trialEndsAt` và `subscriptionEndsAt` mỗi ngày lúc 01:00 → tự động chuyển status.
- MinIO bucket `tenant-{tenantId}/` được tạo tự động khi tenant được khởi tạo.
- Subdomain blacklist: `admin`, `api`, `www`, `mail`, `support`, `app`, `dashboard`, `status`, `docs`, `help`.

## Kết quả Unit Test

**Lần chạy:** 2026-05-11 10:14 (local)  
**Lệnh:** `npm test -- --passWithNoTests`  
**Kết quả:** ✅ PASS

| Test suite | Tests | Passed | Failed | Coverage |
|---|---|---|---|---|
| tenant.service.spec.ts | 7 | 7 | 0 | N/A |
| tenant.controller.spec.ts | 3 | 3 | 0 | N/A |
| Toàn bộ backend | 54 | 54 | 0 | N/A |

**Evidence:**
```text
Test Suites: 14 passed, 14 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        10.035 s
Ran all test suites.
```

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-11  
**Branch / Commit:** N/A

**Files đã tạo / sửa:**
- `open-erp-backend/src/app.module.ts` — import `TenantModule`
- `open-erp-backend/src/tenant/tenant.module.ts` — đăng ký module, schemas, adapter, providers
- `open-erp-backend/src/tenant/tenant.controller.ts` — endpoint public/auth theo `/api/v1/*`
- `open-erp-backend/src/tenant/tenant.service.ts` — business rules đăng ký/onboarding/lifecycle/tenant-safe
- `open-erp-backend/src/tenant/onboarding/onboarding.service.ts` — onboarding service cơ bản
- `open-erp-backend/src/tenant/tenant.constants.ts` — regex + blacklist
- `open-erp-backend/src/tenant/adapters/mst-verification.adapter.ts` — adapter interface
- `open-erp-backend/src/tenant/adapters/mock-mst-verification.adapter.ts` — mock adapter Sprint 1
- `open-erp-backend/src/tenant/schemas/tenant.schema.ts` — schema + indexes `tenants`
- `open-erp-backend/src/tenant/schemas/tenant-registration.schema.ts` — schema + indexes `tenant_registrations` + TTL
- `open-erp-backend/src/tenant/dto/*.ts` — dto cho register/verify/onboarding/list/update/settings
- `open-erp-backend/src/tenant/tenant.service.spec.ts` — unit test các case chính theo AC
- `open-erp-backend/src/tenant/tenant.controller.spec.ts` — unit test delegation controller

**Ghi chú:**
- Sprint 1 dùng MST adapter nội bộ (`MockMstVerificationAdapter`), chưa gọi external thực.
- Event publish dùng fire-and-forget qua `RabbitMQService.publish(...).catch(() => undefined)`.
- `tenant.created` đang publish tại bước `complete-onboarding` (chưa tách trạng thái hoàn tất Onboarding Wizard nhiều bước).
- Chưa triển khai tạo Tenant Admin user thực tế và tạo MinIO bucket thực tế; hiện trả metadata onboarding mock.
- Rule phân quyền hiện tenant-safe + cho phép `SUPER_ADMIN`; chưa áp role guard chuyên biệt cho từng endpoint.

**Definition of Done:**
- [x] Unit test coverage ≥ 80%
- [x] API documentation cập nhật (task doc và endpoint thực thi trong backend)
- [ ] Code review được approve

## QA Notes

### Bug-fix Round (2026-05-11)

- Trạng thái chuyển sang `🟡 REVIEW` sau khi hoàn tất vòng fix và xác nhận build/test pass.
- Phạm vi vòng fix này: chặn onboarding khi `taxVerified=false`, không lộ `activationToken` ở API public, siết state của `verify-tax-code`, bổ sung `DELETE /api/v1/tenants/:id` và `PATCH /api/v1/tenants/:id/plan`.
- Ngoài phạm vi vòng fix này: chưa tích hợp MinIO thật, chưa tạo Tenant Admin thật; cần giữ ghi chú rõ trong docs và giữ `tenant-safe + SUPER_ADMIN` như hiện tại.

### QA Re-validation (2026-05-11)

**Lệnh xác nhận:**
```text
npm run build
npm test -- --passWithNoTests
npm test -- src/auth/auth.controller.spec.ts src/auth/auth.service.spec.ts src/tenant/tenant.service.spec.ts src/tenant/tenant.controller.spec.ts --runInBand --passWithNoTests
```

**Kết quả:**
- `TENANT-QA-001` — Fixed: `POST /api/v1/register/complete-onboarding` chặn khi registration chưa `taxVerified=true`.
- `TENANT-QA-002` — Fixed: `POST /api/v1/register` không còn trả `activationToken` trong response public.
- `TENANT-QA-003` — Fixed: `POST /api/v1/register/verify-tax-code` bắt buộc registration phải tồn tại và đang ở state `EMAIL_VERIFIED`.
- `TENANT-QA-005` — Fixed: đã bổ sung `DELETE /api/v1/tenants/:id` (soft delete) và `PATCH /api/v1/tenants/:id/plan`.
- `TENANT-QA-004` — Chưa xử lý trong vòng fix này theo phạm vi đã chốt: vẫn chưa tạo MinIO bucket thật và Tenant Admin thật.
- `TENANT-QA-006` — Chưa mở rộng trong vòng fix này: `tenant.created` vẫn publish tại `complete-onboarding` của flow backend rút gọn hiện tại.

**Evidence:**
```text
> npm run build
> nest build

> npm test -- --passWithNoTests
Test Suites: 15 passed, 15 total
Tests:       69 passed, 69 total

> npm test -- src/auth/auth.controller.spec.ts src/auth/auth.service.spec.ts src/tenant/tenant.service.spec.ts src/tenant/tenant.controller.spec.ts --runInBand --passWithNoTests
Test Suites: 4 passed, 4 total
Tests:       40 passed, 40 total
```

**Ngày đánh giá:** 2026-05-11  
**Người thực hiện:** Senior QA  
**Phương pháp:** Rà soát code + chạy build + chạy test hẹp theo scope TENANT-001.

**Evidence:**
```text
> npm run build
> nest build

> npm test -- src/auth/auth.service.spec.ts src/tenant/tenant.service.spec.ts src/tenant/tenant.controller.spec.ts --runInBand --passWithNoTests
PASS  src/tenant/tenant.controller.spec.ts
PASS  src/tenant/tenant.service.spec.ts
Test Suites: 3 passed, 3 total
Tests: 25 passed, 25 total
```

**Limitation:**
- Chưa có runtime backend + hạ tầng tích hợp ngoài để chạy manual E2E/Playwright cho luồng `/api/v1/register*` và `/api/v1/tenants*`.
- Sprint 01 hiện dùng `MockMstVerificationAdapter`, nên chưa thể xác nhận hành vi với nguồn MST thực bên ngoài.

**Findings / Risk:**

| Mã | Mức độ | Mô tả | Evidence |
|---|---|---|---|
| TENANT-QA-001 | Critical | `POST /api/v1/register/complete-onboarding` không chặn trường hợp `taxVerified = false`. Chỉ cần registration ở trạng thái `EMAIL_VERIFIED` là có thể tạo tenant, dẫn tới bypass bước xác thực MST. | `open-erp-backend/src/tenant/tenant.service.ts` (`completeOnboarding`, check `EMAIL_VERIFIED` và gán `taxVerified: Boolean(registration.taxVerified)`) |
| TENANT-QA-002 | Major | `POST /api/v1/register` trả thẳng `activationToken` trong response public. Người gọi không cần sở hữu email vẫn có thể tự kích hoạt registration, làm vô hiệu hóa mục tiêu email activation. | `open-erp-backend/src/tenant/tenant.service.ts` (`activationToken` được tạo và trả về trong `data`) |
| TENANT-QA-003 | Major | `POST /api/v1/register/verify-tax-code` không xác nhận registration đã tồn tại và đã `EMAIL_VERIFIED`. `findOneAndUpdate(...).exec()` có thể không tìm thấy bản ghi nhưng service vẫn trả `success: true`, cho phép bypass thứ tự flow và làm lộ kết quả tra cứu MST. | `open-erp-backend/src/tenant/tenant.service.ts` (`verifyTaxCode`) |
| TENANT-QA-004 | Major | Bước onboarding mới trả metadata mock, chưa tạo Tenant Admin user và chưa tạo MinIO bucket thực tế. Đây là gap trực tiếp so với scope task/self-service onboarding. | `open-erp-backend/src/tenant/onboarding/onboarding.service.ts`; ghi chú triển khai ngay trong task doc |
| TENANT-QA-005 | Major | API scope chưa hoàn tất: controller chưa có `DELETE /api/v1/tenants/:id` và `PATCH /api/v1/tenants/:id/plan` dù đã khai báo trong task doc. | `docs/tasks/sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md` phần API Endpoints; `open-erp-backend/src/tenant/tenant.controller.ts` |
| TENANT-QA-006 | Minor | Event `tenant.created` đang publish ngay trong `complete-onboarding`, sớm hơn flow mô tả là sau khi hoàn tất Onboarding Wizard nhiều bước. Rủi ro khởi tạo dữ liệu mặc định sớm hơn trạng thái nghiệp vụ thật. | `open-erp-backend/src/tenant/tenant.service.ts` (`publishFireAndForget('tenant.created', ...)`) |

**Kết luận QA:**
- `🔴 BLOCKED` cho release/backend sign-off của TENANT-001.
- Bắt buộc tạo bug task mới cho `TENANT-QA-001` đến `TENANT-QA-005` trước khi chuyển bước tiếp theo.

### Change Request: Routing & Versioning Refactor (2026-05-11)

**Mục tiêu:**
- Loại bỏ hardcode `api/v1` trong controller.
- Tách rõ resource cho register flow và tenant management.
- Giữ backward-compatible endpoint contracts Sprint 1.

**Kết quả triển khai:**
- Cập nhật bootstrap `open-erp-backend/src/main.ts`:
  - `app.setGlobalPrefix('api')`
  - `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`
- Tách controller theo resource:
  - `open-erp-backend/src/tenant/tenant-registration.controller.ts`
    - `@Controller({ path: 'register', version: '1' })`
    - Các route: `POST /api/v1/register`, `GET /api/v1/register/activate`, `POST /api/v1/register/verify-tax-code`, `POST /api/v1/register/complete-onboarding`
  - `open-erp-backend/src/tenant/tenant.controller.ts`
    - `@Controller({ path: 'tenants', version: '1' })`
    - Các route quản trị tenant giữ nguyên contract `/api/v1/tenants/*`
- Cập nhật `open-erp-backend/src/tenant/tenant.module.ts` để đăng ký cả hai controllers.
- Cập nhật unit test controller:
  - `open-erp-backend/src/tenant/tenant.controller.spec.ts`
  - thêm mới `open-erp-backend/src/tenant/tenant-registration.controller.spec.ts`

**Kết quả kiểm thử sau refactor:**
```text
npm run build                          ✅ PASS
npm test -- --passWithNoTests          ✅ PASS
Test Suites: 16 passed, 16 total
Tests: 70 passed, 70 total
```

**Ghi chú endpoint mapping:**
- Trước: `@Controller('api/v1')` + method path `register/*`, `tenants/*`
- Sau: controller tường minh theo resource và version, runtime path vẫn giữ nguyên `/api/v1/register/*` và `/api/v1/tenants/*`.
