# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.6 - Lỗi đường dẫn kích hoạt tài khoản không hoạt động trên môi trường Dev
## Phân hệ: Xác thực & Đăng ký (Backend API Service - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi một Tenant mới đăng ký tài khoản thành công trên môi trường phát triển local (Dev Local), hệ thống gửi/tạo link kích hoạt tài khoản trỏ tới domain production/cloud:
`[0] [BullMQ Simulation] Activation Link: https://test.open-erp.9ms.io.vn/activate?token=53uokje63x9ta7w70nl9u`
Đường dẫn này sử dụng HTTPS và domain cloud khiến lập trình viên chạy ứng dụng local (`localhost:4200`) không thể click vào link để thực hiện việc kích hoạt và kiểm thử tài khoản.

---

### 2. Nguyên nhân lỗi (Root Cause)
- **Hiện trạng**: Trong tệp [auth.service.ts](../../../open-erp-services/src/features/auth/auth.service.ts), đường dẫn kích hoạt (`activationLink`) được cấu hình tĩnh (hardcode) sử dụng giao thức `https` và domain `open-erp.9ms.io.vn` kèm theo subdomain:
  ```typescript
  const activationLink = `https://${subdomain}.open-erp.9ms.io.vn/activate?token=${activationToken}`;
  ```
- **Hệ quả**: Bất kể chạy trên môi trường nào (Dev, Staging hay Prod), link kích hoạt đều trỏ tới domain trên cloud và bị thừa subdomain.

---

### 3. Giải pháp khắc phục (Resolution Design)
Sử dụng `ConfigService` để lấy thông tin cấu hình `APP_PROTOCOL` và `APP_DOMAIN` từ biến môi trường và loại bỏ phần `subdomain` khỏi link kích hoạt.

* **Tệp tin đích cần sửa đổi:** [auth.service.ts (open-erp-services)](../../../open-erp-services/src/features/auth/auth.service.ts)
* **Nguyên tắc sửa đổi logic**:
  1. Inject `ConfigService` vào `AuthService`.
  2. Lấy biến cấu hình với các giá trị fallback:
     - `APP_PROTOCOL`: Mặc định là `http` trên dev local (hoặc `https` trên staging/prod).
     - `APP_DOMAIN`: Mặc định là `localhost:4200` trên dev local (hoặc `open-erp.9ms.io.vn` trên staging/prod).
  3. Xây dựng đường dẫn động không chứa subdomain:
     ```typescript
     const appProtocol = this.configService.get<string>('APP_PROTOCOL', 'http');
     const appDomain = this.configService.get<string>('APP_DOMAIN', 'localhost:4200');
     const activationLink = `${appProtocol}://${appDomain}/activate?token=${activationToken}`;
     ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Link kích hoạt trên môi trường phát triển mặc định (Dev Local) phải có dạng: `http://localhost:4200/activate?token={token}`.
2. Link kích hoạt trên môi trường cloud/sản xuất (khi cấu hình env `APP_DOMAIN=open-erp.9ms.io.vn` và `APP_PROTOCOL=https`) phải có dạng: `https://open-erp.9ms.io.vn/activate?token={token}`.
3. Bộ kiểm thử unit test chạy thành công (`npm run test`).

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Import và inject `ConfigService` vào `AuthService` constructor.
  - Sử dụng cấu hình `APP_PROTOCOL` (mặc định: `http`) và `APP_DOMAIN` (mặc định: `localhost:4200`) để sinh link kích hoạt động mà không chứa subdomain.
  - Cập nhật các mock object/test tương ứng trong [auth.service.spec.ts](../../../open-erp-services/src/features/auth/auth.service.spec.ts) để tránh lỗi kiểm thử do thay đổi dependency constructor.
  - Chạy thử và xác nhận link kích hoạt được in ra chuẩn trên môi trường dev (không chứa subdomain).
