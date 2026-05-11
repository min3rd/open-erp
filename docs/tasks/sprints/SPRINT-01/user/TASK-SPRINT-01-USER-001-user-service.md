# TASK-SPRINT-01-USER-001: User Service — Quản lý người dùng và phòng ban

## Thông tin

| Thuộc tính      | Giá trị                                            |
| --------------- | -------------------------------------------------- |
| Task ID         | TASK-SPRINT-01-USER-001                            |
| Sprint          | Sprint 01                                          |
| Cluster         | user                                               |
| Loại            | Backend                                            |
| Người phụ trách | Backend                                            |
| Story Points    | 8                                                  |
| Trạng thái      | � REVIEW                                           |
| Phụ thuộc       | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-TENANT-001 |

## Mô tả

Xây dựng `user-service` — microservice quản lý người dùng (tenantId-scoped) và cơ cấu phòng ban trong từng tenant. Bao gồm CRUD người dùng, quản lý hồ sơ cá nhân, upload avatar, quản lý cây phòng ban/đơn vị. Subscribe event `tenant.created` để tự động tạo Tenant Admin user mặc định.

## Phạm vi kỹ thuật

### Backend (NestJS — `user-service`, port 3003)

**Cấu trúc module:**

```
src/
├── user.module.ts
├── main.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── schemas/
│   │   └── user.schema.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── update-profile.dto.ts
├── departments/
│   ├── departments.controller.ts
│   ├── departments.service.ts
│   ├── schemas/
│   │   └── department.schema.ts
│   └── dto/
│       ├── create-department.dto.ts
│       └── update-department.dto.ts
├── avatar/
│   └── avatar.service.ts          ← Upload avatar lên MinIO
└── events/
    └── tenant.handler.ts          ← Subscribe tenant.created
```

**Luồng tạo Tenant Admin mặc định khi nhận `tenant.created`:**

```typescript
@EventPattern('tenant.created')
async handleTenantCreated(data: TenantCreatedEvent) {
  // Tạo Tenant Admin user
  const adminUser = await this.usersService.create({
    tenantId: data.tenantId,
    email: data.adminEmail,
    fullName: 'Quản trị viên',
    status: 'ACTIVE',
    isSystemUser: true,
  });

  // Publish user.created event
  await this.rabbitmqService.publishEvent('user.created', data.tenantId, adminUser.id, {
    userId: adminUser.id,
    email: adminUser.email,
    role: 'TENANT_ADMIN',
  });
}
```

**Cây phòng ban (Department Tree):**

```
Công ty ACME
├── Ban Giám Đốc
│   └── Văn Phòng BGĐ
├── Phòng Kinh Doanh
│   ├── KD Miền Bắc
│   └── KD Miền Nam
└── Phòng Kỹ Thuật
    ├── Dev Frontend
    └── Dev Backend
```

- Dùng `parentId` để duy trì cấu trúc cây (không dùng nested sets — đơn giản hơn khi write).
- API trả về tree structure (recursive build hoặc `$graphLookup` MongoDB).

**Avatar Upload:**

```typescript
// Upload avatar lên MinIO
// Bucket: tenant-{tenantId}/avatars/{userId}-{timestamp}.{ext}
// Max size: 5MB
// Allowed types: image/jpeg, image/png, image/webp
// Auto-resize: 200x200 (thumbnail) + 800x800 (original)
```

### Database (MongoDB)

**Collection: `users`** (tenantId-scoped, thuộc user-service)

