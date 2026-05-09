# TASK-SPRINT-02-SYSTEM_ADMIN-001: RBAC Nâng cao — Phân quyền dữ liệu và theo Workflow

## Thông tin

| Thuộc tính       | Giá trị                         |
|------------------|---------------------------------|
| Task ID          | TASK-SPRINT-02-SYSTEM_ADMIN-001 |
| Sprint           | Sprint 02                       |
| Cluster          | system-admin                    |
| Loại             | Backend                         |
| Người phụ trách  | Backend                         |
| Story Points     | 8                               |
| Trạng thái       | ⬜ TODO                         |
| Phụ thuộc        | TASK-SPRINT-01-USER-002         |

## Mô tả

Nâng cấp hệ thống RBAC cơ bản (Sprint 01) thành phân quyền nâng cao bao gồm: phân quyền theo dữ liệu (Data-Level Permissions — chỉ xem data của phòng ban mình), phân quyền theo trường dữ liệu (Field-Level Permissions — ẩn/hiện trường nhạy cảm), và phân quyền theo workflow (approve/reject actions). Sử dụng CASL.js làm Policy Engine và cache permissions bằng Redis.

## Phạm vi kỹ thuật

### Backend (NestJS — `rbac-service`, nâng cấp)

**1. Data-Level Permissions:**
```typescript
// Ví dụ: Manager chỉ xem orders của phòng ban mình
interface DataPermission {
  resource: string;       // 'orders'
  action: string;         // 'read'
  conditions: {
    departmentId?: 'own'|'subtree'|'all';
    ownerId?: 'self'|'all';
    [key: string]: unknown;
  };
}

// CASL ability definition
defineAbility((can, cannot) => {
  // Manager: xem tất cả orders trong phòng ban mình và phòng ban con
  can('read', 'Order', { departmentId: { $in: userDepartmentIds } });
  // Employee: chỉ xem orders mình tạo
  can('read', 'Order', { createdBy: user.id });
  // Tenant Admin: xem mọi orders
  can('read', 'Order');
});
```

**2. Field-Level Permissions:**
```typescript
// Ẩn trường lương (salary) với user thường
interface FieldPermission {
  resource: string;        // 'employees'
  hiddenFields: string[];  // ['salary', 'bankAccount', 'personalId']
  requiredRole: string;    // 'TENANT_ADMIN'
}

// Service method tự động mask fields
maskFields<T>(data: T, resource: string, userRoles: string[]): Partial<T>
```

**3. Workflow Permissions:**
```typescript
// Các action đặc biệt theo workflow
type WorkflowAction = 
  | 'submit'      // Nộp đề xuất
  | 'approve'     // Duyệt
  | 'reject'      // Từ chối
  | 'cancel'      // Huỷ
  | 'delegate'    // Uỷ quyền;

interface WorkflowPermission {
  resource: string;         // 'leave-requests', 'purchase-orders'
  action: WorkflowAction;
  conditions?: object;      // Điều kiện: chỉ duyệt của phòng mình
  maxAmount?: number;       // Giới hạn giá trị (PO < 100M)
}
```

**4. CASL.js Policy Engine:**
```typescript
// Cài đặt: npm install @casl/ability @casl/mongoose
import { defineAbility, AbilityBuilder } from '@casl/ability';

@Injectable()
export class AbilityService {
  async defineAbilityFor(user: UserContext): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    
    const roles = await this.getUserRoles(user.tenantId, user.userId);
    
    for (const role of roles) {
      for (const permission of role.permissions) {
        can(permission.action, permission.resource, permission.conditions);
      }
    }
    
    return build();
  }
}
```

**5. Permission Caching (Redis, TTL 5 phút):**
```
Cache key: ability:{tenantId}:{userId}
Serialize: JSON.stringify(ability.rules)
Invalidate on: role assign/revoke, role permission update, user department change
```

