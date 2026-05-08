### TASK-SPRINT-04-DOMAIN_MIGRATION-003: Xây dựng bộ E2E regression multi-tenant cho cutover

**Trạng thái:** ⬜ TODO
**Loại:** Testing
**Module:** QA Cross-domain
**Sprint:** 04
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior QA
**Phụ thuộc:** TASK-SPRINT-04-DOMAIN_MIGRATION-002

#### Mô tả
Xây dựng bộ kiểm thử E2E và dữ liệu test đa tenant để xác nhận không rò rỉ dữ liệu, không regression nghiệp vụ sau cutover 6 domain service.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-qa-multitenant.md#e2e-suite`
- Các hành vi cần triển khai:
  - [ ] Test matrix theo 3 tenant với role khác nhau.
  - [ ] Kiểm thử luồng liên miền Platform -> WMS -> Sales -> Accounting.
  - [ ] Kiểm thử negative cho tenant leakage.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** test data set thuộc từng domain
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc | Tenant test |
| scenario_key | string | unique | Mã kịch bản |
| seed_version | string | bắt buộc | Version dữ liệu test |
| expected_result | object | bắt buộc | Kỳ vọng |

- **Index cần tạo:** `{ scenario_key:1 } unique`, `{ tenant_id:1, seed_version:1 }`
- **Migration cần thiết:** Không

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/platform/test-scenarios/execute` | Bearer JWT | Chạy scenario tích hợp |
| GET | `/api/v1/platform/test-scenarios/:key/result` | Bearer JWT | Lấy kết quả test |

Chi tiết từng API:
```
POST /api/v1/platform/test-scenarios/execute
Request:  { scenarioKey: string, tenantId: string }
Response: { runId: string, status: "running" | "passed" | "failed" }
Errors:   400, 401, 403, 404, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS test harness + Playwright/Postman collection
- **Giao thức:** REST
- **Thư viện đề xuất:** Newman, Playwright, k6 (smoke performance)
- **Micro-frontend / Microservice liên quan:** Tất cả domain services

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT test token có scope giới hạn
- [ ] Phân quyền (Authorization): `qa_lead`, `platform_sre`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** full regression < 60 phút
- **Khả năng mở rộng:** chạy song song theo tenant
- **Logging & Monitoring:** xuất báo cáo pass/fail theo domain và tenant
- **Xử lý lỗi:** auto retry 1 lần với lỗi hạ tầng không xác định

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Bộ regression trở thành quality gate bắt buộc trước production
