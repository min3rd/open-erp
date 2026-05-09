# TASK-SPRINT-01-FOUNDATION-004: Tenant Service — Vòng đời và Onboarding Tenant

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-004 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | Feature |
| Người phụ trách | Backend |
| Story Points | 8 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-001 |

## Mô tả
Xây dựng `tenant-service` quản lý toàn bộ vòng đời tenant: tạo mới, cấu hình, thay đổi trạng thái, onboarding wizard, quản lý gói dịch vụ và quota. Service này là trung tâm của SaaS multi-tenancy.

## Phạm vi kỹ thuật

### Backend (NestJS — `services/tenant-service/`)
- Khởi tạo NestJS Microservice (TCP transport, port 3101)
- **Tạo Tenant mới (F-SA-010)**:
  - Super Admin tạo tenant: `companyName`, `subdomain`, `adminEmail`, `plan`, `trialDays`
  - Validate subdomain: unique, lowercase, 3-30 chars, chỉ alphanumeric + dấu gạch ngang
  - Tạo `tenantId` (ObjectId MongoDB)
  - Tạo tenant document với status `PENDING_SETUP`
  - Tạo MinIO bucket: `tenant-{tenantId}` qua storage-service
  - Seed default data: gọi user-service để tạo Tenant Admin user (PENDING_ACTIVATION)
  - Seed default roles qua rbac-service (TENANT_ADMIN, MANAGER, EMPLOYEE)
  - Seed default catalog items qua catalog-service
  - Gửi event: `tenant.created`
  - Gửi event: `notification.send.email` (mời Tenant Admin)
- **Subdomain Resolution** (được gọi từ API Gateway):
  - Cache trong Redis: `tenant:subdomain:{subdomain}` → `{ tenantId, status }` (TTL 5 phút)
  - Invalidate cache khi tenant status thay đổi
- **Cập nhật Tenant (F-SA-011)**:
  - Tenant Admin cập nhật: tên công ty, MST, địa chỉ, logo, múi giờ, ngôn ngữ, modules
  - Validate MST Việt Nam: 10 hoặc 13 chữ số
  - Không cho phép đổi subdomain sau khi ACTIVE
  - Emit audit event
- **Quản lý Trạng thái (F-SA-012)**:
  - `PENDING_SETUP → TRIAL`: khi onboarding bước 1+2 hoàn thành
  - `TRIAL → ACTIVE`: khi chọn gói và thanh toán (manual confirm trong v1)
  - `ACTIVE → SUSPENDED`: Super Admin hoặc auto khi quá hạn
  - `SUSPENDED → ACTIVE`: Super Admin restore
  - `ANY → TERMINATED`: Super Admin, xác nhận 2 bước
  - Khi TERMINATED: soft-delete tất cả data (isDeleted=true), schedule hard-delete sau 30 ngày
  - Emit event: `tenant.status.changed`
  - Invalidate Redis cache khi status thay đổi
- **Onboarding Wizard (F-SA-013)**:
  - API lưu progress: `PATCH /tenants/current/onboarding`
  - 5 bước: `company_info`, `settings`, `departments`, `invite_users`, `modules`
  - Bước 1+2 bắt buộc trước khi chuyển sang TRIAL
  - Lưu completedSteps trong tenant document
- **Quota Management**:
  - Lấy quotas theo subscription plan
  - `POST /tenants/check-quota` (internal): kiểm tra user quota, storage quota
  - Emit event: `tenant.quota.exceeded` khi đạt 90%
- **Thống kê sử dụng (F-SA-019)**:
  - `GET /tenants/current/usage`: current users, storage used, API calls today
  - Aggregate từ Redis counters + MongoDB counts
- **Tenant Config**:
  - `GET /tenants/current/config`
  - `PATCH /tenants/current/config`: timezone, language, password policy, session timeout, enabled modules

## Database (MongoDB)
- Collections:
  - `tenants` — schema đầy đủ theo DATABASE-DESIGN.md
  - `subscription_plans` — seed data khi khởi động service
- Indexes:
  - `{ subdomain: 1 }` — unique
  - `{ status: 1 }`
  - `{ adminEmail: 1 }`

## API Endpoints
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/platform/tenants` | SuperAdmin | Danh sách tất cả tenant |
| `POST` | `/platform/tenants` | SuperAdmin | Tạo tenant mới |
| `GET` | `/platform/tenants/{id}` | SuperAdmin | Chi tiết tenant |
| `POST` | `/platform/tenants/{id}/suspend` | SuperAdmin | Tạm ngưng |
| `POST` | `/platform/tenants/{id}/activate` | SuperAdmin | Kích hoạt |
| `POST` | `/platform/tenants/{id}/terminate` | SuperAdmin | Hủy (2-step) |
| `GET` | `/tenants/current` | JWT | Thông tin tenant hiện tại |
| `PATCH` | `/tenants/current` | TenantAdmin | Cập nhật thông tin |
| `GET` | `/tenants/current/config` | JWT | Cấu hình tenant |
| `PATCH` | `/tenants/current/config` | TenantAdmin | Cập nhật cấu hình |
| `GET` | `/tenants/current/usage` | TenantAdmin | Thống kê sử dụng |
| `PATCH` | `/tenants/current/onboarding` | TenantAdmin | Lưu tiến độ onboarding |

## Acceptance Criteria
- [ ] Tạo tenant mới với subdomain unique thành công
- [ ] Tạo tenant với subdomain đã tồn tại → 409 Conflict
- [ ] Tenant Admin nhận email mời khi tenant được tạo
- [ ] MinIO bucket được tạo tự động khi tenant được tạo
- [ ] Default roles được seed đúng (TENANT_ADMIN, MANAGER, EMPLOYEE)
- [ ] Subdomain resolution được cache trong Redis
- [ ] Tenant SUSPENDED → API Gateway trả 403 cho mọi request
- [ ] Onboarding progress được lưu và resume đúng
- [ ] Quota check: vượt maxUsers → 403 khi tạo user mới
- [ ] Tenant config update ảnh hưởng ngay đến request sau
- [ ] Unit test coverage ≥ 80%

## Ghi chú kỹ thuật
- Seed data (default roles, catalog items) gọi qua RabbitMQ event `tenant.created`, không gọi trực tiếp
- Các service lắng nghe event `tenant.created` và tự seed data của mình
- Chạy cleanup job định kỳ (cron 1h) để:
  - Chuyển TRIAL tenant hết hạn sang SUSPENDED
  - Hard-delete TERMINATED tenant sau 30 ngày
- MinIO bucket creation qua storage-service event/command
- Soft-delete: set `isDeleted=true` và `deletedAt=now` trên tất cả collections của tenant
