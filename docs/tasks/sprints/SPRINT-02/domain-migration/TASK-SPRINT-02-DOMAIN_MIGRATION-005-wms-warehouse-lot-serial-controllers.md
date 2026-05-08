### TASK-SPRINT-02-DOMAIN_MIGRATION-005: Bổ sung WarehouseController, LotController, SerialController vào wms-service

**Trạng thái:** � REVIEW
**Loại:** Backend
**Module:** WMS
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 5 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-002

---

#### Mô tả

wms-service hiện chỉ có 4 controllers (stock, transfer, data-import, health). FE Angular đang gọi warehouse/lot/serial từ legacy `inventory` service (port 3006). Cần bổ sung 3 controllers còn thiếu vào `apps/wms-service/` để FE có thể migrate hoàn toàn sang domain service mới.

**Logic hiện có** (đã triển khai trong `apps/inventory/src/`): `WarehouseService`, `LotService`, `SerialService` + repositories + DTOs — **KHÔNG viết lại từ đầu**, chỉ bọc lại với tenant-aware pattern.

---

#### Yêu cầu chức năng

##### 1. `WarehouseController` — `controllers/warehouse.controller.ts`

**Base route:** `/wms/warehouses`  
**Pattern:** Nhận `tenantId = currentUser.organizationId` và pass xuống service.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/wms/warehouses` | Danh sách kho theo tenant (phân trang) |
| POST | `/wms/warehouses` | Tạo mới kho |
| GET | `/wms/warehouses/:id` | Chi tiết 1 kho |
| PATCH | `/wms/warehouses/:id` | Cập nhật kho |
| DELETE | `/wms/warehouses/:id` | Xóa mềm kho |

**WarehouseService** cần inject (có thể reuse `WarehouseService` từ inventory bằng cách copy class vào wms-service hoặc tạo wrapper):
- `create(dto, userId, tenantId)` 
- `findAll(query, tenantId)`
- `findById(id, tenantId)`
- `update(id, dto, tenantId)`
- `softDelete(id, tenantId)`

**Shared schemas** dùng: `Warehouse`, `WarehouseSchema`, `Zone`, `ZoneSchema`, `Aisle`, `AisleSchema`, `Bin`, `BinSchema` từ `@shared/schemas`

**DTOs**: Copy/adapt từ `apps/inventory/src/dto/warehouse.dto.ts` — thêm `tenantId` vào `CreateWarehouseDto` nếu chưa có.

---

##### 2. `LotController` — `controllers/lot.controller.ts`

**Base route:** `/wms/lots`  
**Pattern:** Filter theo `tenantId` trong mọi query.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/wms/lots` | Danh sách lot (filter: warehouseId, skuId, expired) |
| POST | `/wms/lots` | Tạo lot mới |
| GET | `/wms/lots/:id` | Chi tiết lot |
| PATCH | `/wms/lots/:id` | Cập nhật lot |

**Schema dùng:** `Lot`, `LotSchema` từ `@shared/schemas`  
**DTOs**: Adapt từ `apps/inventory/src/dto/lot.dto.ts`

---

##### 3. `SerialController` — `controllers/serial.controller.ts`

