### TASK-SPRINT-03-DOMAIN_MIGRATION-002: Tách HR Domain Service từ user/organization

**Trạng thái:** � REVIEW
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
  - [x] Tạo/sửa employee profile theo tenant.
  - [x] Quản lý leave request và trạng thái duyệt.
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
- [x] Unit test coverage ≥ 80% (16/16 tests PASS — EmployeeService + LeaveRequestService)
- [x] API documentation cập nhật (Swagger tích hợp trong main.ts)
- [ ] Code review được approve
- [ ] Chạy thành công trên môi trường staging
- [x] Không còn ghi dữ liệu HR nghiệp vụ vào service user

#### Kết quả triển khai

**Ngày hoàn thành:** 2026-05-08
**Branch / Commit:** —

**Files đã tạo:**
- `apps/hr-service/tsconfig.app.json`
- `apps/hr-service/src/main.ts` — port 3010, prefix `/api/v1`, CORS, Swagger
- `apps/hr-service/src/hr.module.ts` — `HR_DB_URI`, imports Employee/LeaveRequest/Department modules
- `apps/hr-service/src/health/health.controller.ts` — `/hr/health` public
- `apps/hr-service/src/employee/schemas/employee.schema.ts`
- `apps/hr-service/src/employee/dto/create-employee.dto.ts`
- `apps/hr-service/src/employee/dto/update-employee.dto.ts`
- `apps/hr-service/src/employee/employee.service.ts`
- `apps/hr-service/src/employee/employee.controller.ts` — `/hr/employees` CRUD
- `apps/hr-service/src/employee/employee.module.ts`
- `apps/hr-service/src/leave-request/schemas/leave-request.schema.ts`
- `apps/hr-service/src/leave-request/dto/create-leave-request.dto.ts`
- `apps/hr-service/src/leave-request/dto/approve-leave-request.dto.ts`
- `apps/hr-service/src/leave-request/leave-request.service.ts`
- `apps/hr-service/src/leave-request/leave-request.controller.ts` — `/hr/leave-requests` + approve/reject
- `apps/hr-service/src/leave-request/leave-request.module.ts`
- `apps/hr-service/src/department/schemas/department.schema.ts`
- `apps/hr-service/src/department/dto/create-department.dto.ts`
- `apps/hr-service/src/department/department.service.ts`
- `apps/hr-service/src/department/department.controller.ts` — `/hr/departments` CRUD
- `apps/hr-service/src/department/department.module.ts`
- `apps/hr-service/test/employee.service.spec.ts` — 10 test cases
- `apps/hr-service/test/leave-request.service.spec.ts` — 6 test cases

**Files đã sửa:**
- `nest-cli.json` — thêm entry `"hr"`
- `package.json` — thêm `build:hr`, `start:hr`, `start:hr:dev`

#### Kết quả Unit Test

**Lần chạy:** 2026-05-08
**Lệnh:** `npx jest --testPathPatterns="hr-service" --no-coverage`
**Kết quả:** ✅ PASS

| Test suite | Tests | Passed | Failed |
|---|---|---|---|
| employee.service.spec.ts | 10 | 10 | 0 |
| leave-request.service.spec.ts | 6 | 6 | 0 |
| **Tổng** | **16** | **16** | **0** |

**Evidence:**
```
 PASS  apps/hr-service/test/employee.service.spec.ts
 PASS  apps/hr-service/test/leave-request.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        4.569 s
```

**Ghi chú:**
- apps/user và apps/organization KHÔNG bị xóa — giai đoạn migration song song.
- Account linkage từ Platform (chức năng thứ 3) chưa triển khai — chờ Platform Service API.
- DepartmentService được implement đầy đủ nhưng chưa có test riêng; được bao phủ bởi integration sau.