**6. CaslGuard cho NestJS Controllers:**
```typescript
@UseGuards(JwtAuthGuard, CaslGuard)
@CheckPermission((ability) => ability.can('approve', 'LeaveRequest'))
async approveLeaveRequest(@Param('id') id: string) { ... }
```

### Database (MongoDB)

**Cập nhật collection `roles`** — thêm fields nâng cao:

| Trường                | Kiểu   | Mô tả                                           |
|-----------------------|--------|-------------------------------------------------|
| `dataPermissions`     | array  | Mảng DataPermission (conditions per resource)   |
| `fieldPermissions`    | array  | Mảng FieldPermission (hidden fields per resource)|
| `workflowPermissions` | array  | Mảng WorkflowPermission                         |
| `maxApprovalAmount`   | object | `{ 'purchase-orders': 100000000 }` (VNĐ)        |

**Collection mới: `permission_policies`** (tenantId-scoped)

| Trường      | Kiểu     | Mô tả                                         |
|-------------|----------|-----------------------------------------------|
| `_id`       | ObjectId | —                                             |
| `tenantId`  | ObjectId | Tenant                                        |
| `name`      | string   | Tên policy                                    |
| `rules`     | array    | CASL rules serialized                         |
| `appliesTo` | array    | RoleIds áp dụng policy này                    |
| `priority`  | number   | Thứ tự ưu tiên (cao hơn = ưu tiên hơn)       |
| `createdAt` | Date     | —                                             |
| `updatedAt` | Date     | —                                             |

## API Endpoints

| Method | Path                                          | Mô tả                                         | Auth         |
|--------|-----------------------------------------------|-----------------------------------------------|--------------|
| GET    | `/api/v1/roles/:id/data-permissions`          | Xem data permissions của role                 | Tenant Admin |
| PATCH  | `/api/v1/roles/:id/data-permissions`          | Cập nhật data permissions                     | Tenant Admin |
| GET    | `/api/v1/roles/:id/field-permissions`         | Xem field permissions của role                | Tenant Admin |
| PATCH  | `/api/v1/roles/:id/field-permissions`         | Cập nhật field permissions                    | Tenant Admin |
| GET    | `/api/v1/roles/:id/workflow-permissions`      | Xem workflow permissions của role             | Tenant Admin |
| PATCH  | `/api/v1/roles/:id/workflow-permissions`      | Cập nhật workflow permissions                 | Tenant Admin |
| POST   | `/api/v1/permission-check/ability`            | Trả về CASL ability rules cho user            | Internal     |
| POST   | `/api/v1/permission-check/can`                | Kiểm tra 1 action cụ thể                      | Internal     |

## Yêu cầu bảo mật

- [ ] Data-level permissions phải được enforce ở tầng Service (không chỉ UI)
- [ ] Field masking phải được apply trước khi trả response (không sau)
- [ ] CASL rules không được expose ra client trực tiếp (chỉ expose abilities đã resolve)
- [ ] Tránh IDOR: check ownership conditions trước khi trả dữ liệu
- [ ] Privilege escalation prevention: không cho gán permission cao hơn role hiện tại

## Acceptance Criteria

- [ ] Manager chỉ xem được orders của phòng ban mình (data-level filter hoạt động)
- [ ] Employee không xem được trường `salary` trong hồ sơ nhân viên (field masking)
- [ ] Manager không thể approve PO > 100 triệu (workflow permission limit)
- [ ] CASL ability được cache Redis, không query DB mỗi request
- [ ] Cache bị invalidate khi role thay đổi → permissions mới có hiệu lực ngay
- [ ] `CaslGuard` hoạt động đúng với `@CheckPermission` decorator
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- CASL v6 với `createMongoAbility` để generate MongoDB conditions từ CASL rules.
- Serialize ability thành JSON để cache Redis, deserialize khi lấy ra.
- Field masking: implement `ResponseTransformInterceptor` check field permissions trước khi serialize response.
- Data permission conditions được convert thành MongoDB query conditions tự động (`@casl/mongoose`).
- Tài liệu: https://casl.js.org/v6/en/cookbook/roles-with-static-permissions
