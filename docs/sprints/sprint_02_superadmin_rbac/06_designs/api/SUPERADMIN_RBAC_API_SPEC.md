# [DES-02-API] Đặc Tả RESTful API: Super Admin Nền Tảng, Cơ Cấu Tổ Chức & Phân Quyền Đa Phạm Vi

- **Mã Tài Liệu**: DES-02-API
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Quy Chuẩn Hợp Đồng**: 100% Code-Based i18n Contract (Zero-Hardcode Message)
- **Ngày Hoàn Thành**: 2026-09-18

---

## 1. Quy Chuẩn Đóng Gói API Chung (API Response Envelope)

Mọi API response (thành công hoặc lỗi) bắt buộc tuân thủ cấu trúc đồng nhất:

```json
{
  "code": "SUPERADMIN_TENANT_LOCKED_SUCCESS",
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "SUSPENDED"
  },
  "errors": null,
  "timestamp": "2026-09-18T10:00:00Z"
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
  IMPERSONATION_END = 'IMPERSONATION_END'
}
```

---

## 3. Nhóm API Quản Trị Nền Tảng (Super Admin: `/api/v1/platform/*`)

*Tất cả các API trong nhóm này yêu cầu Header: `Authorization: Bearer <token>` có claim `platform_role: "SUPER_ADMIN"`*.

### 3.1. Danh Sách & Tìm Kiếm Tenant
- **Endpoint**: `GET /api/v1/platform/tenants`
- **Query Params**: `page` (default 0), `size` (default 20), `status` (ACTIVE, SUSPENDED, TRIAL), `keyword` (search slug, name, tax_code).
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_TENANT_LIST_SUCCESS",
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
    "total_elements": 1,
    "total_pages": 1
  }
}
```

### 3.2. Cập Nhật Hạn Mức Tenant (Quotas & Limits)
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
  "code": "PLATFORM_TENANT_QUOTA_UPDATED",
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "plan_tier": "ENTERPRISE",
    "max_users": 100,
    "max_storage_mb": 51200
  }
}
```

### 3.3. Khóa Khẩn Cấp / Mở Khóa Tenant
- **Endpoint**: `POST /api/v1/platform/tenants/{tenant_id}/lock`
- **Request Body**:
```json
{
  "action": "LOCK",
  "reason": "Chưa thanh toán cước phí dịch vụ quý 3/2026",
  "confirm_password": "superadmin-secret-password"
}
```
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_TENANT_LOCK_SUCCESS",
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "SUSPENDED",
    "is_locked": true,
    "locked_at": "2026-09-18T10:15:00Z"
  }
}
```

### 3.4. Khởi Tạo Phiên Truy Cập Đại Diện (Support Impersonation)
- **Endpoint**: `POST /api/v1/platform/tenants/{tenant_id}/impersonate`
- **Request Body**:
```json
{
  "support_ticket": "TCK-9981",
  "reason": "Khách hàng báo lỗi không xem được báo cáo doanh thu tuần",
  "confirm_password": "superadmin-secret-password"
}
```
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_IMPERSONATION_STARTED",
  "data": {
    "impersonation_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in_seconds": 1800,
    "target_tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "target_tenant_name": "Tập Đoàn Acme",
    "started_at": "2026-09-18T10:20:00Z"
  }
}
```

