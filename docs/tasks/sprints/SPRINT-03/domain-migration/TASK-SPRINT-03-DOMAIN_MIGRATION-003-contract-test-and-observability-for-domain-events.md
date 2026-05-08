### TASK-SPRINT-03-DOMAIN_MIGRATION-003: Thiết lập contract test và observability cho domain events

**Trạng thái:** ⬜ TODO
**Loại:** Testing
**Module:** Cross-domain
**Sprint:** 03
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior QA
**Phụ thuộc:** TASK-SPRINT-03-DOMAIN_MIGRATION-001, TASK-SPRINT-03-DOMAIN_MIGRATION-002

#### Mô tả
Thiết lập bộ contract test cho event integration giữa Platform/WMS/WorkDoc/HR và triển khai tracing đa tenant để phát hiện lỗi coupling sớm.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-integration-events.md#contract`
- Các hành vi cần triển khai:
  - [ ] Định nghĩa schema JSON cho event version v1.
  - [ ] CI chạy contract test producer/consumer.
  - [ ] Dashboard metric theo tenant và domain.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** platform-domain-service (registry schema)
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | nullable | Tenant áp dụng (nếu custom) |
| event_type | string | bắt buộc | Tên event |
| version | number | bắt buộc | Phiên bản schema |
| schema_json | object | bắt buộc | JSON schema |
| status | string | enum(active,deprecated) | Trạng thái |

- **Index cần tạo:** `{ event_type:1, version:1 } unique`, `{ status:1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/platform/event-schemas` | Bearer JWT | Đăng ký schema event |
| GET | `/api/v1/platform/event-schemas/:eventType` | Bearer JWT | Truy vấn schema |

Chi tiết từng API:
```
POST /api/v1/platform/event-schemas
Request:  { eventType: string, version: number, schemaJson: object }
Response: { id: string, eventType: string, version: number, status: string }
Errors:   400, 401, 403, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS + test runner
- **Giao thức:** Event + REST
- **Thư viện đề xuất:** AJV, pact-like contract checker, OpenTelemetry
- **Micro-frontend / Microservice liên quan:** Tất cả domain services

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `platform_admin`, `integration_admin`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** contract test hoàn tất < 10 phút trên CI
- **Khả năng mở rộng:** thêm event mới không phá vỡ event cũ
- **Logging & Monitoring:** trace_id, tenant_id bắt buộc trong log event
- **Xử lý lỗi:** event invalid schema phải bị reject và cảnh báo

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] CI fail khi có breaking change event contract
