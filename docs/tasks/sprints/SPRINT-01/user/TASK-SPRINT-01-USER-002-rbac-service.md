# TASK-SPRINT-01-USER-002: RBAC Service — Role-Based Access Control cơ bản

## Thông tin

| Thuộc tính       | Giá trị                      |
|------------------|------------------------------|
| Task ID          | TASK-SPRINT-01-USER-002      |
| Sprint           | Sprint 01                    |
| Cluster          | user                         |
| Loại             | Backend                      |
| Người phụ trách  | Backend                      |
| Story Points     | 8                            |
| Trạng thái       | ⬜ TODO                      |
| Phụ thuộc        | TASK-SPRINT-01-USER-001      |

## Mô tả

Xây dựng `rbac-service` — microservice quản lý phân quyền dựa trên vai trò (Role-Based Access Control). Cung cấp CRUD roles và permissions, gán roles cho users, và cơ chế kiểm tra quyền hạn. Subscribe `tenant.created` để tạo các built-in roles mặc định. Expose Permission Checking API cho các microservice khác.

## Phạm vi kỹ thuật

### Backend (NestJS — `rbac-service`, port 3004)

**Cấu trúc module:**
```
src/
├── rbac.module.ts
├── main.ts
├── roles/
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   └── schemas/
│       └── role.schema.ts
├── permissions/
│   ├── permissions.controller.ts
│   ├── permissions.service.ts
│   └── schemas/
│       └── permission.schema.ts
├── user-roles/
│   ├── user-roles.controller.ts
│   ├── user-roles.service.ts
│   └── schemas/
│       └── user-role.schema.ts
├── permission-check/
│   └── permission-check.service.ts  ← Core RBAC logic
└── events/
    └── tenant.handler.ts            ← Subscribe tenant.created
```

**Built-in Roles:**

| Role             | Mô tả                                                   |
|------------------|---------------------------------------------------------|
| `SUPER_ADMIN`    | Quản trị nền tảng, toàn quyền, không thuộc tenant nào  |
| `TENANT_ADMIN`   | Quản trị tenant, toàn quyền trong tenant               |
| `MANAGER`        | Quản lý phòng ban, xem/duyệt dữ liệu nhân viên        |
| `EMPLOYEE`       | Nhân viên thông thường, xem dữ liệu của mình           |

**Permission Model:**
```typescript
interface Permission {
  resource: string;    // 'users', 'orders', 'invoices', 'reports'
  action: string;      // 'create', 'read', 'update', 'delete', 'approve'
  scope: string;       // 'own' | 'department' | 'all'
  conditions?: object; // Điều kiện bổ sung (field: value)
}
```

**Ví dụ permissions:**
```
{ resource: 'users',    action: 'read',   scope: 'all' }        → Xem mọi user
{ resource: 'users',    action: 'update', scope: 'own' }        → Chỉ sửa profile mình
{ resource: 'orders',   action: 'create', scope: 'all' }        → Tạo đơn hàng
{ resource: 'orders',   action: 'approve', scope: 'department' } → Duyệt đơn phòng ban
{ resource: 'reports',  action: 'read',   scope: 'all' }        → Xem báo cáo
```

**Permission Checking Logic:**
```typescript
// Kiểm tra user có quyền thực hiện action không
async checkPermission(
  tenantId: string,
  userId: string,
  resource: string,
  action: string,
  context?: { departmentId?: string; ownerId?: string }
): Promise<boolean> {
  // 1. Lấy roles của user (từ Redis cache, TTL 5 phút)
  const userRoles = await this.getUserRoles(tenantId, userId);
  
  // 2. Với mỗi role, lấy permissions
  const permissions = await this.getPermissionsForRoles(tenantId, userRoles);
  
  // 3. Kiểm tra permission khớp
  return permissions.some(p => 
    p.resource === resource &&
    p.action === action &&
    this.checkScope(p.scope, context)
  );
}

private checkScope(scope: string, context?: object): boolean {
  if (scope === 'all') return true;
  if (scope === 'own' && context?.ownerId === this.currentUserId) return true;
  if (scope === 'department' && context?.departmentId === this.currentDepartmentId) return true;
  return false;
}
```

**Redis Caching cho permissions:**
```
cache key: perms:{tenantId}:{userId}
TTL: 5 phút
Invalidate: khi assign/revoke role, khi update role permissions
```

**Khởi tạo Built-in Roles khi nhận `tenant.created`:**
```typescript
const builtInRoles = [
  {
    name: 'TENANT_ADMIN',
    displayName: 'Quản trị viên',
    permissions: [/* toàn quyền */],
    isSystem: true,
  },
  {
    name: 'MANAGER',
    displayName: 'Quản lý',
    permissions: [/* quyền quản lý phòng ban */],
    isSystem: true,
  },
  {
    name: 'EMPLOYEE',
    displayName: 'Nhân viên',
    permissions: [/* quyền cơ bản */],
    isSystem: true,
  },
];
```

### Database (MongoDB)

**Collection: `roles`** (tenantId-scoped)

| Trường          | Kiểu     | Ràng buộc              | Mô tả                             |
|-----------------|----------|------------------------|-----------------------------------|
| `_id`           | ObjectId | —                      | Primary key                       |
| `tenantId`      | ObjectId | required, indexed      | Tenant sở hữu                     |
| `name`          | string   | required, uppercase    | Tên role (TENANT_ADMIN, MANAGER)  |
| `displayName`   | string   | required               | Tên hiển thị                      |
| `description`   | string   | optional               | Mô tả                             |
| `permissions`   | array    | —                      | Danh sách permission objects      |
| `isSystem`      | boolean  | default: false         | Role hệ thống (không xoá được)    |
| `isDeleted`     | boolean  | default: false         | Soft delete                       |
| `createdAt`     | Date     | auto                   | —                                 |
| `updatedAt`     | Date     | auto                   | —                                 |

