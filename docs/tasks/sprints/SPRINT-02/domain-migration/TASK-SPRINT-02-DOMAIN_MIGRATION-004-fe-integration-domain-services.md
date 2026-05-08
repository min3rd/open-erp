### TASK-SPRINT-02-DOMAIN_MIGRATION-004: Tích hợp FE Angular với Domain Services mới

**Trạng thái:** 🟡 REVIEW
**Loại:** Frontend
**Module:** Platform + WMS
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior Frontend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-001, TASK-SPRINT-02-DOMAIN_MIGRATION-002

---

#### Mô tả

Backend đã tách thành **platform-service** (port 3007) và **wms-service** (port 3008) thay thế cho **inventory** (port 3006) và **common-service** (port 3007 cũ). FE Angular (`open-erp-web`) hiện đang trỏ toàn bộ product/category/type/stock/wms call vào `API_URI_INVENTORY = localhost:3006`. Cần cập nhật để tích hợp đúng với domain service mới, đồng thời tạo service Angular cho `platform-service` (catalog items: uom, category, productType, tag).

---

#### Yêu cầu chức năng

##### 1. Cập nhật `src/core/constant.ts`
File đã được PM cập nhật sơ bộ — cần xem lại và đảm bảo đúng:
```
API_URI_PLATFORM = 'http://localhost:3007'   // platform-service
API_URI_WMS      = 'http://localhost:3008'   // wms-service
```
Giữ nguyên `API_URI_INVENTORY` và các legacy constants vì một số module chưa migrate.

##### 2. Tạo `src/core/services/catalog/catalog.service.ts`
Angular service mới cho platform-service endpoints. Phải hỗ trợ đầy đủ:

**Endpoints backend** (base: `API_URI_PLATFORM/v1/platform/catalog-items`):
- `GET /` — danh sách, params: `{ page, limit, catalog_type, status, q }`
- `POST /` — tạo mới catalog item
- `GET /tree` — lấy cây danh mục theo catalog_type
- `POST /publish` — publish hàng loạt items
- `GET /:id` — lấy một item
- `PATCH /:id` — cập nhật
- `DELETE /:id` — xóa mềm

**Types cần định nghĩa** (khớp với backend DTO):
```typescript
export type CatalogType = 'uom' | 'category' | 'product_type' | 'tag' | 'attribute';
export type CatalogItemStatus = 'active' | 'inactive';

export interface CatalogItem {
  id: string;
  tenant_id: string;
  catalog_type: CatalogType;
  code: string;
  name: string;
  org_id?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
  status: CatalogItemStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogItemDto {
  catalogType: CatalogType;
  code: string;
  name: string;
  orgId?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
  status?: CatalogItemStatus;
}

export interface QueryCatalogItemParams {
  page?: number;
  limit?: number;
  catalog_type?: CatalogType;
  status?: CatalogItemStatus;
  q?: string;
}
```

##### 3. Cập nhật `src/core/services/product-category/product-category.service.ts`
- Thay `API_URI_INVENTORY` → `API_URI_PLATFORM` cho các endpoint category
- **Lưu ý**: backend platform-service route là `/v1/platform/catalog-items` với query `catalog_type=category`
- Giữ nguyên interface `ProductCategory` nhưng map từ `CatalogItem`

##### 4. Cập nhật `src/core/services/product-type/product-type.service.ts`
- Tương tự: thay endpoint → platform-service với `catalog_type=product_type`
- Giữ nguyên interface `ProductType` nhưng map từ `CatalogItem`

##### 5. Cập nhật `src/core/services/stock/stock.service.ts`
- Thay `API_URI_INVENTORY/v1/inventory` → `API_URI_WMS/v1/wms/stocks`
- Đường dẫn mới: `GET /v1/wms/stocks`, `POST /v1/wms/stocks/adjust`
- Giữ nguyên tất cả types và interfaces hiện tại

##### 6. Cập nhật `src/core/services/wms/wms.service.ts`
- Thay `API_URI_INVENTORY` → `API_URI_WMS` cho toàn bộ receipt/picklist/shipment endpoints
- Đường dẫn backend wms-service hiện tại: `/v1/wms/` (xem note bên dưới)

##### 7. Cập nhật `src/core/services/warehouse/warehouse.service.ts`
- Thay `API_URI_INVENTORY` → `API_URI_WMS` nếu warehouse đã được serve từ wms-service
- **Lưu ý quan trọng**: wms-service hiện chưa có WarehouseController — cần giữ `API_URI_INVENTORY` tạm thời cho đến khi wms-service bổ sung. Hãy thêm comment `// TODO: migrate to API_URI_WMS khi wms-service bổ sung WarehouseController`