**Base route:** `/wms/serials`  
**Pattern:** Filter theo `tenantId`.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/wms/serials` | Danh sách serial (filter: skuId, status, binId) |
| POST | `/wms/serials` | Đăng ký serial mới |
| GET | `/wms/serials/:id` | Chi tiết serial |
| PATCH | `/wms/serials/:id` | Cập nhật trạng thái serial |

**Schema dùng:** `Serial`, `SerialSchema` từ `@shared/schemas`  
**DTOs**: Adapt từ `apps/inventory/src/dto/serial.dto.ts`

---

#### Yêu cầu kỹ thuật

1. **Guard bắt buộc**: `@UseGuards(JwtAuthGuard, TenantGuard)` trên mỗi controller — import từ `@shared/authz`. TenantGuard đã có từ Task 003.
2. **Response wrapper**: Dùng `created`, `ok`, `updated`, `deleted`, `paginated` từ `@shared/response`.
3. **CurrentUser**: Dùng `@CurrentUser()` để lấy `organizationId` làm `tenantId`.
4. **Module**: Cập nhật `wms-service.module.ts` để đăng ký: schemas mới (Warehouse, Zone, Aisle, Bin, Lot, Serial), repositories mới, services mới, controllers mới.
5. **Không sửa** `apps/inventory/` — chỉ làm việc trong `apps/wms-service/`.

**Tham chiếu source code** (đọc trước khi viết):
- `apps/inventory/src/services/warehouse.service.ts`
- `apps/inventory/src/services/lot.service.ts`
- `apps/inventory/src/services/serial.service.ts`
- `apps/inventory/src/repositories/warehouse.repository.ts`
- `apps/inventory/src/repositories/lot.repository.ts`
- `apps/inventory/src/repositories/serial.repository.ts`
- `apps/inventory/src/dto/warehouse.dto.ts`
- `apps/inventory/src/dto/lot.dto.ts`
- `apps/inventory/src/dto/serial.dto.ts`
- `apps/wms-service/src/controllers/stock.controller.ts` (pattern chuẩn)
- `apps/wms-service/src/wms-service.module.ts`

---

#### Đầu ra mong đợi

- [ ] `apps/wms-service/src/controllers/warehouse.controller.ts`
- [ ] `apps/wms-service/src/controllers/lot.controller.ts`
- [ ] `apps/wms-service/src/controllers/serial.controller.ts`
- [ ] `apps/wms-service/src/services/warehouse.service.ts` (hoặc wrapper)
- [ ] `apps/wms-service/src/services/lot.service.ts` (hoặc wrapper)
- [ ] `apps/wms-service/src/services/serial.service.ts` (hoặc wrapper)
- [ ] `apps/wms-service/src/repositories/warehouse.repository.ts`
- [ ] `apps/wms-service/src/repositories/lot.repository.ts`
- [ ] `apps/wms-service/src/repositories/serial.repository.ts`
- [ ] `apps/wms-service/src/dto/warehouse.dto.ts`
- [ ] `apps/wms-service/src/dto/lot.dto.ts`
- [ ] `apps/wms-service/src/dto/serial.dto.ts`
- [ ] `apps/wms-service/src/wms-service.module.ts` — cập nhật đăng ký đầy đủ
- [ ] `apps/wms-service/test/warehouse.service.spec.ts` — tối thiểu 5 test cases
- [ ] `nest build wms` thành công (không compile error)
- [ ] Tests hiện có (14/14) vẫn PASS sau thay đổi

#### Tiêu chí hoàn thành

- [x] `nest build wms` không lỗi
- [x] `npx jest apps/wms-service/test --no-coverage` — tất cả PASS (kể cả tests mới)
- [x] 3 controllers đầy đủ CRUD với tenant isolation
- [x] Cập nhật trạng thái task file này → 🟡 REVIEW
- [x] Cập nhật `docs/tasks/sprints/SPRINT-02/TASK-INDEX.md` → task 005 = 🟡 REVIEW

---
#### Kết quả thực hiện
- Ngày: 2026-05-08
- Files tạo mới:
  - `apps/wms-service/src/dto/warehouse.dto.ts`
  - `apps/wms-service/src/dto/lot.dto.ts`
  - `apps/wms-service/src/dto/serial.dto.ts`
  - `apps/wms-service/src/repositories/warehouse.repository.ts` (WmsWarehouseRepository)
  - `apps/wms-service/src/repositories/lot.repository.ts` (WmsLotRepository)
  - `apps/wms-service/src/repositories/serial.repository.ts` (WmsSerialRepository)
  - `apps/wms-service/src/services/warehouse.service.ts` (WmsWarehouseService)
  - `apps/wms-service/src/services/lot.service.ts` (WmsLotService)
  - `apps/wms-service/src/services/serial.service.ts` (WmsSerialService)
  - `apps/wms-service/src/controllers/warehouse.controller.ts`
  - `apps/wms-service/src/controllers/lot.controller.ts`
  - `apps/wms-service/src/controllers/serial.controller.ts`
  - `apps/wms-service/test/warehouse.service.spec.ts`
- Files sửa:
  - `apps/wms-service/src/wms-service.module.ts` — đăng ký schemas, controllers, services, repositories mới
  - `apps/wms-service/src/controllers/stock.controller.ts` — fix TS1272 (import type UserContext)
  - `apps/wms-service/src/controllers/transfer.controller.ts` — fix TS1272
  - `apps/wms-service/src/controllers/data-import.controller.ts` — fix TS1272
  - `apps/wms-service/src/repositories/stock.repository.ts` — fix TS2769 (organizationId thay tenantId, as any)
  - `apps/wms-service/src/services/data-import.service.ts` — fix TS2353 (createdBy → userId, as any)
- Build: PASS
- Tests: 26/26 PASS (14 cũ + 12 mới)
- Ghi chú:
  - Đã sửa 5 file pre-existing với compile errors (TS1272, TS2769, TS2353) để đạt `nest build wms` PASS
  - Lot và Serial dùng `organizationId` làm tenant field (theo schema); Warehouse dùng `tenantId`
  - WmsWarehouseService tự generate code khi omit, validate province/ward, enforce tenant isolation trên findById/update/delete
