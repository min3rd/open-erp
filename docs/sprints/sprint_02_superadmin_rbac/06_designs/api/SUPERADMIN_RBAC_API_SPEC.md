# [DES-02-API] Đặc Tả RESTful API: Super Admin Nền Tảng, Cơ Cấu Tổ Chức & Phân Quyền Đa Phạm Vi

- **Mã Tài Liệu**: DES-02-API
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Quy Chuẩn Hợp Đồng**: 100% Code-Based i18n Contract (Tuân thủ nghiêm ngặt 4 Khuôn Mẫu Chuẩn trong `api_standards.md`)
- **Ngày Hoàn Thành**: 2026-09-18

---

## 1. Quy Chuẩn Đóng Gói API Chung (API Response Envelope Invariant)

Toàn bộ các API trong tài liệu này bắt buộc tuân thủ 1 trong 4 khuôn mẫu chuẩn đã được quy định trong [.agents/rules/api_standards.md](../../../../../.agents/rules/api_standards.md):

### 1.1. Khuôn Mẫu 1: Dữ Liệu Đơn Lẻ (Single Resource)
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_LOCK_SUCCESS",
  "message": "Tenant locked successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "SUSPENDED"
  }
}
```

### 1.2. Khuôn Mẫu 2: Danh Sách Phân Trang (Paginated List)
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_LIST_SUCCESS",
  "message": "Tenant list retrieved successfully.",
  "params": {},
  "data": {
    "items": [ ... ],
    "page": 0,
    "size": 20,
    "total_items": 142,
    "total_pages": 8
  }
}
```

### 1.3. Khuôn Mẫu 3: Danh Sách Không Phân Trang (Non-Paginated List)
```json
{
  "success": true,
  "code": "ORGANIZATION_BRANCH_LIST_SUCCESS",
  "message": "Branch list retrieved successfully.",
  "params": {},
  "data": {
    "items": [ ... ]
  }
}
```

### 1.4. Khuôn Mẫu 4: Phản Hồi Lỗi Chuẩn Hóa (Error Response)
```json
{
  "success": false,
  "code": "ORGANIZATION_REPORTING_CYCLE_DETECTED",
  "message": "A circular reporting loop was detected in the management hierarchy.",
  "params": {
    "employee_id": "user-nv-uuid",
    "proposed_manager_id": "user-manager-uuid"
  },
  "errors": [
    {
      "field": "direct_manager_user_id",
      "code": "VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN",
      "params": {
        "cycle_with": "user-manager-uuid"
      }
    }
  ],
  "timestamp": "2026-09-18T10:30:00Z"
}
```

---

## 2. Hệ Thống Enums Chuẩn Hóa (Type-Safe Enums)

Các enum này được đồng bộ 1-1 giữa Backend Java (`com.vn9melody.openerp.common.enums`) và Frontend TypeScript (`@shared/enums`):

### 2.1. `DataScope.java` / `data-scope.enum.ts`
```typescript
export enum DataScope {
  ALL = 'ALL',                                     // Toàn bộ tenant
  BRANCH = 'BRANCH',                               // Cùng chi nhánh
  DEPARTMENT_AND_CHILDREN = 'DEPARTMENT_AND_CHILDREN', // Phòng ban và phòng ban con
  DEPARTMENT = 'DEPARTMENT',                       // Chỉ phòng ban trực tiếp
  OWN_AND_SUBORDINATES = 'OWN_AND_SUBORDINATES',   // Bản thân và cấp dưới theo tuyến báo cáo
  OWN_ONLY = 'OWN_ONLY',                           // Chỉ bản ghi do mình tạo/phụ trách
  NONE = 'NONE'                                    // Không có quyền
}
```

> **Ghi chú (BUG-50)**: `DataScope` Sprint 02 giữ đúng **7 giá trị** nêu trên. Các scope `ABAC` / `CUSTOM` (điều kiện động do người dùng tự định nghĩa) **thuộc Out-of-Scope Sprint 02** và sẽ được thiết kế bổ sung ở sprint sau; không thêm giá trị vào enum ở giai đoạn này.

### 2.2. `DataOperation.java` / `data-operation.enum.ts`
```typescript
export enum DataOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  SHARE = 'SHARE'
}
```

### 2.3. `PlatformAction.java` / `platform-action.enum.ts`
```typescript
export enum PlatformAction {
  TENANT_LOCK = 'TENANT_LOCK',
  TENANT_UNLOCK = 'TENANT_UNLOCK',
  TENANT_QUOTA_UPDATE = 'TENANT_QUOTA_UPDATE',
  USER_GLOBAL_LOCK = 'USER_GLOBAL_LOCK',
  USER_GLOBAL_UNLOCK = 'USER_GLOBAL_UNLOCK',
  USER_FORCE_PASSWORD_RESET = 'USER_FORCE_PASSWORD_RESET',
  USER_BREAK_GLASS_DISABLE_2FA = 'USER_BREAK_GLASS_DISABLE_2FA',
  IMPERSONATION_START = 'IMPERSONATION_START',
  IMPERSONATION_END = 'IMPERSONATION_END',
  PLATFORM_ADMIN_PASSWORD_CHANGED = 'PLATFORM_ADMIN_PASSWORD_CHANGED'
}
```

> **Cập nhật Wave 3 (2026-09-18)**: backend `PlatformAction` còn chứa các action audit bổ sung scope `PLATFORM` (`IMPERSONATION_TIMEOUT`, `PLUGIN_ACCESS_DENIED`, `PLATFORM_ADMIN_BOOTSTRAPPED`, `PLATFORM_ADMIN_GRANTED`, `PLATFORM_ADMIN_DISABLED`, `PLATFORM_ADMIN_ENABLED`, `PLATFORM_ADMIN_REVOKED`, `PLATFORM_ADMIN_PASSWORD_RESET_SENT`, `PLATFORM_ADMIN_2FA_DISABLED`) và scope `TENANT` (`IAM_*`, `ORG_*`) — nguồn chuẩn: `core/enums/PlatformAction.java`.

---

## 3. Nhóm API Quản Trị Nền Tảng (Super Admin: `/api/v1/platform/*`)

*Tất cả các API trong nhóm này yêu cầu Header: `Authorization: Bearer <token>` có **đồng thời** claim `platform_role: "SUPER_ADMIN"` và `groups` chứa `"SUPER_ADMIN"` (BUG-65 — Quarkus SmallRye JWT `@RolesAllowed` đọc roles từ claim `groups`; thiếu `groups` sẽ bị từ chối `401/403`).*

### 3.1. Danh Sách & Tìm Kiếm Tenant (Khuôn Mẫu 2: Paginated List)
- **Endpoint**: `GET /api/v1/platform/tenants`
- **Query Params**: `page` (default 0), `size` (default 20), `status` (ACTIVE, SUSPENDED, TRIAL), `keyword` (search slug, name, tax_code).
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_LIST_SUCCESS",
  "message": "Tenant list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "tenant_id": "e5b30000-0000-4000-a000-000000000001",
        "slug": "acme-corp",
        "name": "Tập Đoàn Acme",
        "type": "BUSINESS",
        "plan_tier": "STANDARD",
        "status": "ACTIVE",
        "max_users": 25,
        "active_users_count": 14,
        "max_storage_mb": 10240,
        "used_storage_mb": 1420,
        "trial_ends_at": null,
        "is_locked": false,
        "created_at": "2026-09-10T08:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

