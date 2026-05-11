# TASK-SPRINT-01-FOUNDATION-004: Cấu hình MongoDB và Base Schema

## Thông tin

| Thuộc tính      | Giá trị                       |
| --------------- | ----------------------------- |
| Task ID         | TASK-SPRINT-01-FOUNDATION-004 |
| Sprint          | Sprint 01                     |
| Cluster         | foundation                    |
| Loại            | Backend                       |
| Người phụ trách | Backend                       |
| Story Points    | 3                             |
| Trạng thái      | 🟡 REVIEW                     |
| Phụ thuộc       | TASK-SPRINT-01-FOUNDATION-001 |

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
import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";

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
  const queryMethods = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "count",
    "countDocuments",
    "updateMany",
    "updateOne",
    "deleteMany",
    "deleteOne",
  ];

  queryMethods.forEach((method) => {
    schema.pre(method, function () {
      const tenantId = this.getOptions()?.tenantId;
      if (tenantId) {
        this.where({ tenantId, isDeleted: false });
      }
    });
  });

  // Intercept save (create/update)
  schema.pre("save", function () {
    if (!this.tenantId) {
      throw new Error("tenantId là bắt buộc");
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
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
  sortBy?: string; // field name
  sortOrder?: "asc" | "desc";
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
): Promise<PaginatedResult<T>>;
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
            replicaSet: "rs0",
            // Connection pool
            maxPoolSize: 10,
            minPoolSize: 2,
            // Timeouts
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Auto index chỉ bật khi dev
            autoIndex: process.env.NODE_ENV !== "production",
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

| Collection              | Service sở hữu | tenantId | Mô tả                             |
| ----------------------- | -------------- | -------- | --------------------------------- |
| `tenants`               | tenant-service | Không    | Platform-level, không có tenantId |
| `subscription_plans`    | tenant-service | Không    | System-level plans                |
| `users`                 | user-service   | Có       | Người dùng trong tenant           |
| `refresh_tokens`        | auth-service   | Có       | JWT refresh tokens                |
| `password_reset_tokens` | auth-service   | Có       | OTP reset mật khẩu                |
| `departments`           | user-service   | Có       | Phòng ban/đơn vị                  |
| `roles`                 | rbac-service   | Có       | Vai trò                           |
| `permissions`           | rbac-service   | Có       | Quyền hạn                         |
| `user_roles`            | rbac-service   | Có       | Gán vai trò cho user              |

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

- [ ] `DatabaseModule.forRoot(uri)` kết nối MongoDB Replica Set thành công (đã triển khai module, chưa chạy integration với MongoDB thật)
- [ ] `BaseSchema` được extend đúng trong tất cả domain schemas (mới cung cấp base class, chưa có domain schema để verify)
- [x] `TenantPlugin` tự động thêm `tenantId` và `isDeleted: false` vào mọi `find*` query
- [x] Soft delete: gọi `isDeleted = true` → document không xuất hiện trong query thông thường (enforce qua plugin filter)
- [x] `paginate()` utility trả về đúng `meta.total`, `meta.totalPages`
- [ ] Indexes được tạo tự động khi service khởi động (dev environment) (chưa đủ domain schemas/indexes)
- [x] Unit test coverage ≥ 80% cho plugins và utilities (coverage focused cho plugin/utils đạt 100% statements/lines)
- [ ] Integration test với MongoDB thực (dùng `@testcontainers/mongodb`)
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter (đã verify logic plugin ở unit-level; chưa verify toàn bộ domain query runtime)
- [ ] Không có query nào thiếu tenantId filter (kiểm tra qua code review checklist)

## Ghi chú kỹ thuật

- `@nestjs/mongoose` v10+ với Mongoose v8.
- Dùng `mongoose-lean-virtuals` để tối ưu performance khi dùng `.lean()`.
- `tenantPlugin` phải là **first plugin** trong schema để đảm bảo luôn chạy trước.
- Tạo `AbstractRepository<T>` pattern với các methods cơ bản: `findAll`, `findById`, `create`, `updateById`, `softDelete`.
- Trong production: MongoDB Atlas với M10+ cluster, bật audit logging.
- Cân nhắc `mongoose-paginate-v2` thay vì tự viết pagination để tiết kiệm thời gian.
- Shared library được build với `@nestjs/cli` workspaces (`nest generate library database`).

## Kết quả Unit Test

**Lần chạy:** 2026-05-10
**Lệnh:** `npm run test -- --runInBand`
**Kết quả:** ✅ PASS

| Test suite              | Tests | Passed | Failed |
| ----------------------- | ----: | -----: | -----: |
| tenant.plugin.spec.ts   |     3 |      3 |      0 |
| pagination.util.spec.ts |     1 |      1 |      0 |

**Evidence:**

```text
PASS src/shared-tests/tenant.plugin.spec.ts
PASS src/shared-tests/redis.service.spec.ts
PASS src/app.controller.spec.ts
PASS src/shared-tests/pagination.util.spec.ts
Test Suites: 4 passed, 4 total
Tests: 7 passed, 7 total
```

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-10
**Trạng thái:** 🟡 REVIEW

**Files đã tạo / sửa (task 004):**

- `libs/shared/database/index.ts`
- `libs/shared/database/database.module.ts`
- `libs/shared/database/base.schema.ts`
- `libs/shared/database/plugins/tenant.plugin.ts`
- `libs/shared/database/utils/pagination.util.ts`
- `libs/shared/database/utils/query-builder.util.ts`

**Blocker / phần còn thiếu:**

- Chưa thực hiện integration test MongoDB thật (bao gồm testcontainers) nên chưa xác nhận đầy đủ replica set và index runtime.
- Chưa có domain schemas thực tế để xác nhận AC “BaseSchema được extend đúng trong tất cả domain schemas”.

## QA Regression tuần 1 (2026-05-11)

**Lệnh xác minh:**

```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
```

**Kết quả:**

- Build/test backend PASS, plugin tenant và pagination utility vẫn pass.
- Chưa có evidence integration MongoDB thật cho `DatabaseModule.forRoot`, auto index runtime và tenant filter toàn bộ domain queries.

**Đánh giá QA:**

- Trạng thái giữ `🟡 REVIEW`.

## Vòng hoàn thiện REVIEW (2026-05-11)

### Evidence code/test bổ sung

- Mở rộng test tenant plugin tại `src/shared-tests/tenant.plugin.spec.ts`:
  - Verify inject `{ tenantId, isDeleted: false }` khi có tenant option.
  - Verify không inject filter khi thiếu tenant option.
  - Verify soft-delete/on-save behavior.
- Bổ sung test query utility tại `src/shared-tests/query-builder.util.spec.ts`:
  - Verify map operator (`$in/$gte/$lte`) và skip undefined.
  - Verify ưu tiên `eq` khi đồng thời có operator khác.
- Giữ test pagination utility hiện có tại `src/shared-tests/pagination.util.spec.ts`.

### Lệnh đã chạy

```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
npx jest --rootDir . --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests
```

### Output summary

- Bộ lệnh chuẩn backend: ✅ PASS toàn bộ (`22/22` suites, `89/89` tests).
- Coverage focused shared libs (`libs/shared`): ✅ PASS (`6/6` suites, `14/14` tests).
- Coverage chi tiết phần database:
  - `libs/shared/database/plugins/tenant.plugin.ts`: `100%` statements, `100%` lines.
  - `libs/shared/database/utils/pagination.util.ts`: `100%` statements, `100%` lines.
  - `libs/shared/database/utils/query-builder.util.ts`: `100%` statements, `100%` lines.
  - `libs/shared/database/database.module.ts`: chưa được cover runtime (`0%`) do chưa có Mongo integration/container test.

### Limitation hiện tại

- Chưa có MongoDB runtime/Testcontainers trong môi trường hiện tại để xác nhận `DatabaseModule.forRoot` kết nối replica set thật và auto-index runtime.
- Chưa có đủ domain schema/query runtime để xác minh toàn bộ query đều áp tenant filter ngoài phạm vi plugin/unit tests.

### Đánh giá trạng thái task

- Task giữ `🟡 REVIEW`.
- Lý do chưa chuyển `🟢 DONE`:
  - Chưa có integration test MongoDB thật.
  - AC liên quan auto-index runtime và tenant filter toàn bộ domain query chưa có evidence integration đủ mạnh.

## QA Retest vòng bổ sung evidence (2026-05-11)

### Evidence xác minh độc lập trong vòng retest

- `npx jest --rootDir . --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests`: ✅ PASS (`6/6` suites, `14/14` tests).
- Coverage phần database trong shared libs:
  - `libs/shared/database/plugins/tenant.plugin.ts`: `100%` statements/lines.
  - `libs/shared/database/utils/pagination.util.ts`: `100%` statements/lines.
  - `libs/shared/database/utils/query-builder.util.ts`: `100%` statements/lines.
  - `libs/shared/database/database.module.ts`: `0%` runtime coverage (chưa có integration MongoDB).

### Kết luận QA Regression

- **Quyết định:** `🟡 REVIEW`.
- **Lý do:** Chưa có evidence integration cho kết nối replica set thật, auto-index runtime và enforcement tenant filter ở domain query thực tế.
- **Điều kiện cần để close lần kế tiếp:**
  - Bổ sung integration test MongoDB (ưu tiên Testcontainers) cho `DatabaseModule.forRoot`.
  - Bổ sung evidence auto-index runtime khi service khởi động.
  - Xác minh tenant filter trên domain schema/query thực tế (sau khi các service domain Sprint 01 hoàn tất).

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** 🟡 REVIEW
- **Lý do chốt:** Đã có evidence unit test tốt cho plugin/utils nhưng thiếu evidence integration MongoDB runtime theo AC.
- **Evidence tham chiếu:** `database.module.ts` chưa có runtime coverage/integration cho replica set và auto-index.

## QA Final Retest (2026-05-11)

**Ngày thực hiện:** 2026-05-11  
**Người thực hiện:** Senior QA  
**Phạm vi:** Retest cuối Sprint 01

### Evidence build / test / coverage

```text
> npm run build
> nest build
✅ PASS (exit 0)

> npm test -- --passWithNoTests --runInBand
Test Suites: 22 passed, 22 total
Tests:       89 passed, 89 total
Time:        16.439 s
✅ All PASS

> npx jest --testRegex "src/shared-tests/.*\.spec\.ts$" --coverage --collectCoverageFrom "libs/shared/**/*.ts" --runInBand --passWithNoTests
  libs/shared/database/plugins/tenant.plugin.ts      : 100% statements/lines
  libs/shared/database/utils/pagination.util.ts      : 100% statements/lines
  libs/shared/database/utils/query-builder.util.ts   : 100% statements/lines
  libs/shared/database/database.module.ts            : 0% runtime (chưa có MongoDB integration)
Test Suites: 6 passed, 6 total
Tests:       14 passed, 14 total
```

### Đánh giá AC

| AC                                                            | Trạng thái | Ghi chú                                                                                               |
| ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `DatabaseModule.forRoot(uri)` kết nối MongoDB Replica Set     | ❌         | Module triển khai đúng, nhưng chưa có integration test với MongoDB thật; Docker daemon không khả dụng |
| `BaseSchema` extend đúng trong tất cả domain schemas          | ❌         | Chưa có domain schemas trong Sprint 01 để verify                                                      |
| `TenantPlugin` tự động thêm `tenantId` và `isDeleted: false`  | ✅         | `tenant.plugin.spec.ts` PASS (100% coverage)                                                          |
| Soft delete: `isDeleted = true` → không xuất hiện trong query | ✅         | Plugin filter verify qua unit test PASS                                                               |
| `paginate()` trả về đúng `meta.total`, `meta.totalPages`      | ✅         | `pagination.util.spec.ts` PASS (100% coverage)                                                        |
| Indexes tạo tự động khi service khởi động (dev)               | ❌         | Chưa có domain schemas/runtime service để xác nhận                                                    |
| Unit test coverage ≥ 80% cho plugins và utilities             | ✅         | plugins + utils: 100% statements/lines                                                                |
| Integration test với MongoDB thực (Testcontainers)            | ❌         | Docker daemon không khả dụng; không thể chạy Testcontainers                                           |
| Multi-tenancy: mọi DB query có tenantId filter                | ✅ (unit)  | Logic plugin xác nhận ở unit level; chưa có domain query runtime                                      |
| Không có query nào thiếu tenantId filter                      | ❌         | Cần code review checklist sau khi có domain services                                                  |

### Kết luận QA Final

- **Quyết định:** Giữ 🟡 REVIEW
- **Lý do:** 4 AC chưa đạt liên quan đến integration MongoDB runtime, domain schemas, và auto-index. Tất cả đều phụ thuộc hạ tầng chưa sẵn sàng trong Sprint 01.
- **Điều kiện đóng:**
  1. Bổ sung integration test MongoDB với Testcontainers cho `DatabaseModule.forRoot` (kết nối replica set, auto-index).
  2. Domain schemas từ Sprint 01 services (auth, tenant, user) implement `BaseSchema` — verify bằng code review hoặc integration test.
  3. Xác nhận không có domain query nào thiếu tenantId filter sau khi các service downstream hoàn tất.
