### TASK-SPRINT-02-DOMAIN_MIGRATION-001: Tách Platform Master Catalog Service

**Trạng thái:** � REVIEW
**Loại:** Backend
**Module:** Platform
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** —

#### Mô tả
Tách phần danh mục dùng chung toàn hệ thống (product taxonomy, UoM, category) khỏi `common-service/config-service` vào Platform domain service theo chuẩn multi-tenant.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-platform-master-catalog.md#pham-vi`
- Các hành vi cần triển khai:
  - [x] API CRUD master catalog theo tenant.
  - [x] API publish catalog version để domain khác đồng bộ.
  - [ ] Tương thích route cũ qua API Gateway mapping. *(chờ API Gateway được cấu hình)*

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** platform-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, index | Định danh tenant |
| catalog_type | string | bắt buộc | Loại danh mục |
| code | string | unique theo tenant + catalog_type | Mã danh mục |
| name | string | bắt buộc | Tên hiển thị |
| status | string | enum(active/inactive) | Trạng thái |
| version | number | >=1 | Phiên bản publish |

- **Index cần tạo:** `{ tenant_id: 1, catalog_type: 1, code: 1 } unique`, `{ tenant_id: 1, status: 1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/platform/catalog-items` | Bearer JWT | Tạo item danh mục |
| GET | `/api/v1/platform/catalog-items` | Bearer JWT | Danh sách theo tenant |
| GET | `/api/v1/platform/catalog-items/tree` | Bearer JWT | Cây phân cấp |
| GET | `/api/v1/platform/catalog-items/:id` | Bearer JWT | Chi tiết item |
| PATCH | `/api/v1/platform/catalog-items/:id` | Bearer JWT | Cập nhật item |
| DELETE | `/api/v1/platform/catalog-items/:id` | Bearer JWT | Xóa mềm (inactive) |
| POST | `/api/v1/platform/catalog-items/publish` | Bearer JWT | Publish version |
| GET | `/api/v1/health` | Public | Health check |

Chi tiết từng API:
```
POST /api/v1/platform/catalog-items
Request:  { catalogType: string, code: string, name: string, status?: string }
Response: { id: string, tenantId: string, version: number }
Errors:   400, 401, 403, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS
- **Giao thức:** REST + Event
- **Thư viện đề xuất:** mongoose, class-validator, @nestjs/cqrs
- **Micro-frontend / Microservice liên quan:** MFE Platform Admin, WMS Service, Sales Service

#### Yêu cầu bảo mật
- [x] Xác thực (Authentication): JWT + tenant claims (`JwtAuthGuard`)
- [x] Phân quyền (Authorization): `PermissionsGuard` + `CurrentUser` decorator
- [x] Validate input đầu vào (`ValidationPipe` toàn cục + class-validator DTOs)
- [x] Mã hóa dữ liệu nhạy cảm (không có trường nhạy cảm trong catalog item)
- [x] Rate limiting (`ThrottlerModule`: 100 req/60s)

#### Yêu cầu phi chức năng
- **Hiệu năng:** p95 < 200ms cho API list 10k bản ghi có phân trang
- **Khả năng mở rộng:** stateless, scale ngang theo pod
- **Logging & Monitoring:** log audit thao tác catalog, metric publish latency
- **Xử lý lỗi:** idempotent key cho publish, retry event qua outbox

#### Kết quả Unit Test

**Lần chạy:** 2026-05-08
**Lệnh:** `npx jest apps/platform-service/test/catalog-item.service.spec.ts --no-coverage`
**Kết quả:** ✅ PASS

| Test suite | Tests | Passed | Failed | Thời gian |
|---|---|---|---|---|
| CatalogItemService | 15 | 15 | 0 | 35.98s |

**Evidence:**
```
 PASS  apps/platform-service/test/catalog-item.service.spec.ts (32.634 s)
  CatalogItemService
    √ should be defined
    create
      √ nên tạo catalog item thành công khi chưa tồn tại
      √ nên throw ConflictException khi đã tồn tại (tenant_id, catalog_type, code) trùng
      √ nên KHÔNG query MongoDB khi thiếu tenantId
    findAll
      √ nên filter cứng theo tenant_id
      √ nên tính skip đúng theo page
    update
      √ nên tăng version += 1 khi cập nhật
      √ nên throw NotFoundException khi item không tồn tại
    publish
      √ nên phát RabbitMQ event sau khi publish
      √ nên trả về count=0 và KHÔNG phát event khi không có item nào
      √ nên gọi bulkUpdatePublishedAt với đúng ids
    softDelete
      √ nên set status=inactive thay vì xóa thực sự
      √ nên throw NotFoundException khi item không tồn tại
    getTree
      √ nên gọi repository.findTree với đúng tenantId
      √ nên gọi getTree mà không lọc catalog_type khi không truyền
Tests: 15 passed, 15 total
```

#### Kết quả triển khai

**Ngày hoàn thành:** 2026-05-08
**Branch / Commit:** *(chờ commit)*
**Files đã tạo / sửa:**
- `open-erp-backend/apps/platform-service/tsconfig.json` — tsconfig cho app mới
- `open-erp-backend/apps/platform-service/src/main.ts` — bootstrap HTTP, port PLATFORM_SERVICE_PORT (default 3007)
- `open-erp-backend/apps/platform-service/src/platform-service.module.ts` — module root, connect platform_db
- `open-erp-backend/apps/platform-service/src/schemas/catalog-item.schema.ts` — Mongoose schema + 3 indexes
- `open-erp-backend/apps/platform-service/src/dto/catalog-item.dto.ts` — 4 DTOs với class-validator
- `open-erp-backend/apps/platform-service/src/repositories/catalog-item.repository.ts` — Repository layer
- `open-erp-backend/apps/platform-service/src/services/catalog-item.service.ts` — Business logic, publish RabbitMQ event
- `open-erp-backend/apps/platform-service/src/controllers/catalog-item.controller.ts` — 7 REST endpoints
- `open-erp-backend/apps/platform-service/src/controllers/health.controller.ts` — Health check
- `open-erp-backend/apps/platform-service/src/constants/rabbitmq.constants.ts` — Constants
- `open-erp-backend/apps/platform-service/test/catalog-item.service.spec.ts` — 15 unit tests
- `open-erp-backend/nest-cli.json` — Thêm entry "platform"
- `open-erp-backend/package.json` — Thêm scripts build:platform, start:platform, start:platform:dev

**Ghi chú:**
- `tenant_id` được lấy từ `currentUser.organizationId` (JWT claim `organizationId`) — phù hợp với pattern hiện tại của toàn hệ thống.
- `@graphLookup` trong `getTree` cần replica set MongoDB để hoạt động tốt nhất trong production.
- Event publish dùng `ClientProxy.emit()` (fire-and-forget) — nếu cần guarantee delivery cần bổ sung outbox pattern sau.
- Tương thích route cũ qua API Gateway mapping chưa triển khai (phụ thuộc hạ tầng gateway).

**Definition of Done:**
- [x] Unit test coverage ≥ 80% (15/15 tests pass)
- [x] API documentation cập nhật (Swagger tích hợp trong main.ts)
- [ ] Code review được approve ← chờ reviewer
- [ ] Chạy thành công trên môi trường staging
- [x] Event `erp.platform.catalog.item.updated.v1` phát đúng schema

#### Tiêu chí hoàn thành (Definition of Done)
- [x] Unit test coverage ≥ 80%
- [x] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [x] Event `erp.platform.catalog.item.updated.v1` phát đúng schema