### 3.2. Cập Nhật Hạn Mức Tenant (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `PUT /api/v1/platform/tenants/{tenant_id}/quotas`
- **Request Body**:
```json
{
  "plan_tier": "ENTERPRISE",
  "max_users": 100,
  "max_storage_mb": 51200,
  "allowed_plugins": ["core", "sales", "accounting", "inventory", "crm"]
}
```
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_QUOTA_UPDATED",
  "message": "Tenant quota updated successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "plan_tier": "ENTERPRISE",
    "max_users": 100,
    "max_storage_mb": 51200
  }
}
```

### 3.3. Khóa Khẩn Cấp / Mở Khóa Tenant (Khuôn Mẫu 1: Single Resource)
Hai hành động được tách rõ ràng thành 2 endpoint và 2 mã phản hồi riêng biệt (BUG-62):
- **Endpoint khóa**: `POST /api/v1/platform/tenants/{tenant_id}/lock` — mã `PLATFORM_TENANT_LOCK_SUCCESS`
- **Endpoint mở khóa**: `POST /api/v1/platform/tenants/{tenant_id}/unlock` — mã `PLATFORM_TENANT_UNLOCK_SUCCESS`
- **Request Body (lock)**:
```json
{
  "reason": "Chưa thanh toán cước phí dịch vụ quý 3/2026",
  "confirm_password": "superadmin-secret-password"
}
```
- **Request Body (unlock)**:
```json
{
  "confirm_password": "superadmin-secret-password"
}
```
- **Phản Hồi Thành Công (200 OK) — Lock**:
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_LOCK_SUCCESS",
  "message": "Tenant locked successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "SUSPENDED",
    "is_locked": true,
    "locked_at": "2026-09-18T10:15:00Z"
  }
}
```
- **Phản Hồi Thành Công (200 OK) — Unlock**:
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_UNLOCK_SUCCESS",
  "message": "Tenant unlocked successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "ACTIVE",
    "is_locked": false,
    "locked_at": null
  }
}
```
- **Chặn tự khóa**: Super Admin cố khóa chính mình (hoặc tenant sở hữu tài khoản mình) $\rightarrow$ `403` `PLATFORM_SELF_LOCK_FORBIDDEN`.

### 3.4. Khởi Tạo Phiên Truy Cập Đại Diện (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `POST /api/v1/platform/tenants/{tenant_id}/impersonate`
- **Quy tắc chọn `target_user_id` (BUG-57)**: Request có thể truyền `target_user_id` (tùy chọn). Nếu bỏ trống, hệ thống tự chọn: (1) `TENANT_OWNER`, (2) fallback `TENANT_ADMIN` đầu tiên theo `assigned_at`; nếu không có $\rightarrow$ `400` `PLATFORM_IMPERSONATION_TARGET_NOT_FOUND`. `target_user_id` phải thuộc đúng tenant và có membership hợp lệ.
- **Request Body**:
```json
{
  "target_user_id": "user-owner-uuid",
  "support_ticket": "TCK-9981",
  "reason": "Khách hàng báo lỗi không xem được báo cáo doanh thu tuần",
  "confirm_password": "superadmin-secret-password"
}
```
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_IMPERSONATION_STARTED",
  "message": "Impersonation session started successfully.",
  "params": {},
  "data": {
    "impersonation_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in_seconds": 1800,
    "target_tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "target_tenant_name": "Tập Đoàn Acme",
    "target_user_id": "user-owner-uuid",
    "target_user_email": "owner@acme-corp.vn",
    "started_at": "2026-09-18T10:20:00Z"
  }
}
```

### 3.5. Kết Thúc Phiên Đại Diện (Khuôn Mẫu 1: Single Resource - Data Null)
- **Endpoint**: `POST /api/v1/platform/impersonate/exit`
- **Header**: `Authorization: Bearer <impersonation_token>`
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_IMPERSONATION_ENDED",
  "message": "Impersonation session ended successfully.",
  "params": {},
  "data": null
}
```

### 3.6. Giám Sát Sức Khỏe Hạ Tầng (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `GET /api/v1/platform/health`
- **Enum `system_status` (BUG-64)**: `HEALTHY | DEGRADED | DOWN` (đồng bộ enum Java `SystemHealthStatus` và TypeScript `@shared/enums`). Trạng thái từng subsystem có thể là `UP | DOWN | UNKNOWN`.
  - `HEALTHY`: mọi thành phần bắt buộc đều UP.
  - `DEGRADED`: thành phần bắt buộc (PostgreSQL Primary, Redis) vẫn UP nhưng có thành phần tùy chọn DOWN/UNKNOWN (ví dụ Kafka không bật ở hồ sơ minimal).
  - `DOWN`: thành phần bắt buộc DOWN.
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_HEALTH_CHECK_SUCCESS",
  "message": "Infrastructure health check retrieved successfully.",
  "params": {},
  "data": {
    "system_status": "HEALTHY",
    "database": {
      "primary": "UP",
      "replica": "UP",
      "replication_lag_ms": 12,
      "active_connections": 18,
      "max_connections": 100
    },
    "redis": {
      "status": "UP",
      "used_memory_human": "42.5MB",
      "connected_clients": 24
    },
    "kafka": {
      "status": "UP",
      "cluster_id": "k-cluster-dev",
      "nodes_count": 1
    },
    "platform_metrics": {
      "total_tenants": 142,
      "active_tenants": 138,
      "suspended_tenants": 4,
      "total_users": 1850,
      "active_sessions_now": 210
    }
  }
}
```
- **Ví dụ khi chạy hồ sơ dev tối giản (không bật Kafka profile, BUG-64)**: `system_status = "DEGRADED"` và `"kafka": { "status": "UNKNOWN", "cluster_id": null, "nodes_count": 0 }`.

### 3.7. Nhật Ký Kiểm Toán Nền Tảng (Khuôn Mẫu 2: Paginated List)
- **Endpoint**: `GET /api/v1/platform/audit-logs`
- **Query Params**: `page`, `size`, `action`, `tenant_id`, `from_date`, `to_date`, `scope` (PLATFORM/TENANT), `result` (SUCCESS/DENIED/FAILED), `actor_user_id`, `resource_type`, `keyword` (tìm trong `details` JSONB).
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_AUDIT_LOG_LIST_SUCCESS",
  "message": "Audit logs retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "log_id": "log-0001",
        "event_id": "evt-0001",
        "scope": "TENANT",
        "tenant_id": "tenant-uuid",
        "actor_user_id": "admin-uuid",
        "actor_type": "USER",
        "actor_email": "admin@acme-corp.vn",
        "action": "IAM_ROLE_DATA_POLICY_UPDATE",
        "resource_type": "ROLE",
        "resource_id": "role-uuid",
        "target_tenant_id": "tenant-uuid",
        "target_tenant_name": "Tập Đoàn Acme",
        "result": "SUCCESS",
        "correlation_id": "corr-uuid",
        "entry_hash": "9f2c8d1a0b77e4f3c5a6d8e0f1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e",
        "details": {
          "before": { "read_scope": "OWN_ONLY" },
          "after": { "read_scope": "BRANCH" },
          "reason": "Chuẩn hóa quyền xem đơn hàng theo chi nhánh",
          "extra": {}
        },
        "ip_address": "118.70.12.34",
        "created_at": "2026-09-18T10:15:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```
- **Tra cứu Tenant-scope (BUG-72)**: truyền `scope = TENANT` (+ tùy chọn `tenant_id`) để xem audit quản trị tenant. Màn hình cho Tenant Admin **deferred Sprint sau**; Sprint 02 chỉ xem qua Platform API.

