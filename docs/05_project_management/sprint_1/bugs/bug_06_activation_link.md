# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.6 - Lỗi đường dẫn kích hoạt tài khoản không hoạt động trên môi trường Dev
## Phân hệ: Xác thực & Đăng ký (Backend API Service - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi một Tenant mới đăng ký tài khoản thành công trên môi trường phát triển local (Dev Local), hệ thống gửi/tạo link kích hoạt tài khoản trỏ tới domain production/cloud:
`[0] [BullMQ Simulation] Activation Link: https://test.open-erp.9ms.io.vn/activate?token=53uokje63x9ta7w70nl9u`
Đường dẫn này sử dụng HTTPS và domain cloud khiến lập trình viên chạy ứng dụng local (`localhost:4200`) không thể click vào link để thực hiện việc kích hoạt và kiểm thử tài khoản.

---

### 2. Nguyên nhân lỗi (Root Cause)
- **Hiện trạng**: Trong tệp [auth.service.ts](../../../../open-erp-services/src/features/auth/auth.service.ts), đường dẫn kích hoạt (`activationLink`) được cấu hình tĩnh (hardcode) sử dụng giao thức `https` và domain `open-erp.9ms.io.vn` kèm theo subdomain:
  ```typescript
  const activationLink = `https://${subdomain}.open-erp.9ms.io.vn/activate?token=${activationToken}`;
  ```
- **Hệ quả**: Bất kể chạy trên môi trường nào (Dev, Staging hay Prod), link kích hoạt đều trỏ tới domain trên cloud và bị thừa subdomain.

---

### 3. Giải pháp khắc phục (Resolution Design)
Để sửa lỗi này và xây dựng luồng kích hoạt tài khoản hoàn chỉnh, hệ thống cần thực hiện các thay đổi đồng bộ trên cả Backend và Frontend:

#### 3.1 Cấu hình Backend (`open-erp-services`):
* **Cấu hình biến môi trường**: Sử dụng `ConfigService` để lấy `APP_PROTOCOL` (mặc định là `http`) và `APP_DOMAIN` (mặc định là `localhost:4200`) từ file môi trường và loại bỏ phần `subdomain` khỏi link kích hoạt:
  ```typescript
  const appProtocol = this.configService.get<string>('APP_PROTOCOL', 'http');
  const appDomain = this.configService.get<string>('APP_DOMAIN', 'localhost:4200');
  const activationLink = `${appProtocol}://${appDomain}/activate?token=${activationToken}`;
  ```
* **Bỏ qua middleware kiểm tra Tenant**: Thêm đường dẫn `/auth/activate` vào danh sách ngoại lệ trong [tenant.middleware.ts](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts) để tránh lỗi `TENANT_NOT_FOUND` do URL này không chứa subdomain.
* **Xử lý lưu trữ và kích hoạt**:
  - Khi đăng ký, token kích hoạt được lưu vào Redis với thời gian hết hạn 24 giờ thông qua [auth.service.ts](../../../../open-erp-services/src/features/auth/auth.service.ts).
  - Thêm API `POST /api/v1/auth/activate` trong [auth.controller.ts](../../../../open-erp-services/src/features/auth/auth.controller.ts) để giải nén token, kích hoạt user (`status: 'Active'`) và xóa token khỏi Redis.

#### 3.2 Cấu hình Frontend (`open-erp-web`):
* **Bộ chặn HTTP (Interceptor)**: Cập nhật [auth.interceptor.ts](../../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts) tự động phân tách subdomain hiện tại của trình duyệt và truyền dưới dạng header `x-subdomain` lên backend nhằm giải quyết lỗi xác thực.
* **Định nghĩa Endpoints & Service**:
  - Đăng ký endpoint kích hoạt trong [api-endpoints.ts](../../../../open-erp-web/src/app/core/constants/api-endpoints.ts).
  - Viết hàm `activate(token)` gọi API trong [auth.service.ts](../../../../open-erp-web/src/app/core/services/auth.service.ts).
* **Component Kích hoạt (ActivateComponent)**:
  - Tạo mới component độc lập [ActivateComponent](../../../../open-erp-web/src/app/features/auth/activate/activate.component.ts) để đọc token từ URL, gọi API kích hoạt, hiển thị các trạng thái loading, thành công, thất bại và tự động chuyển hướng về trang đăng nhập sau 3 giây.
  - Đăng ký route lazy-loaded `/activate` trong [app.routes.ts](../../../../open-erp-web/src/app/app.routes.ts).
* **Đa ngôn ngữ (Transloco)**: Thêm các nhãn dịch tiếng Việt và tiếng Anh tương ứng trong [vi.json](../../../../open-erp-web/public/assets/i18n/vi.json) và [en.json](../../../../open-erp-web/public/assets/i18n/en.json).

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Link kích hoạt hiển thị dạng `http://localhost:4200/activate?token={token}` trên môi trường phát triển local.
2. Khi người dùng click vào link kích hoạt, trình duyệt hiển thị trang `/activate` với trạng thái đang xử lý và thực hiện gọi API kích hoạt tới backend thành công.
3. Khi kích hoạt thành công, hiển thị thông báo thành công và tự động chuyển hướng về trang đăng nhập `/login` sau 3 giây.
4. Nếu token kích hoạt không hợp lệ hoặc hết hạn, hiển thị thông báo lỗi chi tiết.
5. Unit tests và build hệ thống hoàn tất không gặp lỗi.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - **Backend**:
    - Cập nhật hàm sinh link và kích hoạt trong [auth.service.ts](../../../../open-erp-services/src/features/auth/auth.service.ts) và unit test trong [auth.service.spec.ts](../../../../open-erp-services/src/features/auth/auth.service.spec.ts).
    - Mở API endpoint `/auth/activate` trong [auth.controller.ts](../../../../open-erp-services/src/features/auth/auth.controller.ts).
    - Cấu hình loại trừ route kích hoạt trong [tenant.middleware.ts](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts).
  - **Frontend**:
    - Khởi tạo [ActivateComponent](../../../../open-erp-web/src/app/features/auth/activate/activate.component.ts) & [activate.component.html](../../../../open-erp-web/src/app/features/auth/activate/activate.component.html) không có directive `standalone: true` dư thừa và tuân thủ chuẩn Angular v22.
    - Cấu hình lazy-loaded route trong [app.routes.ts](../../../../open-erp-web/src/app/app.routes.ts).
    - Cập nhật [auth.interceptor.ts](../../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts) để truyền dynamic `x-subdomain` header.
    - Bổ sung cấu hình đa ngôn ngữ trong các file JSON dịch tương ứng.
