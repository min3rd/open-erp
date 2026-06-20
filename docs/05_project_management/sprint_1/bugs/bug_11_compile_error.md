# Tài liệu báo cáo lỗi: BUG-1.11 - Lỗi biên dịch TypeScript trong AuthService
## Phân hệ: Xác thực & Quản lý phiên (Auth - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)

Khi thực hiện build hoặc biên dịch backend service (`open-erp-services`), trình biên dịch TypeScript báo lỗi không thể gán kiểu dữ liệu:

```text
src/features/auth/auth.service.ts:379:43 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

379     return this.login({ email: dto.email, password: dto.password }, dto.tenantId);
                                                  ~~~~~~~~

  src/features/auth/dto/login.dto.ts:10:3
    10   password: string;
         ~~~~~~~~
    The expected type comes from property 'password' which is declared here on type 'LoginDto'
```

Hệ quả: Backend service không thể biên dịch thành công (compile error).

---

### 2. Nguyên nhân lỗi (Root Cause)

* Trong phương thức `selectTenant` của `AuthService`, tham số `dto` được định nghĩa kiểu dữ liệu inline là:
  `dto: { email: string; password?: string; tenantId: string }`
  Trong đó, thuộc tính `password` được đánh dấu là tùy chọn (`password?: string` - có thể có giá trị `string` hoặc `undefined`).
* Tuy nhiên, phương thức `login` gọi tiếp theo lại yêu cầu đối số đầu tiên phải có kiểu `LoginDto`, trong đó thuộc tính `password` là bắt buộc (`password: string`).
* Trình biên dịch TypeScript phát hiện sự không tương thích kiểu dữ liệu này (do `password` từ `selectTenant` có thể là `undefined`) nên đã chặn biên dịch.

---

### 3. Giải pháp khắc phục (Resolution Design)

* Thay thế kiểu dữ liệu inline của `dto` trong phương thức `selectTenant` bằng lớp DTO chính thức [SelectTenantDto](../../../../open-erp-services/src/features/auth/dto/select-tenant.dto.ts) (trong đó `password` đã được cấu hình bắt buộc và có kiểu `string`).
* Import `SelectTenantDto` vào [auth.service.ts](../../../../open-erp-services/src/features/auth/auth.service.ts).

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. Backend service biên dịch thành công không còn lỗi TypeScript.
2. Các unit tests liên quan đến đăng nhập và chọn tenant chạy thành công.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Ưu tiên**: 🔴 **Cao** (Lỗi chặn compile)
- **Thay đổi thực hiện:**

| File | Thay đổi |
|------|----------|
| [`open-erp-services/.../auth.service.ts`](../../../../open-erp-services/src/features/auth/auth.service.ts) | Import `SelectTenantDto` và đổi kiểu dữ liệu tham số `dto` trong `selectTenant` sang `SelectTenantDto`. |