### 3.7.1. Chi Tiết Bản Ghi Kiểm Toán (Khuôn Mẫu 1: Single Resource — BUG-72)
- **Endpoint**: `GET /api/v1/platform/audit-logs/{id}` — `id` là khóa kỹ thuật `id` hoặc `event_id` của bản ghi.
- Trả về **đầy đủ** `details` (`before`/`after`/`reason`/`extra`) + `prev_hash`/`entry_hash` để đối soát toàn vẹn chuỗi (khối "Chuỗi toàn vẹn" trên Drawer).
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_AUDIT_LOG_DETAIL_SUCCESS",
  "message": "Audit log detail retrieved successfully.",
  "params": {},
  "data": {
    "log_id": "log-0001",
    "event_id": "evt-0001",
    "scope": "TENANT",
    "tenant_id": "tenant-uuid",
    "actor_user_id": "admin-uuid",
    "actor_type": "USER",
    "actor_email": "admin@acme-corp.vn",
    "action": "IAM_ROLE_DATA_POLICY_UPDATE",
    "resource_type": "ROLE",
    "resource_id": "role-uuid",
    "target_tenant_id": "tenant-uuid",
    "target_user_id": null,
    "result": "SUCCESS",
    "correlation_id": "corr-uuid",
    "details": {
      "before": { "read_scope": "OWN_ONLY" },
      "after": { "read_scope": "BRANCH" },
      "reason": "Chuẩn hóa quyền xem đơn hàng theo chi nhánh",
      "extra": {}
    },
    "ip_address": "118.70.12.34",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "prev_hash": "3b7d1c9e5f0a2b4d6c8e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e",
    "entry_hash": "9f2c8d1a0b77e4f3c5a6d8e0f1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e",
    "created_at": "2026-09-18T10:15:00Z"
  }
}
```
- Không tìm thấy `id`/`event_id` → `404 Not Found` (Khuôn Mẫu 4), mã `PLATFORM_AUDIT_LOG_NOT_FOUND`.

### 3.8. Chi Tiết Tenant (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `GET /api/v1/platform/tenants/{tenant_id}`
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_DETAIL_SUCCESS",
  "message": "Tenant detail retrieved successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "slug": "acme-corp",
    "name": "Tập Đoàn Acme",
    "type": "BUSINESS",
    "plan_tier": "STANDARD",
    "status": "ACTIVE",
    "max_users": 25,
    "active_users_count": 14,
    "max_storage_mb": 10240,
    "used_storage_mb": 1420,
    "trial_ends_at": null,
    "is_locked": false,
    "lock_reason": null,
    "locked_at": null,
    "allowed_plugins": ["core", "sales"],
    "created_at": "2026-09-10T08:00:00Z"
  }
}
```

### 3.9. Quản Lý Người Dùng Toàn Cầu (Khuôn Mẫu 2 & 1)
- `GET /api/v1/platform/users` — **Khuôn Mẫu 2 (Paginated List)**:
  - Query Params: `page`, `size`, `status`, `keyword` (email, full_name), `tenant_id`.
  - Phản hồi (200 OK): `code = "PLATFORM_USER_LIST_SUCCESS"`, `data.items[]` gồm `user_id`, `email`, `full_name`, `status`, `tenant_id`, `tenant_name`, `last_login_at`, `is_2fa_enabled`; kèm `page`, `size`, `total_items`, `total_pages`.
- `POST /api/v1/platform/users/{id}/lock` — **Khuôn Mẫu 1**, mã `PLATFORM_USER_LOCKED_SUCCESS`, response `{ "user_id": "...", "status": "LOCKED", "locked_at": "..." }`. Tự khóa chính mình $\rightarrow$ `403` `PLATFORM_SELF_LOCK_FORBIDDEN`.
- `POST /api/v1/platform/users/{id}/unlock` — **Khuôn Mẫu 1**, mã `PLATFORM_USER_UNLOCKED_SUCCESS`, response `{ "user_id": "...", "status": "ACTIVE" }`.
- `POST /api/v1/platform/users/{id}/force-password-reset` — **Khuôn Mẫu 1**, mã `PLATFORM_USER_PASSWORD_RESET_FORCED`, response `{ "user_id": "...", "reset_token_sent": true }`.
- `POST /api/v1/platform/users/{id}/break-glass/disable-2fa` — **Khuôn Mẫu 1**, mã `PLATFORM_USER_2FA_DISABLED_BY_BREAK_GLASS`; bắt buộc kèm `support_ticket` + `confirm_password`, ghi `platform_audit_logs` và gửi email thông báo cho user (TASK-273).

### 3.10. Nhật Ký Phiên Đại Diện (Khuôn Mẫu 2: Paginated List)
- **Endpoint**: `GET /api/v1/platform/impersonation-logs`
- **Query Params**: `page`, `size`, `super_admin_user_id`, `tenant_id`, `status` (STARTED, ENDED, TIMEOUT), `from_date`, `to_date`.
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_IMPERSONATION_LOG_LIST_SUCCESS",
  "message": "Impersonation logs retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "log_id": "imp-log-0001",
        "super_admin_user_id": "super-admin-uuid",
        "super_admin_email": "ops-admin@openerp.9ms.io.vn",
        "target_tenant_id": "tenant-uuid",
        "target_user_id": "user-owner-uuid",
        "support_ticket": "TCK-9981",
        "status": "ENDED",
        "started_at": "2026-09-18T10:20:00Z",
        "ended_at": "2026-09-18T10:45:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

### 3.12. Quản Trị Tài Khoản Super Admin (FEAT-18, TASK-294)

*Nhóm API này chỉ dành cho `SUPER_ADMIN` (SUPPORT_ENGINEER bị từ chối `403 PLATFORM_ACCESS_DENIED`). **Không tồn tại endpoint công khai/tự đăng ký** cấp quyền Super Admin — quyền chỉ được cấp qua bootstrap first-run (TASK-274), Platform API (mục này) hoặc CLI (TASK-295).*

- `GET /api/v1/platform/admins` — **Khuôn Mẫu 3 (Non-Paginated List)**:
  - **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_ADMIN_LIST_SUCCESS",
  "message": "Platform admin list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "admin_id": "pa-0001",
        "user_id": "b2c9a101-0000-4000-a000-000000000001",
        "email": "ops-admin@openerp.9ms.io.vn",
        "full_name": "Platform Operations Admin",
        "role": "SUPER_ADMIN",
        "status": "ACTIVE",
        "must_change_password": false,
        "two_factor_required": true,
        "is_2fa_enabled": true,
        "last_login_at": "2026-09-18T09:00:00Z",
        "disabled_at": null,
        "created_at": "2026-09-01T08:00:00Z"
      }
    ]
  }
}
```

- `POST /api/v1/platform/admins` — **201 Created**, **Khuôn Mẫu 1 (Single Resource)**:
  - **Request Body**:
```json
{
  "email": "cto@openerp.9ms.io.vn",
  "role": "SUPER_ADMIN",
  "full_name": "Chief Technology Officer"
}
```
  - **Quy tắc**:
    - `role` ∈ `SUPER_ADMIN`, `SUPPORT_ENGINEER`.
    - User **chưa tồn tại** → tạo user nền tảng (`tenant_id = NULL`, `status = ACTIVE`, `email_verified = TRUE`), trạng thái admin `INVITED`, gửi email invitation → mã `PLATFORM_ADMIN_INVITATION_SENT`.
    - User **đã tồn tại** → nâng cấp/gán quyền trên tài khoản hiện hữu (không tạo trùng user), trạng thái `ACTIVE` → mã `PLATFORM_ADMIN_GRANTED`.
    - Bản ghi đã tồn tại (kể cả `REVOKED`) được cập nhật (upsert theo `uq_platform_admin_user`), không tạo bản ghi thứ hai.
  - **Phản Hồi Thành Công (201 Created)**:
```json
{
  "success": true,
  "code": "PLATFORM_ADMIN_GRANTED",
  "message": "Platform admin granted successfully.",
  "params": {},
  "data": {
    "admin_id": "pa-0002",
    "user_id": "user-cto-uuid",
    "email": "cto@openerp.9ms.io.vn",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "must_change_password": true,
    "two_factor_required": true
  }
}
```

- `POST /api/v1/platform/admins/{id}/disable` — **Khuôn Mẫu 1 (Single Resource)**:
  - **Request Body**: `{ "reason": "Nhân sự nghỉ việc từ 30/09/2026", "confirm_password": "superadmin-secret-password" }`
  - **Nội dung xử lý**: chuyển `status = 'DISABLED'`, `is_active = FALSE`, cập nhật `disabled_at`/`disabled_by`, thu hồi toàn bộ session Redis + blacklist token, gửi email cảnh báo, audit `PLATFORM_ADMIN_DISABLED`.
  - **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "PLATFORM_ADMIN_DISABLED",
  "message": "Platform admin disabled successfully.",
  "params": {},
  "data": {
    "admin_id": "pa-0002",
    "status": "DISABLED",
    "disabled_at": "2026-09-18T11:00:00Z"
  }
}
```
  - **Lỗi**:
    - Tự disable chính mình → `403` (Khuôn Mẫu 4), mã `PLATFORM_SELF_DISABLE_FORBIDDEN`.
    - Disable SUPER_ADMIN `ACTIVE` cuối cùng → `409` (Khuôn Mẫu 4), mã `PLATFORM_LAST_ADMIN_PROTECTED`.