| Trường          | Kiểu     | Ràng buộc                    | Mô tả                           |
| --------------- | -------- | ---------------------------- | ------------------------------- |
| `_id`           | ObjectId | —                            | Primary key                     |
| `tenantId`      | ObjectId | required, indexed            | Tenant sở hữu                   |
| `email`         | string   | required, lowercase          | Email đăng nhập (unique/tenant) |
| `passwordHash`  | string   | optional                     | null nếu chỉ OAuth              |
| `fullName`      | string   | required                     | Họ và tên đầy đủ                |
| `phone`         | string   | optional                     | Số điện thoại                   |
| `avatarUrl`     | string   | optional                     | MinIO URL                       |
| `departmentId`  | ObjectId | optional                     | Phòng ban                       |
| `positionTitle` | string   | optional                     | Chức danh (text)                |
| `managerId`     | ObjectId | optional                     | Người quản lý trực tiếp         |
| `employeeCode`  | string   | optional                     | Mã nhân viên                    |
| `status`        | enum     | ACTIVE/INACTIVE/LOCKED       | Trạng thái tài khoản            |
| `mfaEnabled`    | boolean  | default: false               | —                               |
| `mfaSecret`     | string   | encrypted                    | —                               |
| `authProvider`  | enum     | LOCAL/GOOGLE/MICROSOFT/MIXED | Phương thức đăng nhập           |
| `oauthAccounts` | array    | —                            | OAuth linked accounts           |
| `lastLoginAt`   | Date     | —                            | —                               |
| `locale`        | string   | default: 'vi-VN'             | Ngôn ngữ cá nhân                |
| `timezone`      | string   | default: 'Asia/Ho_Chi_Minh'  | Múi giờ cá nhân                 |
| `isSystemUser`  | boolean  | default: false               | User tự động tạo bởi hệ thống   |
| `isDeleted`     | boolean  | default: false               | Soft delete                     |
| `deletedAt`     | Date     | —                            | —                               |
| `createdAt`     | Date     | auto                         | —                               |
| `updatedAt`     | Date     | auto                         | —                               |

**Indexes:**

```
{ tenantId: 1, email: 1 }           — unique
{ tenantId: 1, status: 1 }
{ tenantId: 1, departmentId: 1 }
{ tenantId: 1, managerId: 1 }
{ tenantId: 1, isDeleted: 1 }
{ tenantId: 1, employeeCode: 1 }    — unique (sparse)
```

**Collection: `departments`** (tenantId-scoped)

| Trường      | Kiểu     | Ràng buộc             | Mô tả                          |
| ----------- | -------- | --------------------- | ------------------------------ |
| `_id`       | ObjectId | —                     | Primary key                    |
| `tenantId`  | ObjectId | required, indexed     | Tenant sở hữu                  |
| `name`      | string   | required              | Tên phòng ban                  |
| `code`      | string   | optional              | Mã phòng ban (unique/tenant)   |
| `parentId`  | ObjectId | optional, null = root | Phòng ban cha                  |
| `managerId` | ObjectId | optional              | Trưởng phòng                   |
| `level`     | number   | auto                  | Cấp độ (0 = root)              |
| `path`      | string   | auto                  | `/id1/id2/id3` — ancestor path |
| `order`     | number   | default: 0            | Thứ tự hiển thị                |
| `headcount` | number   | auto                  | Số nhân viên                   |
| `isDeleted` | boolean  | default: false        | Soft delete                    |
| `createdAt` | Date     | auto                  | —                              |
| `updatedAt` | Date     | auto                  | —                              |

**Indexes:**

```
{ tenantId: 1, parentId: 1 }
{ tenantId: 1, code: 1 }        — unique (sparse)
{ tenantId: 1, path: 1 }        — prefix query cho subtree
```

## API Endpoints

| Method | Path                              | Mô tả                                   | Auth         |
| ------ | --------------------------------- | --------------------------------------- | ------------ |
| GET    | `/api/v1/users`                   | Danh sách users (filter, phân trang)    | Tenant Admin |
| POST   | `/api/v1/users`                   | Tạo user mới                            | Tenant Admin |
| GET    | `/api/v1/users/me`                | Hồ sơ cá nhân người dùng hiện tại       | Any user     |
| PATCH  | `/api/v1/users/me`                | Cập nhật hồ sơ cá nhân                  | Any user     |
| GET    | `/api/v1/users/:id`               | Chi tiết user                           | Tenant Admin |
| PATCH  | `/api/v1/users/:id`               | Cập nhật thông tin user                 | Tenant Admin |
| DELETE | `/api/v1/users/:id`               | Xoá mềm user                            | Tenant Admin |
| POST   | `/api/v1/users/:id/avatar`        | Upload avatar (multipart)               | Owner/Admin  |
| PATCH  | `/api/v1/users/:id/status`        | Khoá/mở tài khoản                       | Tenant Admin |
| GET    | `/api/v1/departments`             | Danh sách phòng ban (flat list)         | Any user     |
| GET    | `/api/v1/departments/tree`        | Cây phòng ban (nested)                  | Any user     |
| POST   | `/api/v1/departments`             | Tạo phòng ban                           | Tenant Admin |
| GET    | `/api/v1/departments/:id`         | Chi tiết phòng ban                      | Any user     |
| PATCH  | `/api/v1/departments/:id`         | Cập nhật phòng ban                      | Tenant Admin |
| DELETE | `/api/v1/departments/:id`         | Xoá phòng ban (nếu không có thành viên) | Tenant Admin |
| GET    | `/api/v1/departments/:id/members` | Danh sách thành viên phòng ban          | Any user     |

