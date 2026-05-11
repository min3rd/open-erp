# TASK-SPRINT-02-SYSTEM_ADMIN-003: Catalog Service — Danh mục dùng chung

## Thông tin

| Thuộc tính      | Giá trị                         |
| --------------- | ------------------------------- |
| Task ID         | TASK-SPRINT-02-SYSTEM_ADMIN-003 |
| Sprint          | Sprint 02                       |
| Cluster         | system-admin                    |
| Loại            | Backend                         |
| Người phụ trách | Backend                         |
| Story Points    | 5                               |
| Trạng thái      | ⬜ TODO                         |
| Phụ thuộc       | TASK-SPRINT-01-TENANT-001       |

## Mô tả

Xây dựng `catalog-service` — microservice quản lý danh mục dữ liệu dùng chung trong toàn hệ thống. Danh mục có thể thuộc về tenant (tùy chỉnh) hoặc toàn nền tảng (system-wide). Hỗ trợ nhiều loại danh mục (nhóm khách hàng, loại sản phẩm, loại nghỉ phép, v.v.), nhập/xuất hàng loạt, và versioning.

## Phạm vi kỹ thuật

### Backend (NestJS — `catalog-service`, port 3005)

**Cấu trúc module:**

```
src/
├── catalog.module.ts
├── main.ts
├── catalogs/
│   ├── catalogs.controller.ts
│   ├── catalogs.service.ts
│   ├── schemas/
│   │   └── catalog.schema.ts
│   └── dto/
│       ├── create-catalog.dto.ts
│       ├── update-catalog.dto.ts
│       └── bulk-import-catalog.dto.ts
├── catalog-types/
│   ├── catalog-types.service.ts
│   └── constants/
│       └── system-catalog-types.ts   ← Danh mục system mặc định
├── import-export/
│   └── import-export.service.ts
└── events/
    └── tenant.handler.ts              ← Subscribe tenant.created
```

**Catalog Types (Loại danh mục) mặc định:**

| Type Code            | Tên hiển thị           | Module sử dụng   |
| -------------------- | ---------------------- | ---------------- |
| `customer_group`     | Nhóm khách hàng        | Sale             |
| `product_category`   | Danh mục sản phẩm      | Sale, Inventory  |
| `product_unit`       | Đơn vị tính            | Sale, Inventory  |
| `leave_type`         | Loại nghỉ phép         | HR               |
| `document_type`      | Loại tài liệu          | Office           |
| `task_priority`      | Mức độ ưu tiên task    | Office           |
| `task_status`        | Trạng thái task        | Office           |
| `contract_type`      | Loại hợp đồng lao động | HR               |
| `expense_category`   | Danh mục chi phí       | Accounting       |
| `payment_method`     | Phương thức thanh toán | Accounting, Sale |
| `warehouse_location` | Vị trí kho             | Inventory        |
| `supplier_category`  | Loại nhà cung cấp      | Purchase         |
| `department_type`    | Loại phòng ban         | HR               |

**Catalog Schema:**

```typescript
interface CatalogItem {
  _id: ObjectId;
  tenantId: ObjectId | null; // null = system-wide catalog
  type: string; // 'customer_group', 'leave_type', ...
  code: string; // Mã định danh duy nhất trong type+tenant
  name: string; // Tên hiển thị
  description?: string;
  color?: string; // Hex color (cho UI badge)
  icon?: string; // Icon name
  metadata?: object; // Extra fields theo type
  parentId?: ObjectId; // Danh mục cha (hierarchical catalogs)
  order?: number; // Thứ tự hiển thị
  isActive: boolean; // default: true
  isSystem: boolean; // System catalog, không xóa được
  version: number; // Optimistic concurrency
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Metadata ví dụ theo type:**

```typescript
// leave_type metadata
{
  maxDaysPerYear: 12,
  isPaid: true,
  requiresApproval: true,
  gender: 'all' | 'female' | 'male',
}

// task_priority metadata
{
  level: 1,         // 1=Low, 2=Medium, 3=High, 4=Critical
  color: '#ff4d4f',
  slaHours: 4,
}

