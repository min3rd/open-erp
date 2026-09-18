# [DES-02-API] Đặc Tả RESTful API: Super Admin Nền Tảng, Cơ Cấu Tổ Chức & Phân Quyền Đa Phạm Vi

- **Mã Tài Liệu**: DES-02-API
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Quy Chuẩn Hợp Đồng**: 100% Code-Based i18n Contract (Tuân thủ nghiêm ngặt 4 Khuôn Mẫu Chuẩn trong `api_standards.md`)
- **Ngày Hoàn Thành**: 2026-09-18

---

## 1. Quy Chuẩn Đóng Gói API Chung (API Response Envelope Invariant)

Toàn bộ các API trong tài liệu này bắt buộc tuân thủ 1 trong 4 khuôn mẫu chuẩn đã được quy định trong [.agents/rules/api_standards.md](../../../../.agents/rules/api_standards.md):

### 1.1. Khuôn Mẫu 1: Dữ Liệu Đơn Lẻ (Single Resource)
```json
{
  "success": true,
  "code": "SUPERADMIN_TENANT_LOCKED_SUCCESS",
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
  "success": true,
  "code": "PLATFORM_TENANT_LOCK_SUCCESS",
  "message": "Tenant status updated successfully.",
  "params": {},
  "data": {
    "tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "status": "SUSPENDED",
    "is_locked": true,
    "locked_at": "2026-09-18T10:15:00Z"
  }
}
```

### 3.4. Khởi Tạo Phiên Truy Cập Đại Diện (Khuôn Mẫu 1: Single Resource)
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
  "success": true,
  "code": "PLATFORM_IMPERSONATION_STARTED",
  "message": "Impersonation session started successfully.",
  "params": {},
  "data": {
    "impersonation_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in_seconds": 1800,
    "target_tenant_id": "e5b30000-0000-4000-a000-000000000001",
    "target_tenant_name": "Tập Đoàn Acme",
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

### 3.7. Nhật Ký Kiểm Toán Nền Tảng (Khuôn Mẫu 2: Paginated List)
- **Endpoint**: `GET /api/v1/platform/audit-logs`
- **Query Params**: `page`, `size`, `action`, `tenant_id`, `from_date`, `to_date`.
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
    "total_items": 1,
    "total_pages": 1
  }
}
```

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
  - **Phản hồi (200 OK)**: Khuôn Mẫu 1 (Single Resource) trả về `{ "success": true, "code": "ORGANIZATION_BRANCH_CREATED_SUCCESS", "message": "Branch created successfully.", "params": {}, "data": { ... } }`.
- `PUT /api/v1/organization/branches/{id}`: Cập nhật chi nhánh.

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
  - Phản hồi: Khuôn Mẫu 1 (Single Resource).
- `PUT /api/v1/iam/roles/{id}`: Cập nhật tên/mô tả vai trò.
- `DELETE /api/v1/iam/roles/{id}`: Xóa vai trò (chặn nếu còn user).

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
