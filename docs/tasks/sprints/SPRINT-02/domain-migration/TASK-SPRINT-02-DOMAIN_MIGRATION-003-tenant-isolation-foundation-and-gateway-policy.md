### TASK-SPRINT-02-DOMAIN_MIGRATION-003: Thiết lập tenant isolation bắt buộc tại Gateway và service base

**Trạng thái:** 🟡 REVIEW
**Loại:** DevOps
**Module:** Platform
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior DevOps
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-001

#### Mô tả
Chuẩn hóa SaaS multi-tenant trên toàn backend bằng tenant context propagation, guard bắt buộc, logging theo tenant và policy reject nếu thiếu tenant.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-multi-tenant.md#isolation-model`
- Các hành vi cần triển khai:
  - [ ] API Gateway inject `tenant_id`, `org_id`, `role` vào upstream headers.
  - [ ] Base guard ở NestJS service chặn request thiếu tenant.
  - [ ] Thiết lập policy kiểm thử tự động cho tenant leakage.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** platform-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, unique | Tenant code |
| plan | string | enum(free,pro,enterprise) | Gói dịch vụ |
| status | string | enum(active,suspended) | Trạng thái |
| isolation_mode | string | enum(shared,hybrid,dedicated) | Kiểu cô lập |

- **Index cần tạo:** `{ tenant_id:1 } unique`, `{ status:1, plan:1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1/platform/tenants/:tenantId/policy` | Bearer JWT | Xem policy tenant |
| PATCH | `/api/v1/platform/tenants/:tenantId/policy` | Bearer JWT | Cập nhật isolation mode |

Chi tiết từng API:
```
PATCH /api/v1/platform/tenants/:tenantId/policy
Request:  { isolationMode: "shared" | "hybrid" | "dedicated" }
Response: { tenantId: string, isolationMode: string, updatedAt: string }
Errors:   400, 401, 403, 404, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS, API Gateway middleware
- **Giao thức:** REST
- **Thư viện đề xuất:** OpenTelemetry, pino, helmet
- **Micro-frontend / Microservice liên quan:** Toàn bộ backend services

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `super_admin`, `tenant_admin`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** overhead gateway tenant middleware < 10ms
- **Khả năng mở rộng:** hỗ trợ 500 tenant hoạt động đồng thời
- **Logging & Monitoring:** trace bắt buộc có tenant_id
- **Xử lý lỗi:** fail-closed (thiếu tenant => reject)

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Bộ test tenant-leakage chạy pass trên CI