## Yêu cầu bảo mật

- [ ] User chỉ xem được users trong cùng tenant (`tenantId` filter bắt buộc)
- [ ] User thường chỉ sửa được hồ sơ của mình (`/users/me`)
- [ ] Upload avatar: validate MIME type phía server (không tin client), max 5MB
- [ ] Không cho phép xoá user còn đang active với dữ liệu nghiệp vụ (cần deactivate trước)
- [ ] Email phải là unique trong cùng một tenant

## Acceptance Criteria

- [ ] Nhận event `tenant.created` → tạo Tenant Admin user mặc định
- [ ] Publish event `user.created` sau khi tạo user
- [ ] CRUD users hoạt động với tenantId isolation
- [ ] `/users/me` trả về hồ sơ của người dùng đang đăng nhập
- [ ] Upload avatar: lưu MinIO, cập nhật `avatarUrl` trong DB
- [ ] Department tree API trả về cấu trúc nested đúng
- [ ] Phân trang users: `?page=1&limit=20&search=nguyen&departmentId=xxx`
- [ ] Soft delete: user bị xoá không xuất hiện trong danh sách
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Avatar upload dùng `multer` với `memoryStorage`, sau đó stream lên MinIO (không lưu disk).
- Dùng `sharp` để resize ảnh trước khi upload (reduce storage + CDN costs).
- Department tree build dạng recursive từ flat list (hoặc `$graphLookup` aggregation).
- `path` field trong department (ví dụ: `/root/child/grandchild`) cho phép query nhanh toàn bộ subtree.
- User search: dùng MongoDB text index trên `fullName` và `email`.
- Sync data với hr-service qua event khi user được tạo/cập nhật/xoá.

## Tiến độ thực thi

- [x] Đọc SRS, kiến trúc API, database và hệ thống liên quan.
- [x] Rà soát code hiện có trong user/auth/tenant backend để xác định điểm tích hợp.
- [x] Bổ sung CRUD users, `/users/me`, soft delete, tenantId isolation.
- [x] Bổ sung department tree + members + avatar metadata.
- [x] Subscribe `tenant.created` để bootstrap Tenant Admin và publish `user.created`.

## Kết quả triển khai

- Thêm users/departments module trong backend hiện có.
- CRUD user theo tenantId, `/users/me`, soft delete, avatar metadata, department tree và members.
- Subscribe `tenant.created` qua RabbitMQ để bootstrap Tenant Admin, sau đó publish `user.created`.

## QA / Evidence

### Retest QA — 2026-05-11

**Build:** ✅ PASS (`npm run build`)  
**Tests:** ✅ PASS — 222/222 tests, 35/35 suites  
**Coverage tổng backend:** Lines **63.2%** (dưới ngưỡng AC ≥ 80%)

#### Per-file coverage (liên quan task USER-001)

