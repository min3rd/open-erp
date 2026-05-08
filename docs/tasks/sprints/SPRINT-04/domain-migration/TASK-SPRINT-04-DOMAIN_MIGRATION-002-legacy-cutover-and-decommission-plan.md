### TASK-SPRINT-04-DOMAIN_MIGRATION-002: Cutover API Gateway và decommission 11 service legacy

**Trạng thái:** ⬜ TODO
**Loại:** DevOps
**Module:** Migration Governance
**Sprint:** 04
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior DevOps
**Phụ thuộc:** TASK-SPRINT-04-DOMAIN_MIGRATION-001

#### Mô tả
Thực hiện cutover tuyến API từ 11 service cũ sang 6 domain service mới, thiết lập cơ chế rollback an toàn và decommission có kiểm soát.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-cutover.md#rollback`
- Các hành vi cần triển khai:
  - [ ] Chuyển route API Gateway theo từng nhóm endpoint.
  - [ ] Bật dual-read/dual-write tạm thời cho endpoint trọng yếu.
  - [ ] Đóng băng legacy service ở chế độ read-only trước khi tắt.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** platform-domain-service (migration registry)
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| migration_key | string | unique | Định danh đợt cutover |
| tenant_id | string | bắt buộc | Tenant áp dụng |
| route_group | string | bắt buộc | Nhóm route |
| cutover_status | string | enum(pending,active,rollback,done) | Trạng thái |
| executed_at | datetime | bắt buộc | Thời điểm thực hiện |

- **Index cần tạo:** `{ migration_key:1 } unique`, `{ tenant_id:1, route_group:1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/platform/migrations/cutover` | Bearer JWT | Kích hoạt cutover |
| POST | `/api/v1/platform/migrations/rollback` | Bearer JWT | Rollback nhanh |
| GET | `/api/v1/platform/migrations/:key` | Bearer JWT | Theo dõi trạng thái |

Chi tiết từng API:
```
POST /api/v1/platform/migrations/cutover
Request:  { migrationKey: string, tenantIds: string[], routeGroups: string[] }
Response: { migrationKey: string, status: "active" }
Errors:   400, 401, 403, 404, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS + Gateway config
- **Giao thức:** REST
- **Thư viện đề xuất:** feature flag, canary routing, health checks
- **Micro-frontend / Microservice liên quan:** Tất cả domain services

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `super_admin`, `platform_sre`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** downtime 0 hoặc gần 0 khi cutover
- **Khả năng mở rộng:** cutover theo batch tenant
- **Logging & Monitoring:** dashboard migration realtime, alert rollback
- **Xử lý lỗi:** rollback trong < 5 phút khi lỗi nghiêm trọng

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Runbook cutover/rollback được QA và SRE diễn tập thành công