**Indexes:**
```
{ tenantId: 1, name: 1 }     — unique per tenant
{ tenantId: 1, isSystem: 1 }
{ tenantId: 1, isDeleted: 1 }
```

**Collection: `permissions`** (Master list, system-level — không có tenantId)

| Trường       | Kiểu   | Mô tả                                       |
|--------------|--------|---------------------------------------------|
| `_id`        | ObjectId | —                                          |
| `resource`   | string | Tài nguyên: users, orders, invoices...      |
| `action`     | string | Hành động: create, read, update, delete     |
| `scope`      | enum   | own, department, all                        |
| `module`     | string | Module sở hữu: hr, sale, accounting...      |
| `description`| string | Mô tả quyền                                |

**Collection: `user_roles`** (tenantId-scoped)

| Trường        | Kiểu     | Ràng buộc | Mô tả                             |
|---------------|----------|-----------|-----------------------------------|
| `_id`         | ObjectId | —         | Primary key                       |
| `tenantId`    | ObjectId | required  | Tenant                            |
| `userId`      | ObjectId | required  | User được gán role                |
| `roleId`      | ObjectId | required  | Role được gán                     |
| `assignedBy`  | ObjectId | required  | Người gán                         |
| `assignedAt`  | Date     | required  | Thời điểm gán                     |
| `expiresAt`   | Date     | optional  | Hết hạn (temporary roles)         |

**Indexes:**
```
{ tenantId: 1, userId: 1 }          — Lấy roles của user
{ tenantId: 1, userId: 1, roleId: 1 } — unique (không gán 2 lần)
{ tenantId: 1, roleId: 1 }
```

## API Endpoints

| Method | Path                                  | Mô tả                                    | Auth            |
|--------|---------------------------------------|------------------------------------------|-----------------|
| GET    | `/api/v1/roles`                       | Danh sách roles của tenant               | Tenant Admin    |
| POST   | `/api/v1/roles`                       | Tạo role mới                             | Tenant Admin    |
| GET    | `/api/v1/roles/:id`                   | Chi tiết role                            | Tenant Admin    |
| PATCH  | `/api/v1/roles/:id`                   | Cập nhật role (permissions)              | Tenant Admin    |
| DELETE | `/api/v1/roles/:id`                   | Xoá role (không xoá system role)         | Tenant Admin    |
| GET    | `/api/v1/permissions`                 | Danh sách tất cả permissions hệ thống   | Tenant Admin    |
| GET    | `/api/v1/users/:id/roles`             | Roles của một user                       | Tenant Admin    |
| POST   | `/api/v1/users/:id/roles`             | Gán role cho user                        | Tenant Admin    |
| DELETE | `/api/v1/users/:id/roles/:roleId`     | Xoá role của user                        | Tenant Admin    |
| POST   | `/api/v1/permission-check`            | Kiểm tra quyền (internal API)            | Service-to-Service |

**Request/Response — Permission Check:**

```
POST /api/v1/permission-check
Body:
{
  "tenantId": "...",
  "userId": "...",
  "resource": "orders",
  "action": "approve",
  "context": { "departmentId": "..." }
}

Response 200:
{
  "allowed": true,
  "matchedPermission": { "resource": "orders", "action": "approve", "scope": "department" }
}
```

## Yêu cầu bảo mật

- [ ] Chỉ Tenant Admin mới tạo/sửa/xoá roles
- [ ] System roles (`isSystem: true`) không thể xoá, chỉ cập nhật permissions
- [ ] SUPER_ADMIN role không thuộc tenant nào, không bị ảnh hưởng bởi tenant-level RBAC
- [ ] Permission cache Redis phải được invalidate khi roles thay đổi
- [ ] Tránh privilege escalation: user không thể gán cho mình role cao hơn hiện tại

## Acceptance Criteria

- [ ] Nhận event `tenant.created` → tạo 3 built-in roles (TENANT_ADMIN, MANAGER, EMPLOYEE)
- [ ] CRUD roles hoạt động với tenantId isolation
- [ ] Gán role cho user → publish `permission.updated` event (để invalidate cache các nơi khác)
- [ ] Permission check API trả về đúng `allowed: true/false`
- [ ] Permission caching Redis: lần 2 không query DB
- [ ] Cache bị invalidate khi gán/xoá role
- [ ] Xoá system role → 400 Bad Request
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: roles của tenant A không thể gán cho user tenant B

## Ghi chú kỹ thuật

- Permission Check Service cần expose REST endpoint (internal) để các microservice khác gọi kiểm tra quyền.
- Cân nhắc dùng **CASL.js** định nghĩa abilities thay vì custom logic — linh hoạt hơn cho Sprint 02.
- Permissions được seed khi microservice khởi động (từ file JSON config).
- Guard `RolesGuard` trong API Gateway sử dụng Permission Check Service qua HTTP call (hoặc RabbitMQ).
- Tạo `@RequirePermission('orders', 'approve')` decorator để dùng trong controllers.
- Hỗ trợ permission wildcard: `*` cho toàn bộ actions của resource.