- `POST /api/v1/platform/admins/{id}/enable` — **Khuôn Mẫu 1**, mã `PLATFORM_ADMIN_ENABLED`, response `{ "admin_id": "...", "status": "ACTIVE" }`.
- `DELETE /api/v1/platform/admins/{id}` — **Khuôn Mẫu 1**, mã `PLATFORM_ADMIN_REVOKED`, response `{ "admin_id": "...", "status": "REVOKED" }`; guard `PLATFORM_SELF_DISABLE_FORBIDDEN` (tự thu hồi) và `PLATFORM_LAST_ADMIN_PROTECTED` (admin cuối) áp dụng tương tự disable.
- `POST /api/v1/platform/admins/{id}/reset-password` — **Khuôn Mẫu 1**, mã `PLATFORM_ADMIN_PASSWORD_RESET_SENT`, response `{ "admin_id": "...", "reset_token_sent": true }`; đặt `must_change_password = TRUE`.
- `POST /api/v1/platform/admins/{id}/disable-2fa` — **Khuôn Mẫu 1** (break-glass), mã `PLATFORM_ADMIN_2FA_DISABLED`; bắt buộc kèm `support_ticket` + `reason` + `confirm_password`, ghi `platform_audit_logs` mức Critical và gửi email thông báo.

- **Ghi chú chung**: chỉ SUPER_ADMIN; disable/revoke **không áp dụng cho chính mình**; mọi thao tác (kể cả bị từ chối) đều ghi `platform_audit_logs` `scope = 'PLATFORM'` với `action` tương ứng và `actor_type` là `SUPER_ADMIN` hoặc `CLI` (TASK-295).

### 3.13. Luồng Bắt Buộc Đổi Mật Khẩu Platform Admin (`must_change_password`, TASK-294)

*Áp dụng cho platform admin ở trạng thái `INVITED` (được mời/cấp qua bootstrap/API/CLI) cho tới khi hoàn tất đổi mật khẩu lần đầu.*

1. **Đăng nhập**: platform admin đăng nhập qua `POST /api/v1/auth/login` → nhận platform token kèm claim `must_change_password = true` (và `scope = PLATFORM`, `platform_role`).
2. **Bị chặn (fail-closed)**: mọi endpoint `/api/v1/platform/**` trả `403` (Khuôn Mẫu 4) mã `PLATFORM_PASSWORD_CHANGE_REQUIRED`. Trên bề mặt `/api/v1/account/**`, allowlist chỉ cho đúng 2 endpoint đi qua:
   - `POST /api/v1/account/change-password`
   - `GET /api/v1/account/profile`

   Mọi endpoint account khác cũng trả `403 PLATFORM_PASSWORD_CHANGE_REQUIRED` (token tenant/impersonation không bị ảnh hưởng).
3. **Đổi mật khẩu**: `POST /api/v1/account/change-password` thành công → `AccountService` clear cờ `must_change_password = FALSE`, đồng thời kích hoạt admin `INVITED` → `ACTIVE`, và ghi audit `PlatformAction.PLATFORM_ADMIN_PASSWORD_CHANGED` (scope `PLATFORM`).
4. **Sau đó**: token cũ vẫn mang claim `must_change_password = true` nên tiếp tục bị chặn; đăng nhập lại để nhận token mới và truy cập `/api/v1/platform/**` bình thường.
- **Kiểm chứng (Wave 3, 2026-09-18)**: `PlatformPasswordChangeFlowTest` (PostgreSQL + Redis thật) — login → 403 → đổi mật khẩu → cờ false + audit → truy cập lại thành công; full `mvn test` **178/178 PASS**.

---

## 4. Nhóm API Cơ Cấu Tổ Chức Doanh Nghiệp (`/api/v1/organization/*`)

*Tất cả API nhóm này yêu cầu Context Tenant của người dùng*.

### 4.1. Quản Lý Chi Nhánh (Khuôn Mẫu 3: Non-Paginated List & Khuôn Mẫu 1: Single Resource)
- `GET /api/v1/organization/branches`: Lấy danh sách chi nhánh.
  - **Phản hồi (200 OK)**:
    ```json
    {
      "success": true,
      "code": "ORGANIZATION_BRANCH_LIST_SUCCESS",
      "message": "Branches retrieved successfully.",
      "params": {},
      "data": {
        "items": [
          {
            "id": "br-hn-uuid",
            "code": "BR-HN",
            "name": "Chi nhánh Hà Nội",
            "phone": "0243123456",
            "status": "ACTIVE"
          }
        ]
      }
    }
    ```
- `POST /api/v1/organization/branches`: Tạo chi nhánh mới.
  - Body: `{ "code": "BR-HN", "name": "Chi nhánh Hà Nội", "phone": "0243123456", "address": "Hà Nội" }`
  - **Phản hồi (201 Created)**: Khuôn Mẫu 1 (Single Resource) trả về `{ "success": true, "code": "ORGANIZATION_BRANCH_CREATED_SUCCESS", "message": "Branch created successfully.", "params": {}, "data": { ... } }` (BUG-70 — mọi endpoint tạo mới trả `201 Created`).
- `PUT /api/v1/organization/branches/{id}`: Cập nhật chi nhánh — Khuôn Mẫu 1, mã `ORGANIZATION_BRANCH_UPDATED`.
- `DELETE /api/v1/organization/branches/{id}`: Xóa chi nhánh — Khuôn Mẫu 1, mã `ORGANIZATION_BRANCH_DELETED`; **chặn xóa nếu đang được sử dụng** (còn membership, phòng ban hoặc dữ liệu nghiệp vụ tham chiếu) $\rightarrow$ `409 Conflict` `ORGANIZATION_BRANCH_IN_USE`.

### 4.2. Quản Lý Cây Phòng Ban (Khuôn Mẫu 3: Non-Paginated List)
- `GET /api/v1/organization/departments/tree`: Lấy toàn bộ cây phòng ban (Nested tree).
  - **Phản hồi (200 OK)**:
    ```json
    {
      "success": true,
      "code": "ORGANIZATION_DEPARTMENT_TREE_SUCCESS",
      "message": "Department hierarchy retrieved successfully.",
      "params": {},
      "data": {
        "items": [
          {
            "id": "dept-kd-root-uuid",
            "code": "KD",
            "name": "Khối Kinh Doanh",
            "children": [
              {
                "id": "dept-kd-b2b-uuid",
                "code": "KD-B2B",
                "name": "Phòng Kinh Doanh Dự Án B2B",
                "children": []
              }
            ]
          }
        ]
      }
    }
    ```
- `POST /api/v1/organization/departments`: Tạo phòng ban mới — **Phản hồi (201 Created)**, Khuôn Mẫu 1, mã `ORGANIZATION_DEPARTMENT_CREATED_SUCCESS`.
  - Body:
    ```json
    {
      "code": "KD-B2B",
      "name": "Phòng Kinh Doanh Dự Án B2B",
      "branch_id": "br-hn-uuid",
      "parent_id": "dept-kd-root-uuid",
      "manager_user_id": "user-manager-uuid"
    }
    ```
- `PUT /api/v1/organization/departments/{id}`: Sửa thông tin phòng ban — Khuôn Mẫu 1, mã `ORGANIZATION_DEPARTMENT_UPDATED`.
- `DELETE /api/v1/organization/departments/{id}`: Xóa phòng ban — Khuôn Mẫu 1, mã `ORGANIZATION_DEPARTMENT_DELETED`; chặn nếu còn phòng ban con hoặc membership $\rightarrow$ `409 Conflict` `ORGANIZATION_DEPARTMENT_IN_USE`.
- `PUT /api/v1/organization/departments/{id}/move`: Di chuyển phòng ban sang cây cha mới (TASK-279).
  - Body: `{ "new_parent_id": "dept-kd-retail-uuid" }`
  - Thực hiện **cycle detection** trên cây phòng ban trước khi cập nhật; nếu tạo vòng lặp $\rightarrow$ `400` Khuôn Mẫu 4, mã `ORGANIZATION_DEPARTMENT_CYCLE_DETECTED`.
  - Thành công: Khuôn Mẫu 1, mã `ORGANIZATION_DEPARTMENT_MOVED`.

