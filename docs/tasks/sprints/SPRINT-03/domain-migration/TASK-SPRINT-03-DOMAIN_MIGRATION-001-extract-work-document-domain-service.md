### TASK-SPRINT-03-DOMAIN_MIGRATION-001: Tách Work/Document Domain Service

**Trạng thái:** ⬜ TODO
**Loại:** Backend
**Module:** Work/Document
**Sprint:** 03
**Ưu tiên:** Cao
**Ước tính:** 13 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-003

#### Mô tả
Tách `file-service`, `chat` và workflow runtime khỏi `approval-flow` thành Work/Document domain service thống nhất cho quản trị tài liệu và tiến trình duyệt.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-work-document.md#workflow`
- Các hành vi cần triển khai:
  - [ ] Quản lý document lifecycle và metadata file.
  - [ ] Runtime workflow instance độc lập theo domain.
  - [ ] Comment/collaboration theo document.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** workdoc-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, index | Tenant scope |
| document_no | string | unique theo tenant | Mã chứng từ |
| workflow_code | string | bắt buộc | Mã workflow |
| status | string | enum(draft,pending,approved,rejected) | Trạng thái |
| attachment_ids | string[] | nullable | Danh sách file |

- **Index cần tạo:** `{ tenant_id:1, document_no:1 } unique`, `{ tenant_id:1, status:1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/workdocs/documents` | Bearer JWT | Tạo document |
| POST | `/api/v1/workdocs/workflows/:id/approve` | Bearer JWT | Duyệt document |
| GET | `/api/v1/workdocs/documents/:id` | Bearer JWT | Xem chi tiết document |

Chi tiết từng API:
```
POST /api/v1/workdocs/workflows/:id/approve
Request:  { comment?: string }
Response: { workflowInstanceId: string, status: "approved" }
Errors:   400, 401, 403, 404, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS
- **Giao thức:** REST + Event
- **Thư viện đề xuất:** BullMQ (async jobs), MinIO client adapter
- **Micro-frontend / Microservice liên quan:** MFE Work/Document, HR, Accounting

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): theo workflow role matrix
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** p95 < 300ms với document <= 1MB metadata
- **Khả năng mở rộng:** tách lưu metadata và file object store
- **Logging & Monitoring:** audit log cho hành động approve/reject
- **Xử lý lỗi:** retry upload callback, circuit breaker cho object store

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Event `erp.workdoc.workflow.approved.v1` phát đúng schema
