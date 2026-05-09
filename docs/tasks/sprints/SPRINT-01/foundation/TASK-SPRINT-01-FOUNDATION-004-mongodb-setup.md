# TASK-SPRINT-01-FOUNDATION-004: Cấu hình MongoDB và Base Schema

## Thông tin

| Thuộc tính       | Giá trị                           |
|------------------|-----------------------------------|
| Task ID          | TASK-SPRINT-01-FOUNDATION-004     |
| Sprint           | Sprint 01                         |
| Cluster          | foundation                        |
| Loại             | Backend                           |
| Người phụ trách  | Backend                           |
| Story Points     | 3                                 |
| Trạng thái       | ⬜ TODO                           |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-001     |

## Mô tả

Xây dựng shared library cho MongoDB/Mongoose với kết nối chuẩn, Base Schema có sẵn các trường bắt buộc (tenantId, soft delete, timestamps), và TenantPlugin tự động inject `tenantId` vào mọi query. Đây là nền tảng data layer cho tất cả microservices.

## Phạm vi kỹ thuật

### Backend (NestJS — Shared Library `@erp/database`)

**Cấu trúc thư viện:**
```
libs/database/src/
├── database.module.ts             ← Dynamic module, nhận MONGO_URI
├── base.schema.ts                 ← Abstract base schema
├── plugins/
│   └── tenant.plugin.ts           ← Mongoose plugin tự động filter tenantId
├── utils/
│   ├── pagination.util.ts         ← Helper phân trang chuẩn
│   └── query-builder.util.ts     ← Helper tạo Mongoose query
└── index.ts
```

### Base Schema

```typescript
// libs/database/src/base.schema.ts
import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export abstract class BaseSchema {
  // Bắt buộc trong mọi collection nghiệp vụ
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId: Types.ObjectId;

  // Soft delete
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  // Auto-generated bởi Mongoose timestamps: true
  createdAt: Date;
  updatedAt: Date;
}
```

### TenantPlugin — Mongoose Plugin

Tự động thêm `{ tenantId: currentTenantId }` vào **mọi** query:

```typescript
// libs/database/src/plugins/tenant.plugin.ts
export function tenantPlugin(schema: Schema): void {
  // Intercept tất cả query methods
  const queryMethods = ['find', 'findOne', 'findOneAndUpdate',
                        'findOneAndDelete', 'count', 'countDocuments',
                        'updateMany', 'updateOne', 'deleteMany', 'deleteOne'];

  queryMethods.forEach((method) => {
    schema.pre(method, function() {
      const tenantId = this.getOptions()?.tenantId;
      if (tenantId) {
        this.where({ tenantId, isDeleted: false });
      }
    });
  });

  // Intercept save (create/update)
  schema.pre('save', function() {
    if (!this.tenantId) {
      throw new Error('tenantId là bắt buộc');
    }
    if (this.isDeleted) {
      this.deletedAt = new Date();
    }
  });
}
```

**Cách sử dụng trong microservice:**
```typescript
@Schema({ timestamps: true, plugins: [tenantPlugin] })
export class User extends BaseSchema {
  @Prop({ required: true })
  email: string;
  // ...
}
```

### Pagination Utility

```typescript
interface PaginationOptions {
  page?: number;     // default: 1
  limit?: number;    // default: 20, max: 100
  sortBy?: string;   // field name
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Helper function
async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions,
): Promise<PaginatedResult<T>>
```

### DatabaseModule — Kết nối MongoDB

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(uri: string): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri,
            // Replica set bắt buộc cho transactions
            replicaSet: 'rs0',
            // Connection pool
            maxPoolSize: 10,
            minPoolSize: 2,
            // Timeouts
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Auto index chỉ bật khi dev
            autoIndex: process.env.NODE_ENV !== 'production',
          }),
        }),
      ],
      exports: [MongooseModule],
    };
  }
}
```

### Database (MongoDB)

**Collections cơ sở (dùng trong Sprint 01):**

| Collection              | Service sở hữu  | tenantId | Mô tả                            |
|-------------------------|-----------------|----------|----------------------------------|
| `tenants`               | tenant-service  | Không    | Platform-level, không có tenantId |
| `subscription_plans`    | tenant-service  | Không    | System-level plans               |
| `users`                 | user-service    | Có       | Người dùng trong tenant          |
| `refresh_tokens`        | auth-service    | Có       | JWT refresh tokens               |
| `password_reset_tokens` | auth-service    | Có       | OTP reset mật khẩu               |
| `departments`           | user-service    | Có       | Phòng ban/đơn vị                 |
| `roles`                 | rbac-service    | Có       | Vai trò                          |
| `permissions`           | rbac-service    | Có       | Quyền hạn                        |
| `user_roles`            | rbac-service    | Có       | Gán vai trò cho user             |

**Indexes bắt buộc (áp dụng cho mọi collection có tenantId):**
```
{ tenantId: 1 }                        — Mandatory
{ tenantId: 1, isDeleted: 1 }          — Soft delete queries
{ tenantId: 1, createdAt: -1 }         — Pagination default sort
{ tenantId: 1, <domain_field>: 1 }     — Domain-specific queries
```

## API Endpoints

Không có — đây là shared library.

## Acceptance Criteria

- [ ] `DatabaseModule.forRoot(uri)` kết nối MongoDB Replica Set thành công
- [ ] `BaseSchema` được extend đúng trong tất cả domain schemas
- [ ] `TenantPlugin` tự động thêm `tenantId` và `isDeleted: false` vào mọi `find*` query
- [ ] Soft delete: gọi `isDeleted = true` → document không xuất hiện trong query thông thường
- [ ] `paginate()` utility trả về đúng `meta.total`, `meta.totalPages`
- [ ] Indexes được tạo tự động khi service khởi động (dev environment)
- [ ] Unit test coverage ≥ 80% cho plugins và utilities
- [ ] Integration test với MongoDB thực (dùng `@testcontainers/mongodb`)
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter
- [ ] Không có query nào thiếu tenantId filter (kiểm tra qua code review checklist)

## Ghi chú kỹ thuật

- `@nestjs/mongoose` v10+ với Mongoose v8.
- Dùng `mongoose-lean-virtuals` để tối ưu performance khi dùng `.lean()`.
- `tenantPlugin` phải là **first plugin** trong schema để đảm bảo luôn chạy trước.
- Tạo `AbstractRepository<T>` pattern với các methods cơ bản: `findAll`, `findById`, `create`, `updateById`, `softDelete`.
- Trong production: MongoDB Atlas với M10+ cluster, bật audit logging.
- Cân nhắc `mongoose-paginate-v2` thay vì tự viết pagination để tiết kiệm thời gian.
- Shared library được build với `@nestjs/cli` workspaces (`nest generate library database`).