### 4.3. Gán Thành Viên & Thiết Lập Quản Lý Trực Tiếp
- `POST /api/v1/organization/memberships`: Gán nhân viên vào phòng ban — **Phản hồi (201 Created)**, Khuôn Mẫu 1, mã `ORGANIZATION_MEMBERSHIP_CREATED`.
  - Body:
    ```json
    {
      "user_id": "user-nv-uuid",
      "branch_id": "br-hn-uuid",
      "department_id": "dept-kd-b2b-uuid",
      "direct_manager_user_id": "user-manager-uuid",
      "title": "Chuyên viên bán hàng dự án",
      "is_primary": true
    }
    ```
- `GET /api/v1/organization/memberships`: Danh sách thành viên — Khuôn Mẫu 3 (Non-Paginated), mã `ORGANIZATION_MEMBERSHIP_LIST_SUCCESS`.
- `PUT /api/v1/organization/memberships/{id}`: Cập nhật chi nhánh/phòng ban/quản lý trực tiếp — Khuôn Mẫu 1, mã `ORGANIZATION_MEMBERSHIP_UPDATED`.
- `DELETE /api/v1/organization/memberships/{id}`: Gỡ thành viên khỏi tổ chức — Khuôn Mẫu 1 (data null), mã `ORGANIZATION_MEMBERSHIP_REMOVED`.
- **Xử lý lỗi phát hiện vòng lặp (Khuôn Mẫu 4: Error Response - 400 Bad Request)**:
```json
{
  "success": false,
  "code": "ORGANIZATION_REPORTING_CYCLE_DETECTED",
  "message": "A circular reporting loop was detected in the management hierarchy.",
  "params": {
    "employee_id": "user-nv-uuid",
    "proposed_manager_id": "user-manager-uuid"
  },
  "errors": [
    {
      "field": "direct_manager_user_id",
      "code": "VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN",
      "params": {
        "cycle_with": "user-manager-uuid"
      }
    }
  ],
  "timestamp": "2026-09-18T10:30:00Z"
}
```

### 4.4. Phân Công Quản Lý Chi Nhánh (Branch Assignments) (BUG-71, TASK-287 → TASK-290)
Bộ API quản lý `user_branch_assignments` — nguồn của `managed_branch_ids`, tách biệt khỏi membership thành viên (BR-RBAC-08, BR-RBAC-09).
- `GET /api/v1/organization/branch-assignments` — **Khuôn Mẫu 3 (Non-Paginated List)**:
  - Query Params (tùy chọn): `user_id`, `branch_id`.
  - **Phản hồi (200 OK)**: `code = "ORGANIZATION_BRANCH_ASSIGNMENT_LIST_SUCCESS"`, `data.items[]` gồm `id`, `user_id`, `user_email`, `branch_id`, `branch_code`, `is_primary`, `can_manage`.
- `POST /api/v1/organization/branch-assignments` — **201 Created**, **Khuôn Mẫu 1 (Single Resource)**, mã `ORGANIZATION_BRANCH_ASSIGNMENT_CREATED`:
  ```json
  {
    "user_id": "user-hcm-uuid",
    "branch_id": "br-hcm-uuid",
    "is_primary": false,
    "can_manage": true
  }
  ```
- `PUT /api/v1/organization/branch-assignments/{id}`: Cập nhật `can_manage`/`is_primary` — Khuôn Mẫu 1, mã `ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED`.
- `DELETE /api/v1/organization/branch-assignments/{id}`: Thu hồi phân công — Khuôn Mẫu 1 (data null), mã `ORGANIZATION_BRANCH_ASSIGNMENT_REMOVED`.
- **Quy tắc `is_primary`**: khi lưu với `is_primary = true`, hệ thống tự động gỡ cờ primary cũ của user để đảm bảo tối đa 1 primary (BR-RBAC-09). Xóa phân công primary bị chặn nếu user chưa có primary khác $\rightarrow$ `409 Conflict` `ORGANIZATION_PRIMARY_BRANCH_REQUIRED`.
- **Cache**: mọi thay đổi phát `BranchAssignmentChangedEvent` → vô hiệu hóa `sec:ctx:{tenant_id}:{user_id}` tức thì (SOL-02 §6).

---

## 5. Nhóm API Phân Quyền Chức Năng & Dữ Liệu (`/api/v1/iam/*`)

### 5.1. Danh Mục Quyền Hệ Thống (Khuôn Mẫu 3: Non-Paginated List)
- **Endpoint**: `GET /api/v1/iam/permissions`
- **Phản Hồi (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_PERMISSION_LIST_SUCCESS",
  "message": "Permission list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "id": "p-01",
        "code": "core:user:create",
        "domain": "core",
        "resource": "user",
        "action": "create",
        "description_key": "PERM_CORE_USER_CREATE"
      },
      {
        "id": "p-02",
        "code": "sales:order:read",
        "domain": "sales",
        "resource": "order",
        "action": "read",
        "description_key": "PERM_SALES_ORDER_READ"
      }
    ]
  }
}
```

### 5.2. Quản Lý Vai Trò (Roles - Khuôn Mẫu 3 & 1)
- `GET /api/v1/iam/roles`: Danh sách vai trò trong Tenant (kèm số user gán và cờ `is_system`).
  - **Phản hồi (200 OK)**:
    ```json
    {
      "success": true,
      "code": "IAM_ROLE_LIST_SUCCESS",
      "message": "Role list retrieved successfully.",
      "params": {},
      "data": {
        "items": [
          {
            "id": "role-uuid-1",
            "code": "TENANT_OWNER",
            "name": "Chủ Sở Hữu Doanh Nghiệp",
            "is_system": true,
            "assigned_users_count": 1
          },
          {
            "id": "role-uuid-2",
            "code": "SALES_LEAD",
            "name": "Trưởng Nhóm Kinh Doanh",
            "is_system": false,
            "assigned_users_count": 4
          }
        ]
      }
    }
    ```
- `POST /api/v1/iam/roles`: Tạo vai trò tùy biến mới.
  - Body: `{ "code": "SALES_LEAD", "name": "Trưởng Nhóm Kinh Doanh", "description": "Quản lý doanh số tổ" }`
  - **Phản hồi (201 Created)**: Khuôn Mẫu 1 (Single Resource), mã `IAM_ROLE_CREATED`.
- `PUT /api/v1/iam/roles/{id}`: Cập nhật tên/mô tả vai trò — Khuôn Mẫu 1, mã `IAM_ROLE_UPDATED`.
- `DELETE /api/v1/iam/roles/{id}`: Xóa vai trò — chặn nếu còn user được gán $\rightarrow$ `409 Conflict` `IAM_ROLE_IN_USE`; thành công trả Khuôn Mẫu 1, mã `IAM_ROLE_DELETED`.

### 5.3. Gán Quyền Chức Năng Cho Vai Trò (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `PUT /api/v1/iam/roles/{role_id}/permissions`
- **Request Body**:
```json
{
  "permission_ids": ["p-01", "p-02", "p-05", "p-09"]
}
```
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_ROLE_PERMISSIONS_UPDATED",
  "message": "Role permissions updated successfully.",
  "params": {},
  "data": {
    "role_id": "role-uuid",
    "total_permissions_granted": 4
  }
}
```

#### 5.3.1. Truy Vấn Quyền Chức Năng Của Vai Trò (Khuôn Mẫu 3: Non-Paginated List)
> *(Bổ sung 2026-09-18 theo yêu cầu FE — màn gán quyền cần đọc trạng thái tích chọn hiện tại.)*