| File                                 | Stmts Coverage   | AC    | Kết quả            |
| ------------------------------------ | ---------------- | ----- | ------------------ |
| `users/users.service.ts`             | **45%** (49/108) | ≥ 80% | ❌ FAIL — CRITICAL |
| `users/departments.service.ts`       | **57%** (47/82)  | ≥ 80% | ❌ FAIL            |
| `users/users.controller.ts`          | **0%** (0/29)    | ≥ 80% | ❌ FAIL — CRITICAL |
| `users/departments.controller.ts`    | **0%** (0/22)    | ≥ 80% | ❌ FAIL — CRITICAL |
| `users/avatar/avatar.service.ts`     | **0%** (0/43)    | ≥ 80% | ❌ FAIL — CRITICAL |
| `users/events/tenant.handler.ts`     | **0%** (0/12)    | ≥ 80% | ❌ FAIL            |
| `users/dto/*.ts` (các DTOs)          | **0%**           | —     | ❌ FAIL            |
| `users/schemas/user.schema.ts`       | 100%             | —     | ✅                 |
| `users/schemas/department.schema.ts` | 100%             | —     | ✅                 |

#### Chức năng đã implement (có trong production code)

- ✅ CRUD user (`createUser`, `getUserById`, `updateUser`, soft delete) với tenantId isolation
- ✅ `/users/me` — hồ sơ cá nhân
- ✅ `user.created` event publish sau khi tạo user
- ✅ `bootstrapTenantAdmin` — tạo admin mặc định khi nhận `tenant.created`
- ✅ Department: CRUD, tree structure, members
- ✅ `avatar.service.ts` — upload avatar lên MinIO
- ✅ `tenant.handler.ts` — subscribe `tenant.created` via RabbitMQ

#### Test cases hiện có (`users.service.spec.ts`, `departments.service.spec.ts`)

- ✅ `createUser publishes user.created`
- ✅ `createUser rejects duplicate email`
- ✅ `createDepartment stores nested department information`
- ✅ `getTree nests children under their parent`

#### Blocker — AC chưa đạt

1. **[BLOCKER CRITICAL]** `users.service.ts` coverage **45%** — thiếu test: `getMe`, `updateUser`, `softDeleteUser`, `lockUser`, `bootstrapTenantAdmin`, quota check khi `maxUsers` đạt giới hạn
2. **[BLOCKER CRITICAL]** `users.controller.ts` **0%** — không có test controller nào
3. **[BLOCKER CRITICAL]** `avatar.service.ts` **0%** — upload avatar, MIME validate, MinIO path — hoàn toàn chưa test
4. **[BLOCKER]** `departments.service.ts` **57%** — thiếu: `updateDepartment`, `deleteDepartment`, `getDepartmentMembers`, `getDepartmentTree` khi có nhiều tầng
5. **[BLOCKER]** `departments.controller.ts` **0%** — không có test
6. **[THIẾU TEST]** `tenant.handler.ts` **0%** — subscribe `tenant.created` → gọi `bootstrapTenantAdmin` — chưa test
7. **[THIẾU TEST]** Soft delete: user bị xoá không xuất hiện trong danh sách
8. **[THIẾU TEST]** Phân trang: `?page=1&limit=20&search=nguyen&departmentId=xxx`
9. **[THIẾU TEST]** Xoá phòng ban có thành viên → từ chối (bảo vệ toàn vẹn dữ liệu)
10. **[THIẾU TEST]** User chỉ xem được users trong cùng tenant — tenantId isolation

**Kết luận QA:** ❌ Giữ nguyên **🟡 REVIEW** — Cấu trúc module đầy đủ, nhưng phần lớn logic chưa được test. `users.service.ts` 45%, controller và avatar.service 0% là các gap nghiêm trọng.

**Điều kiện đóng task:**

- [ ] `users.service.ts` ≥ 80% — thêm test `getMe`, `updateUser`, `softDeleteUser`, `lockUser`, `bootstrapTenantAdmin`, quota-on-create
- [ ] `departments.service.ts` ≥ 80% — thêm test update/delete/members
- [ ] `users.controller.ts` ≥ 80%
- [ ] `departments.controller.ts` ≥ 80%
- [ ] `avatar.service.ts` ≥ 80% hoặc test integration khi MinIO sẵn sàng
- [ ] `tenant.handler.ts` có unit test subscribe `tenant.created` → `bootstrapTenantAdmin`
- [ ] Test: soft delete user không xuất hiện trong list
- [ ] Test: tenantId isolation (user A không thấy user của tenant B)
