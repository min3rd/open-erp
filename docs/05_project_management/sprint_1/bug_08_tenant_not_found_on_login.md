# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.8 - Lỗi TENANT_NOT_FOUND khi đăng nhập trên Flat Domain (Subdomain là tùy chọn)
## Phân hệ: Xác thực & Đăng ký (Auth Web Client & API - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi người dùng đăng ký tài khoản và thực hiện kích hoạt tài khoản thành công, họ được dẫn về trang đăng nhập chung tại flat domain (`http://localhost:4200/login`).
Khi điền thông tin email và mật khẩu rồi nhấn đăng nhập, API gửi yêu cầu đăng nhập `/api/v1/auth/login` lập tức bị trả về lỗi:
```json
{
    "success": false,
    "error": {
        "code": "TENANT_NOT_FOUND",
        "messageKey": "auth.tenant_not_found"
    }
}
```
Mặc dù hệ thống được thiết kế hỗ trợ subdomain tùy chọn (Optional) và cho phép chạy trực tiếp trên flat domain, luồng kiểm soát Tenant hiện tại bắt buộc phải có subdomain context tại thời điểm gọi API đăng nhập.

---

### 2. Nguyên nhân lỗi (Root Cause)
1. **Bản chất của Multi-tenant SaaS & TenantMiddleware**:
   - Tệp [tenant.middleware.ts](../../../open-erp-services/src/core/tenant/tenant.middleware.ts) của backend kiểm tra sự tồn tại của Tenant dựa trên subdomain trích xuất từ hostname hoặc các headers (`x-subdomain`, `x-tenant-id`).
   - Khi đăng nhập tại flat domain (`localhost:4200/login`), do không có subdomain trong hostname và người dùng chưa đăng nhập nên cũng chưa có headers này, `TenantMiddleware` không xác định được Tenant và lập tức ném lỗi `TENANT_NOT_FOUND` trước khi API đăng nhập thực tế được gọi.
2. **Hạn chế của API đăng nhập**:
   - API đăng nhập `AuthService.login` yêu cầu truyền vào tham số `tenantId` bắt buộc để thực hiện tìm kiếm user (`where: { email, tenantId }`).
   - Do đó, nếu đăng nhập từ flat domain, không có cách nào xác thực người dùng ngay cả khi email của người dùng là duy nhất toàn hệ thống.

---

### 3. Giải pháp khắc phục (Resolution Design)
Để hỗ trợ thiết kế "Subdomain là tùy chọn (Optional)", hệ thống cho phép thực hiện đăng nhập toàn cầu (Global Login) từ flat domain, sau đó lưu trữ thông tin Tenant ở phía Client để tự động truyền làm header context trong các API tiếp theo.

#### 3.1 Cấu hình Backend (`open-erp-services`):
* **Bỏ qua Middleware cho API Login**:
  Thêm đường dẫn `/auth/login` vào danh sách loại trừ của [tenant.middleware.ts](../../../open-erp-services/src/core/tenant/tenant.middleware.ts) để cho phép các yêu cầu đăng nhập từ flat domain đi qua mà không báo lỗi `TENANT_NOT_FOUND`.
* **Hỗ trợ Login không bắt buộc tenantId**:
  Trong [auth.service.ts](../../../open-erp-services/src/features/auth/auth.service.ts), cập nhật hàm `login(dto, tenantId?)` cho phép tham số `tenantId` nhận giá trị optional. Nếu không truyền `tenantId`, thực hiện tìm kiếm user theo email trên phạm vi toàn cầu:
  ```typescript
  const user = await this.userRepository.findOne({
    where: tenantId ? { email, tenantId } : { email },
  });
  ```
* **Trả về thông tin Tenant khi đăng nhập thành công**:
  Sau khi xác thực thành công, truy vấn thông tin Tenant và trả kèm về Client thông qua đối tượng `tenant` bên trong trường `data` của response đăng nhập:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      "tenant": {
        "id": "tenant-uuid",
        "name": "Gotech Corp",
        "subdomain": "gotech"
      }
    }
  }
  ```
* **Cập nhật AuthController**:
  Cập nhật [auth.controller.ts](../../../open-erp-services/src/features/auth/auth.controller.ts) để chuyển tiếp cấu trúc dữ liệu `tenant` phản hồi từ dịch vụ về cho client.

#### 3.2 Cấu hình Frontend (`open-erp-web`):
* **Cập nhật Interface & Service**:
  - Thêm trường `tenant` vào cấu trúc `LoginResponse` trong [auth.model.ts](../../../open-erp-web/src/app/core/models/auth.model.ts).
  - Cập nhật hàm `login` trong [auth.service.ts](../../../open-erp-web/src/app/core/services/auth.service.ts) để lưu trữ `tenantId` và `subdomain` nhận được từ API đăng nhập thành công vào `localStorage`.
* **Cập nhật Interceptor**:
  Trong [auth.interceptor.ts](../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts), nếu không trích xuất được subdomain từ hostname (đang chạy trên flat domain), thực hiện đọc `subdomain` và `tenantId` đã được lưu trữ trong `localStorage` làm fallback để gán vào các headers tương ứng (`x-subdomain`, `x-tenant-id`).
* **Trang Kích hoạt (ActivateComponent)**:
  Phục hồi luồng chuyển hướng của [activate.component.ts](../../../open-erp-web/src/app/features/auth/activate/activate.component.ts) để chuyển hướng nội bộ (dùng `this.router.navigate(['/login'])`) về trang đăng nhập của chính domain hiện tại, không bắt buộc ép trình duyệt chuyển sang subdomain.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Đăng ký tài khoản thành công (có hoặc không nhập subdomain).
2. Click link kích hoạt và kích hoạt tài khoản thành công, trang tự động chuyển hướng về trang đăng nhập chung tại `http://localhost:4200/login`.
3. Đăng nhập trực tiếp tại flat domain `http://localhost:4200/login` thành công mà không gặp lỗi `TENANT_NOT_FOUND`.
4. Sau khi đăng nhập thành công, các API nghiệp vụ tiếp theo tự động mang theo các header định danh Tenant (`x-tenant-id` và `x-subdomain`) trích xuất từ `localStorage`, giúp backend xác thực chính xác vùng dữ liệu.
5. Unit tests và build hệ thống hoàn tất thành công.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Cập nhật [tenant.middleware.ts](../../../open-erp-services/src/core/tenant/tenant.middleware.ts) bỏ qua kiểm tra tenant cho route đăng nhập.
  - Sửa đổi [auth.service.ts](../../../open-erp-services/src/features/auth/auth.service.ts) và [auth.controller.ts](../../../open-erp-services/src/features/auth/auth.controller.ts) hỗ trợ đăng nhập toàn cầu và trả về Tenant context.
  - Triển khai lưu trữ context và tự động tiêm headers thông qua [auth.service.ts](../../../open-erp-web/src/app/core/services/auth.service.ts) và [auth.interceptor.ts](../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts).
  - Hoàn thiện luồng kiểm thử thành công.