- **Endpoint**: `GET /api/v1/iam/roles/{id}/permissions`
- **Phản Hồi (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_ROLE_PERMISSIONS_SUCCESS",
  "message": "Role permissions retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "permission_id": "p-01",
        "code": "core:user:create",
        "domain": "core",
        "resource": "user",
        "action": "create",
        "description_key": "PERM_CORE_USER_CREATE",
        "granted_at": "2026-09-18T09:00:00Z"
      }
    ]
  }
}
```
- **Ghi chú**: chỉ trả các quyền đã gán cho vai trò; FE đối chiếu với `GET /api/v1/iam/permissions` để hiển thị lưới switch.

### 5.4. Cấu Hình Ma Trận Quyền Dữ Liệu (Role Data Policies - Khuôn Mẫu 3: Non-Paginated List)
- **Endpoint**: `GET /api/v1/iam/roles/{role_id}/data-policies`
- **Phản Hồi (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_ROLE_DATA_POLICIES_SUCCESS",
  "message": "Role data policies retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "role_id": "role-uuid",
        "resource": "SALE_ORDER",
        "create_scope": "BRANCH",
        "read_scope": "OWN_AND_SUBORDINATES",
        "update_scope": "OWN_ONLY",
        "delete_scope": "NONE",
        "export_scope": "NONE",
        "share_scope": "DEPARTMENT"
      },
      {
        "role_id": "role-uuid",
        "resource": "CUSTOMER",
        "create_scope": "BRANCH",
        "read_scope": "BRANCH",
        "update_scope": "OWN_ONLY",
        "delete_scope": "NONE",
        "export_scope": "NONE",
        "share_scope": "BRANCH"
      }
    ]
  }
}
```

- **Endpoint**: `PUT /api/v1/iam/roles/{role_id}/data-policies`
- **Request Body**:
```json
{
  "policies": [
    {
      "resource": "SALE_ORDER",
      "create_scope": "BRANCH",
      "read_scope": "OWN_AND_SUBORDINATES",
      "update_scope": "OWN_ONLY",
      "delete_scope": "NONE",
      "export_scope": "NONE",
      "share_scope": "DEPARTMENT"
    }
  ]
}
```
- **Phản Hồi (200 OK)**: Khuôn Mẫu 1 (Single Resource)
```json
{
  "success": true,
  "code": "IAM_ROLE_DATA_POLICIES_UPDATED",
  "message": "Role data policies updated successfully.",
  "params": {},
  "data": {
    "role_id": "role-uuid",
    "updated_count": 1
  }
}
```