### 3.5. Kết Thúc Phiên Đại Diện (Exit Impersonation)
- **Endpoint**: `POST /api/v1/platform/impersonate/exit`
- **Header**: `Authorization: Bearer <impersonation_token>`
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_IMPERSONATION_ENDED",
  "data": {
    "status": "SUCCESS"
  }
}
```

### 3.6. Giám Sát Sức Khỏe Hạ Tầng (System Health & Metrics)
- **Endpoint**: `GET /api/v1/platform/health`
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_HEALTH_CHECK_SUCCESS",
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

### 3.7. Nhật Ký Kiểm Toán Nền Tảng (Audit Trail)
- **Endpoint**: `GET /api/v1/platform/audit-logs`
- **Query Params**: `page`, `size`, `action`, `tenant_id`, `from_date`, `to_date`.
- **Phản Hồi Thành Công (200 OK)**:
```json
{
  "code": "PLATFORM_AUDIT_LOG_LIST_SUCCESS",
  "data": {
    "items": [
      {
        "log_id": "log-0001",
        "actor_user_id": "admin-uuid",
        "actor_email": "ops-admin@openerp.9ms.io.vn",
        "action": "TENANT_LOCK",
        "target_tenant_id": "tenant-uuid",
        "target_tenant_name": "Tập Đoàn Acme",
        "details": {
          "reason": "Chưa thanh toán cước phí",
          "previous_status": "ACTIVE",
          "new_status": "SUSPENDED"
        },
        "ip_address": "118.70.12.34",
        "created_at": "2026-09-18T10:15:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 1
  }
}
```

---

## 4. Nhóm API Cơ Cấu Tổ Chức Doanh Nghiệp (`/api/v1/organization/*`)

*Tất cả API nhóm này yêu cầu Context Tenant của người dùng*.

### 4.1. Quản Lý Chi Nhánh (Branches)
- `GET /api/v1/organization/branches`: Lấy danh sách chi nhánh.
- `POST /api/v1/organization/branches`: Tạo chi nhánh mới.
  - Body: `{ "code": "BR-HN", "name": "Chi nhánh Hà Nội", "phone": "0243123456", "address": "Hà Nội" }`
- `PUT /api/v1/organization/branches/{id}`: Cập nhật chi nhánh.

### 4.2. Quản Lý Cây Phòng Ban (Department Tree)
- `GET /api/v1/organization/departments/tree`: Lấy toàn bộ cây phòng ban (Nested tree JSON).
- `POST /api/v1/organization/departments`: Tạo phòng ban mới.
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
- `PUT /api/v1/organization/departments/{id}`: Sửa thông tin / Đổi phòng ban cha.

### 4.3. Gán Thành Viên & Thiết Lập Quản Lý Trực Tiếp
- `POST /api/v1/organization/memberships`: Gán nhân viên vào phòng ban.
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
- **Xử lý lỗi phát hiện vòng lặp (400 Bad Request)**:
```json
{
  "code": "ORGANIZATION_REPORTING_CYCLE_DETECTED",
  "data": null,
  "errors": [
    {
      "field": "direct_manager_user_id",
      "message": "Không thể gán quản lý trực tiếp vì tạo thành chu trình vòng lặp báo cáo"
    }
  ]
}
```

---

## 5. Nhóm API Phân Quyền Chức Năng & Dữ Liệu (`/api/v1/iam/*`)

### 5.1. Danh Mục Quyền Hệ Thống
- **Endpoint**: `GET /api/v1/iam/permissions`
- **Phản Hồi (200 OK)**:
```json
{
  "code": "IAM_PERMISSION_LIST_SUCCESS",
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

### 5.2. Quản Lý Vai Trò (Roles)
- `GET /api/v1/iam/roles`: Danh sách vai trò trong Tenant (kèm số user gán và cờ `is_system`).
- `POST /api/v1/iam/roles`: Tạo vai trò tùy biến mới.
  - Body: `{ "code": "SALES_LEAD", "name": "Trưởng Nhóm Kinh Doanh", "description": "Quản lý doanh số tổ" }`
- `PUT /api/v1/iam/roles/{id}`: Cập nhật tên/mô tả vai trò.
- `DELETE /api/v1/iam/roles/{id}`: Xóa vai trò (chặn nếu còn user).

### 5.3. Gán Quyền Chức Năng Cho Vai Trò (Role Permissions)
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
  "code": "IAM_ROLE_PERMISSIONS_UPDATED",
  "data": {
    "role_id": "role-uuid",
    "total_permissions_granted": 4
  }
}
```

### 5.4. Cấu Hình Ma Trận Quyền Dữ Liệu (Role Data Policies)
- **Endpoint**: `GET /api/v1/iam/roles/{role_id}/data-policies`
- **Phản Hồi (200 OK)**:
```json
{
  "code": "IAM_ROLE_DATA_POLICIES_SUCCESS",
  "data": {
    "role_id": "role-uuid",
    "policies": [
      {
        "resource": "SALE_ORDER",
        "create_scope": "BRANCH",
        "read_scope": "OWN_AND_SUBORDINATES",
        "update_scope": "OWN_ONLY",
        "delete_scope": "NONE",
        "export_scope": "NONE",
        "share_scope": "DEPARTMENT"
      },
      {
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
- **Phản Hồi (200 OK)**:
```json
{
  "code": "IAM_ROLE_DATA_POLICIES_UPDATED",
  "data": {
    "role_id": "role-uuid",
    "updated_count": 1
  }
}
```

### 5.5. Gán Vai Trò Cho Người Dùng (Assign User Roles)
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
  "code": "IAM_USER_ROLES_ASSIGNED",
  "data": {
    "user_id": "user-uuid",
    "assigned_roles_count": 2
  }
}
```