// payment_method metadata
{
  requiresBankAccount: true,
  feePercent: 0,
}
```

**Khi nhận event `tenant.created`:**

```typescript
// Tạo system catalogs mặc định cho tenant mới
async handleTenantCreated(data: TenantCreatedEvent) {
  const systemCatalogs = await this.catalogModel.find({ tenantId: null, isSystem: true });

  // Clone system catalogs cho tenant (hoặc chỉ link tham chiếu)
  const defaultCatalogs = this.getDefaultCatalogsForPlan(data.plan);
  await this.catalogModel.insertMany(
    defaultCatalogs.map(c => ({ ...c, tenantId: data.tenantId, isSystem: true }))
  );
}
```

**Bulk Import (CSV/JSON):**

```typescript
// Nhập hàng loạt catalogs từ CSV
// Format CSV: code,name,description,metadata
// Validation: code unique per type+tenant, required fields
// Error handling: trả về list lỗi từng row, không fail toàn bộ
async bulkImport(
  tenantId: string,
  type: string,
  file: Express.Multer.File
): Promise<{ success: number; errors: ImportError[] }>
```

### Database (MongoDB)

**Collection: `catalogs`** (Mixed: system-level khi `tenantId=null`, tenant-level khi có `tenantId`)

| Trường        | Kiểu     | Ràng buộc             | Mô tả                    |
| ------------- | -------- | --------------------- | ------------------------ |
| `_id`         | ObjectId | —                     | Primary key              |
| `tenantId`    | ObjectId | nullable, indexed     | null = system-wide       |
| `type`        | string   | required, indexed     | Loại danh mục            |
| `code`        | string   | required              | Mã code                  |
| `name`        | string   | required              | Tên hiển thị             |
| `description` | string   | optional              | Mô tả                    |
| `color`       | string   | optional              | Hex color                |
| `icon`        | string   | optional              | Icon name                |
| `metadata`    | object   | optional              | Thêm thông tin theo type |
| `parentId`    | ObjectId | optional, null = root | Danh mục cha             |
| `order`       | number   | default: 0            | Thứ tự                   |
| `isActive`    | boolean  | default: true         | Còn sử dụng không        |
| `isSystem`    | boolean  | default: false        | Không xóa được           |
| `version`     | number   | default: 1            | Optimistic concurrency   |
| `isDeleted`   | boolean  | default: false        | Soft delete              |
| `createdAt`   | Date     | auto                  | —                        |
| `updatedAt`   | Date     | auto                  | —                        |

**Indexes:**

```
{ tenantId: 1, type: 1, code: 1 }    — unique (sparse cho null tenantId)
{ tenantId: 1, type: 1, isActive: 1 }
{ tenantId: 1, type: 1, parentId: 1 }
{ tenantId: 1, type: 1, order: 1 }
```

## API Endpoints

| Method | Path                           | Mô tả                                   | Auth         |
| ------ | ------------------------------ | --------------------------------------- | ------------ |
| GET    | `/api/v1/catalogs`             | Danh sách catalogs (filter by type)     | Any user     |
| GET    | `/api/v1/catalogs/types`       | Danh sách catalog types                 | Any user     |
| POST   | `/api/v1/catalogs`             | Tạo catalog item mới                    | Tenant Admin |
| GET    | `/api/v1/catalogs/:id`         | Chi tiết catalog item                   | Any user     |
| PATCH  | `/api/v1/catalogs/:id`         | Cập nhật catalog item                   | Tenant Admin |
| DELETE | `/api/v1/catalogs/:id`         | Xoá mềm catalog (nếu không phải system) | Tenant Admin |
| POST   | `/api/v1/catalogs/bulk-import` | Nhập hàng loạt từ CSV                   | Tenant Admin |
| GET    | `/api/v1/catalogs/export`      | Xuất CSV                                | Tenant Admin |
| PATCH  | `/api/v1/catalogs/reorder`     | Sắp xếp lại thứ tự                      | Tenant Admin |

**Query params mẫu:**

```
GET /api/v1/catalogs
  ?type=leave_type
  &isActive=true
  &search=nghỉ
  &includeSystem=true      ← Bao gồm cả system catalogs
```

## Yêu cầu bảo mật

- [ ] Tenant chỉ xem được catalogs của mình và system catalogs
- [ ] System catalogs (`isSystem: true`) không được phép DELETE
- [ ] Code catalog phải unique trong cùng type + tenant
- [ ] Bulk import: giới hạn 1000 items mỗi lần, max file size 5MB

## Acceptance Criteria

- [ ] Nhận event `tenant.created` → tạo các catalog mặc định theo plan
- [ ] CRUD catalog items hoạt động với tenantId isolation
- [ ] Bao gồm system catalogs (`tenantId=null`) khi query
- [ ] Bulk import CSV: validate từng row, trả về errors chi tiết
- [ ] Export CSV: download file đúng format
- [ ] Reorder: thay đổi order của nhiều items trong một request
- [ ] Publish event `catalog.updated` khi có thay đổi
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: tenant A không thể xem catalogs của tenant B

## Ghi chú kỹ thuật

- System catalogs seed từ file JSON khi service khởi động (nếu DB trống).
- Hierarchical catalogs (parentId): dùng `$graphLookup` để lấy full tree.
- Caching: catalog list được cache Redis 5 phút, invalidate khi có CRUD.
- Bulk import dùng `papaparse` để parse CSV.
- Versioning dùng `version` field + Mongoose `versionKey` cho optimistic locking.
