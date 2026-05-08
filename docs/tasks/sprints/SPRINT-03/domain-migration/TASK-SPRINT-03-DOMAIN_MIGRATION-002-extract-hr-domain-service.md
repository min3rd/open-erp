### TASK-SPRINT-03-DOMAIN_MIGRATION-002: Tách HR Domain Service từ user/organization

**Trạng thái:** ⬜ TODO
**Loại:** Backend
**Module:** HR
**Sprint:** 03
**Ưu tiên:** Cao
**Ước tính:** 8 SP
**Người nhận:** Senior Backend Programmer
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-003

#### Mô tả
Tách hồ sơ nhân sự nghiệp vụ (employee profile, contract, leave request) khỏi `user` và `organization` để tránh trộn identity hệ thống với nghiệp vụ nhân sự.

#### Yêu cầu chức năng
- Tham chiếu SRS: `docs/srs/SRS-hr.md#employee-domain`
- Các hành vi cần triển khai:
  - [ ] Tạo/sửa employee profile theo tenant.
  - [ ] Quản lý leave request và trạng thái duyệt.
  - [ ] Đồng bộ account linkage từ Platform.

#### Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** hr-domain-service
- **Bảng / Collection:**

| Trường | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| tenant_id | string | bắt buộc, index | Tenant scope |
| employee_code | string | unique theo tenant | Mã nhân sự |
| account_id | string | bắt buộc | Mapping sang Platform user_account |
| department_id | string | bắt buộc | Bộ phận |
| employment_status | string | enum(active,terminated,on_leave) | Trạng thái |

- **Index cần tạo:** `{ tenant_id:1, employee_code:1 } unique`, `{ tenant_id:1, department_id:1 }`
- **Migration cần thiết:** Có

#### Thiết kế API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/hr/employees` | Bearer JWT | Tạo hồ sơ nhân sự |
| GET | `/api/v1/hr/employees` | Bearer JWT | Danh sách nhân sự |
| POST | `/api/v1/hr/leave-requests` | Bearer JWT | Tạo đơn nghỉ |

Chi tiết từng API:
```
POST /api/v1/hr/employees
Request:  { employeeCode: string, accountId: string, departmentId: string }
Response: { id: string, employeeCode: string, status: string }
Errors:   400, 401, 403, 404, 409, 500
```

#### Giao thức & Công nghệ
- **Ngôn ngữ:** TypeScript
- **Framework:** NestJS
- **Giao thức:** REST + Event
- **Thư viện đề xuất:** mongoose, class-transformer
- **Micro-frontend / Microservice liên quan:** MFE HR, Platform Service, Work/Document Service

#### Yêu cầu bảo mật
- [ ] Xác thực (Authentication): JWT
- [ ] Phân quyền (Authorization): `hr_admin`, `hr_manager`
- [ ] Validate input đầu vào
- [ ] Mã hóa dữ liệu nhạy cảm (nếu có)
- [ ] Rate limiting (nếu cần)

#### Yêu cầu phi chức năng
- **Hiệu năng:** p95 < 200ms cho list employee phân trang
- **Khả năng mở rộng:** shard theo tenant cho collection lớn
- **Logging & Monitoring:** metric employee write/read, leave workflow latency
- **Xử lý lỗi:** idempotent create employee theo employee_code

#### Tiêu chí hoàn thành (Definition of Done)
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation cập nhật
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [ ] Không còn ghi dữ liệu HR nghiệp vụ vào service user
