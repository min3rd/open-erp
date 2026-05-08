### TASK-SPRINT-04-DOMAIN_MIGRATION-001: Khởi tạo Sales và Accounting domain services

**Trạng thái:** ⬜ TODO
**Loại:** Backend
**Module:** Sales + Accounting
**Sprint:** 04
**Ưu tiên:** Cao
**Ước tính:** 13 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-03-DOMAIN_MIGRATION-003

#### Mô tả
Khởi tạo domain service chuyên trách Sales và Accounting, gom logic rải rác từ `common-service`, `data-transfer` và luồng chứng từ liên quan để chuẩn bị cutover hoàn toàn.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-sales-accounting.md#core-flow`
- Các hành vi cần triển khai:
  - [ ] Sales order xác nhận phát event cho WMS/Accounting.
  - [ ] Accounting nhận event và hạch toán journal entry.
  - [ ] Đồng bộ danh mục dùng chung từ Platform.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** sales-domain-service, accounting-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, index | Tenant scope |
| order_no | string | unique theo tenant | Mã đơn hàng |
| customer_id | string | bắt buộc | Khách hàng |
| journal_no | string | unique theo tenant | Mã bút toán |
| posting_status | string | enum(draft,posted,void) | Trạng thái hạch toán |

- **Index cần tạo:** `{ tenant_id:1, order_no:1 } unique`, `{ tenant_id:1, journal_no:1 } unique`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/sales/orders` | Bearer JWT | Tạo đơn hàng |
| POST | `/api/v1/sales/orders/:id/confirm` | Bearer JWT | Xác nhận đơn |
| GET | `/api/v1/accounting/journals/:id` | Bearer JWT | Xem bút toán |

Chi tiết từng API:
```
POST /api/v1/sales/orders/:id/confirm
Request:  { confirmedBy: string }
Response: { orderId: string, status: "confirmed" }
Errors:   400, 401, 403, 404, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS
- **Giao thức:** REST + Event
- **Thư viện đề xuất:** outbox/inbox, mongoose transaction
- **Micro-frontend / Microservice liên quan:** MFE Sales, MFE Accounting, WMS Service, Platform Service

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `sales_manager`, `accountant`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** p95 < 250ms cho confirm order
- **Khả năng mở rộng:** scale độc lập Sales và Accounting
- **Logging & Monitoring:** trace xuyên domain từ order -> journal
- **Xử lý lỗi:** saga compensation khi thất bại liên miền

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Event `erp.sales.order.confirmed.v1` và `erp.accounting.journal.posted.v1` hoạt động end-to-end