---

#### Lưu ý kỹ thuật

1. **Backward compatibility**: Không được break các module FE đang hoạt động. Các service đang dùng `API_URI_INVENTORY` mà chưa có endpoint tương ứng ở domain service mới — giữ nguyên với comment TODO.

2. **HTTP interceptor**: FE đã có `src/core/interceptors/` — kiểm tra xem có interceptor nào hardcode base URL không, nếu có thì cập nhật.

3. **Pattern catalog service**: Dùng pattern tương tự các service hiện có (inject HttpClient, dùng `map(unwrapApiResponse)` hoặc tương đương). Xem `product.service.ts` làm tham chiếu.

4. **Tenant header**: Backend đọc `organizationId` từ JWT — FE không cần gửi thêm header riêng, đã có trong Bearer token.

5. **Versioning**: Tất cả domain service dùng URI versioning `/v1/` prefix.

---

#### Đầu ra mong đợi

- [ ] `src/core/constant.ts` — đã có `API_URI_PLATFORM` và `API_URI_WMS`
- [ ] `src/core/services/catalog/catalog.service.ts` — service mới đầy đủ
- [ ] `src/core/services/product-category/product-category.service.ts` — updated endpoint
- [ ] `src/core/services/product-type/product-type.service.ts` — updated endpoint
- [ ] `src/core/services/stock/stock.service.ts` — updated base URL
- [ ] `src/core/services/wms/wms.service.ts` — updated base URL
- [ ] `src/core/services/warehouse/warehouse.service.ts` — giữ hoặc update kèm TODO comment
- [ ] FE compile không có lỗi (`ng build` hoặc `tsc --noEmit`)

---

#### Tiêu chí hoàn thành

- [x] Không có TypeScript compile error
- [x] catalog.service.ts có đủ 7 method tương ứng 7 endpoints
- [x] product-category và product-type service trỏ đúng platform-service
- [x] stock service trỏ đúng wms-service
- [x] wms service (receipt/picklist/shipment) trỏ đúng wms-service
- [x] Không xóa/rename bất kỳ public method nào của service hiện có (không break)

---

#### Kết quả thực hiện

- **Ngày:** 2026-05-08
- **Người thực hiện:** Senior Frontend Programmer
- **Files đã thay đổi:**
  - `open-erp-web/src/core/services/catalog/catalog.service.ts` — **TẠO MỚI** — Angular service đầy đủ 7 methods cho platform-service
  - `open-erp-web/src/core/services/product-category/product-category.service.ts` — Cập nhật: import `API_URI_PLATFORM`, baseUrl → `/v1/platform/catalog-items`, thêm mapper `CatalogItem → ProductCategory`, thêm `catalog_type=category` cho list/tree, đổi `PUT` → `PATCH`
  - `open-erp-web/src/core/services/product-type/product-type.service.ts` — Cập nhật: import `API_URI_PLATFORM`, baseUrl → `/v1/platform/catalog-items`, thêm mapper `CatalogItem → ProductType`, thêm `catalog_type=product_type`, `getActiveProductTypes` dùng list + `status=active`, đổi `PUT` → `PATCH`
  - `open-erp-web/src/core/services/stock/stock.service.ts` — Cập nhật: import `API_URI_WMS`, baseUrl → `${API_URI_WMS}/v1/wms/stocks`
  - `open-erp-web/src/core/services/wms/wms.service.ts` — Cập nhật: import `API_URI_WMS`, baseUrl → `${API_URI_WMS}/v1`
  - `open-erp-web/src/core/services/warehouse/warehouse.service.ts` — Thêm TODO comment, giữ nguyên `API_URI_INVENTORY`
- **TypeScript compile:** PASS (`npx tsc --noEmit` không có lỗi)
- **Ghi chú:**
  - `constant.ts` đã đúng từ bước PM chuẩn bị, không cần sửa
  - `warehouse.service.ts` giữ `API_URI_INVENTORY` vì wms-service chưa có `WarehouseController`
  - Các method của `ProductCategoryService` như `getRoots()`, `getChildren()`, `getDescendants()` giữ nguyên URL pattern — sẽ lỗi runtime cho đến khi backend bổ sung endpoint tương ứng
  - `stock.service.ts`: chỉ `GET /wms/stocks` và `POST /wms/stocks/adjust` là hoạt động; các method khác (lots, serials, transactions) chờ backend mở rộng