### 5.5. Gán Vai Trò Cho Người Dùng (Khuôn Mẫu 1: Single Resource)
- **Endpoint**: `POST /api/v1/iam/users/{user_id}/roles`
- **Request Body**:
```json
{
  "role_ids": ["role-uuid-1", "role-uuid-2"]
}
```
- **Phản Hồi (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_USER_ROLES_ASSIGNED",
  "message": "User roles assigned successfully.",
  "params": {},
  "data": {
    "user_id": "user-uuid",
    "assigned_roles_count": 2
  }
}
```

### 5.6. Truy Vấn & Gỡ Vai Trò Của Người Dùng (Khuôn Mẫu 3 & 1)
- `GET /api/v1/iam/users/{user_id}/roles` — **Khuôn Mẫu 3 (Non-Paginated List)**:
```json
{
  "success": true,
  "code": "IAM_USER_ROLE_LIST_SUCCESS",
  "message": "User roles retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "role_id": "role-uuid-1",
        "code": "TENANT_OWNER",
        "name": "Chủ Sở Hữu Doanh Nghiệp",
        "is_system": true,
        "assigned_at": "2026-09-10T08:00:00Z"
      }
    ]
  }
}
```
- `DELETE /api/v1/iam/users/{user_id}/roles/{role_id}` — **Khuôn Mẫu 1**, mã `IAM_USER_ROLE_REMOVED`; chặn gỡ vai trò hệ thống bắt buộc cuối cùng (ví dụ `TENANT_OWNER`) $\rightarrow$ `409 Conflict` `IAM_USER_ROLE_REQUIRED`.

### 5.7. Danh Mục Nguồn Dữ Liệu Phân Quyền (Data Resources — TASK-282)
- **Endpoint**: `GET /api/v1/iam/data-resources` — **Khuôn Mẫu 3 (Non-Paginated List)**
- **Nguồn dữ liệu**: **Entity Registry** (TASK-276), liệt kê các entity đã đăng ký được áp dụng phân quyền dữ liệu (bao gồm `core_sample_records` của plugin core).
```json
{
  "success": true,
  "code": "IAM_DATA_RESOURCE_LIST_SUCCESS",
  "message": "Data resource list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "resource": "CORE_SAMPLE_RECORD",
        "entity_class": "CoreSampleRecord",
        "table_name": "core_sample_records",
        "plugin": "core",
        "supports_assignee": true
      }
    ]
  }
}
```

### 5.8. Reference Entity — `core_sample_records` (FEAT-17)
Bộ endpoint thực nghiệm chứng minh Data Permission Enforcement Engine hoạt động đầu-cuối:
- `POST /api/v1/core/sample-records` — **201 Created**, Khuôn Mẫu 1, mã `CORE_SAMPLE_RECORD_CREATED`. Áp dụng bảng quy tắc `CREATE` theo scope (SOL-02 §4).
- `GET /api/v1/core/sample-records` — **Khuôn Mẫu 2 (Paginated List)**, mã `CORE_SAMPLE_RECORD_LIST_SUCCESS`; dữ liệu tự động lọc theo `read_scope` qua Hibernate `@Filter` + `Session.enableFilter`.
- `PUT /api/v1/core/sample-records/{id}` — Khuôn Mẫu 1, mã `CORE_SAMPLE_RECORD_UPDATED`; kiểm tra tường minh `canMutate(record, UPDATE)`.
- `DELETE /api/v1/core/sample-records/{id}` — Khuôn Mẫu 1, mã `CORE_SAMPLE_RECORD_DELETED`; kiểm tra `canMutate(record, DELETE)`. Vi phạm phạm vi $\rightarrow$ `403` `IAM_PERMISSION_DENIED_DATA_SCOPE`.
- `POST /api/v1/core/sample-records/export` — Khuôn Mẫu 1 (trả metadata file), mã `CORE_SAMPLE_RECORD_EXPORTED`; nếu `export_scope = NONE` $\rightarrow$ `403` `IAM_PERMISSION_DENIED_EXPORT`.

### 5.9. Danh Bạ Người Dùng Trong Tenant (Khuôn Mẫu 2: Paginated List)
> *(Bổ sung 2026-09-18 theo yêu cầu FE — dùng cho màn gán vai trò cho người dùng.)*

- **Endpoint**: `GET /api/v1/iam/users`
- **Query Params**:
  - `keyword` (tùy chọn): tìm theo `email` hoặc họ tên.
  - `status` (tùy chọn): lọc trạng thái tài khoản (`ACTIVE`, `INACTIVE`, `LOCKED`, ...).
  - `page` (mặc định **`0`** — **0-based**), `size` (mặc định `20`).
- **Phản Hồi (200 OK)**:
```json
{
  "success": true,
  "code": "IAM_USER_LIST_SUCCESS",
  "message": "Tenant user list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "user_id": "user-uuid",
        "email": "nva@example.com",
        "full_name": "Nguyễn Văn A",
        "status": "ACTIVE"
      }
    ],
    "page": 0,
    "size": 20,
    "total_items": 42,
    "total_pages": 3
  }
}
```
- **Phạm vi dữ liệu**: chỉ trả user thuộc tenant hiện tại (`tenant_id` từ security context); user thuộc tenant khác không bao giờ xuất hiện.
- **Ghi chú triển khai (Wave 3, 2026-09-18)**: `page` là **0-based** (mặc định `0`); item trả field **`user_id`** (không phải `id`) — Frontend chuẩn hóa `user_id` → `id` khi render user picker. Khuôn mẫu phân trang giữ nguyên (`items`, `page`, `size`, `total_items`, `total_pages`) theo DES-02-API §1.2.

---

## 6. Bảng Mã Phản Hồi & Từ Điển i18n (BUG-62, BUG-63)

Toàn bộ `code` xuất hiện trong tài liệu này, kèm bản dịch chuẩn để Frontend nạp vào từ điển (`frontend/{web,mobile}/public/i18n/{vi,en}.json`). Frontend chỉ dựa vào `code` + `params`, không dùng `message` từ backend để hiển thị.

### 6.1. Platform (`/api/v1/platform/*`)
| `code` | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- |
| `PLATFORM_TENANT_LIST_SUCCESS` | Lấy danh sách khách thuê thành công | Tenant list retrieved successfully |
| `PLATFORM_TENANT_DETAIL_SUCCESS` | Lấy chi tiết khách thuê thành công | Tenant detail retrieved successfully |
| `PLATFORM_TENANT_QUOTA_UPDATED` | Cập nhật hạn mức khách thuê thành công | Tenant quota updated successfully |
| `PLATFORM_TENANT_QUOTA_EXCEEDED` | Hạn mức khách thuê đã vượt giới hạn cho phép | Tenant quota exceeds the allowed limit |
| `PLATFORM_PLUGIN_NOT_ALLOWED` | Plugin không nằm trong danh sách được phép của khách thuê | Plugin is not allowed for this tenant |
| `PLATFORM_TENANT_LOCK_SUCCESS` | Khóa khách thuê thành công | Tenant locked successfully |
| `PLATFORM_TENANT_UNLOCK_SUCCESS` | Mở khóa khách thuê thành công | Tenant unlocked successfully |
| `PLATFORM_SELF_LOCK_FORBIDDEN` | Không thể tự khóa tài khoản của chính mình | You cannot lock your own account |
| `TENANT_SUSPENDED` | Khách thuê đang bị tạm ngưng hoạt động | Tenant is suspended |
| `PLATFORM_USER_LIST_SUCCESS` | Lấy danh sách người dùng toàn cầu thành công | Global user list retrieved successfully |
| `PLATFORM_USER_LOCKED_SUCCESS` | Khóa người dùng thành công | User locked successfully |
| `PLATFORM_USER_UNLOCKED_SUCCESS` | Mở khóa người dùng thành công | User unlocked successfully |
| `PLATFORM_USER_PASSWORD_RESET_FORCED` | Đã buộc đặt lại mật khẩu người dùng | User password reset forced |
| `PLATFORM_USER_2FA_DISABLED_BY_BREAK_GLASS` | Đã tắt 2FA theo quy trình break-glass | 2FA disabled via break-glass |
| `PLATFORM_IMPERSONATION_STARTED` | Bắt đầu phiên truy cập đại diện thành công | Impersonation session started successfully |
| `PLATFORM_IMPERSONATION_ENDED` | Kết thúc phiên truy cập đại diện thành công | Impersonation session ended successfully |
| `PLATFORM_IMPERSONATION_TARGET_NOT_FOUND` | Không tìm thấy người dùng đích để đại diện | Impersonation target user not found |
| `PLATFORM_IMPERSONATION_SESSION_EXPIRED` | Phiên đại diện đã hết hạn hoặc không tồn tại | Impersonation session expired or not found |
| `PLATFORM_IMPERSONATION_LOG_LIST_SUCCESS` | Lấy nhật ký phiên đại diện thành công | Impersonation log list retrieved successfully |
| `PLATFORM_HEALTH_CHECK_SUCCESS` | Lấy trạng thái sức khỏe hạ tầng thành công | Infrastructure health check retrieved successfully |
| `PLATFORM_AUDIT_LOG_LIST_SUCCESS` | Lấy nhật ký kiểm toán nền tảng thành công | Platform audit log list retrieved successfully |
| `PLATFORM_AUDIT_LOG_DETAIL_SUCCESS` | Lấy chi tiết bản ghi kiểm toán thành công | Audit log detail retrieved successfully |
| `PLATFORM_AUDIT_LOG_NOT_FOUND` | Không tìm thấy bản ghi kiểm toán | Audit log record not found |
| `PLATFORM_ACCESS_DENIED` | Bạn không có quyền truy cập cổng quản trị nền tảng | You do not have access to the platform administration portal |
| `PLATFORM_PASSWORD_CHANGE_REQUIRED` | Bạn phải đổi mật khẩu trước khi sử dụng cổng quản trị nền tảng | You must change your password before using the platform portal |
| `SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN` | Không được thực hiện thao tác phá hoại trong chế độ đại diện | Destructive action is forbidden in impersonation mode |
| `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN` | Không được đọc/xuất bí mật trong chế độ đại diện | Secret export is forbidden in impersonation mode |
| `PLATFORM_ADMIN_LIST_SUCCESS` | Lấy danh sách quản trị viên nền tảng thành công | Platform admin list retrieved successfully |
| `PLATFORM_ADMIN_GRANTED` | Cấp quyền quản trị viên nền tảng thành công | Platform admin granted successfully |
| `PLATFORM_ADMIN_INVITATION_SENT` | Đã gửi lời mời quản trị viên nền tảng | Platform admin invitation sent successfully |
| `PLATFORM_ADMIN_DISABLED` | Vô hiệu hóa quản trị viên nền tảng thành công | Platform admin disabled successfully |
| `PLATFORM_ADMIN_ENABLED` | Kích hoạt lại quản trị viên nền tảng thành công | Platform admin enabled successfully |
| `PLATFORM_ADMIN_REVOKED` | Thu hồi quyền quản trị viên nền tảng thành công | Platform admin revoked successfully |
| `PLATFORM_ADMIN_PASSWORD_RESET_SENT` | Đã gửi email đặt lại mật khẩu quản trị viên nền tảng | Platform admin password reset email sent |
| `PLATFORM_ADMIN_2FA_DISABLED` | Đã tắt 2FA của quản trị viên nền tảng theo quy trình break-glass | Platform admin 2FA disabled via break-glass |
| `PLATFORM_SELF_DISABLE_FORBIDDEN` | Không thể tự vô hiệu hóa hoặc thu hồi quyền của chính mình | You cannot disable or revoke your own platform admin account |
| `PLATFORM_LAST_ADMIN_PROTECTED` | Không thể vô hiệu hóa quản trị viên nền tảng đang hoạt động cuối cùng | The last active platform admin is protected |
| `PLATFORM_TENANT_NOT_FOUND` | Không tìm thấy khách thuê | Tenant not found |
| `PLATFORM_USER_NOT_FOUND` | Không tìm thấy người dùng | User not found |
| `PLATFORM_ADMIN_NOT_FOUND` | Không tìm thấy quản trị viên nền tảng | Platform admin not found |
| `PLATFORM_TENANT_IMPERSONATION_ACTIVE` | Khách thuê đang có phiên truy cập đại diện hoạt động | An impersonation session is currently active for this tenant |
| `PLATFORM_IMPERSONATION_TENANT_LOCKED` | Khách thuê đang bị khóa, không thể truy cập đại diện | Tenant is locked or unavailable for impersonation |
| `PLATFORM_IMPERSONATION_FORBIDDEN` | Bạn không được phép khởi tạo phiên truy cập đại diện | You are not allowed to start an impersonation session |
| `PLATFORM_CONFIRM_PASSWORD_INVALID` | Mật khẩu xác nhận không chính xác | Confirmation password is invalid |
| `PLATFORM_AUDIT_CHAIN_VERIFIED` | Chuỗi kiểm toán toàn vẹn | Audit chain verified successfully |
| `PLATFORM_AUDIT_CHAIN_TAMPERED` | Phát hiện chuỗi kiểm toán bị thay đổi | Audit chain tampering detected |

> **Ghi chú canonical — plugin allowlist (Wave 3, 2026-09-18)**: mã chuẩn hóa duy nhất là `PLATFORM_PLUGIN_NOT_ALLOWED` (403). Mọi tài liệu/implementation cũ dùng tên `TENANT_PLUGIN_NOT_ALLOWED` đều thay bằng mã này; audit tương ứng dùng action `PLUGIN_ACCESS_DENIED`.

### 6.2. Organization (`/api/v1/organization/*`)
| `code` | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- |
| `ORGANIZATION_BRANCH_LIST_SUCCESS` | Lấy danh sách chi nhánh thành công | Branch list retrieved successfully |
| `ORGANIZATION_BRANCH_CREATED_SUCCESS` | Tạo chi nhánh thành công | Branch created successfully |
| `ORGANIZATION_BRANCH_UPDATED` | Cập nhật chi nhánh thành công | Branch updated successfully |
| `ORGANIZATION_BRANCH_DELETED` | Xóa chi nhánh thành công | Branch deleted successfully |
| `ORGANIZATION_BRANCH_IN_USE` | Không thể xóa chi nhánh đang được sử dụng | Cannot delete a branch that is in use |
| `ORGANIZATION_DEPARTMENT_TREE_SUCCESS` | Lấy cây phòng ban thành công | Department hierarchy retrieved successfully |
| `ORGANIZATION_DEPARTMENT_CREATED_SUCCESS` | Tạo phòng ban thành công | Department created successfully |
| `ORGANIZATION_DEPARTMENT_UPDATED` | Cập nhật phòng ban thành công | Department updated successfully |
| `ORGANIZATION_DEPARTMENT_DELETED` | Xóa phòng ban thành công | Department deleted successfully |
| `ORGANIZATION_DEPARTMENT_IN_USE` | Không thể xóa phòng ban còn phòng con hoặc thành viên | Cannot delete a department with sub-departments or members |
| `ORGANIZATION_DEPARTMENT_MOVED` | Di chuyển phòng ban thành công | Department moved successfully |
| `ORGANIZATION_DEPARTMENT_CYCLE_DETECTED` | Phát hiện vòng lặp trong cây phòng ban | Circular loop detected in the department tree |
| `ORGANIZATION_REPORTING_CYCLE_DETECTED` | Phát hiện vòng lặp trong tuyến quản lý báo cáo | Circular reporting loop detected |
| `ORGANIZATION_MEMBERSHIP_CREATED` | Gán thành viên vào tổ chức thành công | Membership created successfully |
| `ORGANIZATION_MEMBERSHIP_LIST_SUCCESS` | Lấy danh sách thành viên thành công | Membership list retrieved successfully |
| `ORGANIZATION_MEMBERSHIP_UPDATED` | Cập nhật thành viên thành công | Membership updated successfully |
| `ORGANIZATION_MEMBERSHIP_REMOVED` | Gỡ thành viên khỏi tổ chức thành công | Membership removed successfully |
| `ORGANIZATION_BRANCH_ASSIGNMENT_LIST_SUCCESS` | Lấy danh sách phân công quản lý chi nhánh thành công | Branch assignment list retrieved successfully |
| `ORGANIZATION_BRANCH_ASSIGNMENT_CREATED` | Phân công quản lý chi nhánh thành công | Branch assignment created successfully |
| `ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED` | Cập nhật phân công quản lý chi nhánh thành công | Branch assignment updated successfully |
| `ORGANIZATION_BRANCH_ASSIGNMENT_REMOVED` | Thu hồi phân công quản lý chi nhánh thành công | Branch assignment removed successfully |
| `ORGANIZATION_PRIMARY_BRANCH_REQUIRED` | Người dùng phải có ít nhất một chi nhánh chính | User must have at least one primary branch |
| `ORGANIZATION_BRANCH_HAS_MEMBERS` | Không thể xóa chi nhánh vì còn thành viên đang hoạt động | Cannot delete a branch that still has active members |
| `ORGANIZATION_CROSS_TENANT_REFERENCE` | Tham chiếu chéo khách thuê không được phép | Cross-tenant reference is not allowed |
| `ORGANIZATION_PRIMARY_REQUIRED` | Người dùng phải giữ ít nhất một thành viên chính | The user must keep at least one primary membership |
| `ORGANIZATION_DEPARTMENT_DEPTH_EXCEEDED` | Vượt quá độ sâu tối đa của cây phòng ban | Department hierarchy depth exceeds the allowed limit |

### 6.3. IAM & Reference Entity (`/api/v1/iam/*`, `/api/v1/core/*`)
| `code` | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- |
| `IAM_PERMISSION_LIST_SUCCESS` | Lấy danh mục quyền thành công | Permission list retrieved successfully |
| `IAM_PERMISSION_DENIED_FUNCTIONAL` | Bạn không có quyền thực hiện chức năng này | You do not have permission for this function |
| `IAM_PERMISSION_DENIED_DATA_SCOPE` | Bạn không có quyền truy cập dữ liệu ngoài phạm vi được phép | You cannot access data outside your allowed scope |
| `IAM_PERMISSION_DENIED_EXPORT` | Bạn không được phép xuất dữ liệu tài nguyên này | You are not allowed to export this resource data |
| `IAM_ROLE_LIST_SUCCESS` | Lấy danh sách vai trò thành công | Role list retrieved successfully |
| `IAM_ROLE_CREATED` | Tạo vai trò thành công | Role created successfully |
| `IAM_ROLE_UPDATED` | Cập nhật vai trò thành công | Role updated successfully |
| `IAM_ROLE_DELETED` | Xóa vai trò thành công | Role deleted successfully |
| `IAM_ROLE_IN_USE` | Không thể xóa vai trò đang được gán cho người dùng | Cannot delete a role that is assigned to users |
| `IAM_ROLE_PERMISSIONS_UPDATED` | Cập nhật quyền chức năng của vai trò thành công | Role permissions updated successfully |
| `IAM_ROLE_PERMISSIONS_SUCCESS` | Lấy danh sách quyền chức năng của vai trò thành công | Role permission list retrieved successfully |
| `IAM_ROLE_DATA_POLICIES_SUCCESS` | Lấy ma trận phạm vi dữ liệu thành công | Role data policies retrieved successfully |
| `IAM_ROLE_DATA_POLICIES_UPDATED` | Cập nhật ma trận phạm vi dữ liệu thành công | Role data policies updated successfully |
| `IAM_USER_ROLES_ASSIGNED` | Gán vai trò cho người dùng thành công | User roles assigned successfully |
| `IAM_USER_ROLE_LIST_SUCCESS` | Lấy danh sách vai trò của người dùng thành công | User role list retrieved successfully |
| `IAM_USER_ROLE_REMOVED` | Gỡ vai trò khỏi người dùng thành công | User role removed successfully |
| `IAM_USER_ROLE_REQUIRED` | Không thể gỡ vai trò hệ thống bắt buộc cuối cùng | Cannot remove the last required system role |
| `IAM_USER_LIST_SUCCESS` | Lấy danh sách người dùng trong khách thuê thành công | Tenant user list retrieved successfully |
| `IAM_DATA_RESOURCE_LIST_SUCCESS` | Lấy danh mục nguồn dữ liệu phân quyền thành công | Data resource list retrieved successfully |
| `CORE_SAMPLE_RECORD_CREATED` | Tạo bản ghi mẫu thành công | Sample record created successfully |
| `CORE_SAMPLE_RECORD_LIST_SUCCESS` | Lấy danh sách bản ghi mẫu thành công | Sample record list retrieved successfully |
| `CORE_SAMPLE_RECORD_UPDATED` | Cập nhật bản ghi mẫu thành công | Sample record updated successfully |
| `CORE_SAMPLE_RECORD_DELETED` | Xóa bản ghi mẫu thành công | Sample record deleted successfully |
| `CORE_SAMPLE_RECORD_EXPORTED` | Xuất dữ liệu bản ghi mẫu thành công | Sample record data exported successfully |
| `IAM_ROLE_CODE_EXISTS` | Mã vai trò đã tồn tại trong khách thuê | Role code already exists in this tenant |
| `IAM_SYSTEM_ROLE_IMMUTABLE` | Không thể chỉnh sửa hoặc xóa vai trò hệ thống | System roles cannot be modified or deleted |
| `IAM_PERMISSION_UNKNOWN` | Một hoặc nhiều mã quyền không thuộc danh mục | One or more permission codes are not part of the catalog |

### 6.4. Validation (`errors[].code`)
| `code` | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- |
| `VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN` | Người quản lý được gán tạo vòng lặp quản lý | Assigned manager creates a circular reporting line |
| `VALIDATION_REQUIRED` | Trường này là bắt buộc | This field is required |
| `VALIDATION_INVALID_FORMAT` | Định dạng dữ liệu không hợp lệ | Invalid data format |
| `VALIDATION_INVALID_DATA_SCOPE` | Phạm vi dữ liệu không hợp lệ | Invalid data scope value |

> **Quy ước**: `code` là nguồn duy nhất để Frontend tra từ điển i18n; `message` trong response chỉ mang tính tham chiếu kỹ thuật, không dùng làm nguồn hiển thị. Mọi mã mới phát sinh trong quá trình lập trình phải được bổ sung vào bảng này và vào file từ điển `vi`/`en` tương ứng.
