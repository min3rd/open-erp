### TASK-SPRINT-02-DOMAIN_MIGRATION-002: Hợp nhất inventory và data-transfer thành WMS Domain Service

**Trạng thái:** � REVIEW
**Loại:** Backend
**Module:** WMS
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 13 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-001

#### Mô tả
Hợp nhất nghiệp vụ kho từ `inventory` và phần kho của `data-transfer` vào một WMS service duy nhất, bảo toàn API nghiệp vụ cốt lõi qua gateway adapter.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-wms.md#stock-flow`
- Các hành vi cần triển khai:
  - [ ] Quản lý stock movement, transfer order, receiving, picking.
  - [ ] Chuẩn hóa trạng thái chứng từ kho.
  - [ ] Đồng bộ catalog item từ Platform bằng event.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** wms-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, index | Tenant scope |
| warehouse_id | string | bắt buộc | Kho |
| sku | string | bắt buộc | Mã hàng |
| qty | number | >=0 | Số lượng |
| movement_type | string | enum(in,out,transfer,adjustment) | Loại biến động |
| reference_no | string | unique theo tenant | Mã chứng từ |

- **Index cần tạo:** `{ tenant_id:1, warehouse_id:1, sku:1 }`, `{ tenant_id:1, reference_no:1 } unique`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/wms/transfers` | Bearer JWT | Tạo lệnh chuyển kho |
| POST | `/api/v1/wms/transfers/:id/confirm` | Bearer JWT | Xác nhận chuyển kho |
| GET | `/api/v1/wms/stocks` | Bearer JWT | Tra cứu tồn kho |

Chi tiết từng API:
```
POST /api/v1/wms/transfers
Request:  { fromWarehouseId: string, toWarehouseId: string, lines: [{ sku: string, qty: number }] }
Response: { transferId: string, status: string }
Errors:   400, 401, 403, 404, 422, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS
- **Giao thức:** REST + Event
- **Thư viện đề xuất:** mongoose transactions, outbox pattern
- **Micro-frontend / Microservice liên quan:** MFE WMS, Platform Service

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `wms_operator`, `wms_manager`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** p95 < 250ms cho stock query
- **Khả năng mở rộng:** partition theo tenant + warehouse
- **Logging & Monitoring:** metric stock movement throughput, transfer error rate
- **Xử lý lỗi:** retry publish event, dead-letter queue cho integration

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Không còn route nghiệp vụ kho gọi trực tiếp service cũ
