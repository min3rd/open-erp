# Tài liệu báo cáo lỗi: BUG-1.13 - Lỗi UnknownDependenciesException đối với TenantRepository & RoleRepository trong OrgModule
## Phân hệ: Quản trị doanh nghiệp & Nhân sự (User Management - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)

Khi khởi động ứng dụng backend service (`open-erp-services`), NestJS báo lỗi `UnknownDependenciesException` đối với `UserService`:

```text
ERROR [ExceptionHandler] UnknownDependenciesException [Error]: Nest can't resolve dependencies of the UserService (UserRepository, EmployeeRepository, ?, RoleRepository, DepartmentRepository, MailService, RedisService, ConfigService, DataSource). Please make sure that the argument "TenantRepository" at index [2] is available in the OrgModule module.

Potential solutions:
- Is OrgModule a valid NestJS module?
- If "TenantRepository" is a provider, is it part of the current OrgModule?
- If "TenantRepository" is exported from a separate @Module, is that module imported within OrgModule?
  @Module({
    imports: [ /* the Module containing "TenantRepository" */ ]
  })
```

Hệ quả: Ứng dụng NestJS backend bị crash khi khởi động và không thể xử lý các API request.

---

### 2. Nguyên nhân lỗi (Root Cause)

* `UserService` được tiêm vào các repository `UserRepository`, `EmployeeRepository`, `TenantRepository`, `RoleRepository`, và `DepartmentRepository` bằng decorator `@InjectRepository()`.
* Tuy nhiên, trong [org.module.ts](../../../../open-erp-services/src/features/org/org.module.ts), `TypeOrmModule.forFeature` chỉ khai báo các thực thể `[Branch, Department, Employee, User]`.
* Thực thể `Tenant` và `Role` không được đưa vào `TypeOrmModule.forFeature` của `OrgModule`, khiến NestJS không thể tìm thấy và tiêm `TenantRepository` cũng như `RoleRepository` vào `UserService`.

---

### 3. Giải pháp khắc phục (Resolution Design)

* Import `Tenant` entity từ `../../core/tenant/tenant.entity` và `Role` entity từ `../auth/entities/role.entity` vào [org.module.ts](../../../../open-erp-services/src/features/org/org.module.ts).
* Đăng ký `Tenant` và `Role` trong mảng thực thể của `TypeOrmModule.forFeature([Branch, Department, Employee, User, Tenant, Role])`.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. Backend NestJS khởi động thành công không còn lỗi thiếu dependency.
2. Các API liên quan đến `UserController` và `UserService` hoạt động bình thường.
3. Unit test của `OrgModule` biên dịch và chạy thành công.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Ưu tiên**: 🔴 **Cao** (Gây crash ứng dụng khi start)
- **Thay đổi thực hiện:**

| File | Thay đổi |
|------|----------|
| [`open-erp-services/.../org.module.ts`](../../../../open-erp-services/src/features/org/org.module.ts) | Import và đăng ký `Tenant` cùng `Role` trong `TypeOrmModule.forFeature`. |
