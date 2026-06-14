# Tài liệu kỹ thuật chi tiết: TSK-1.2 - Đăng nhập & Xác thực (Authentication)
## Phân hệ: Quản trị doanh nghiệp & Xác thực (SaaS IAM - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Thiết lập hệ thống xác thực người dùng bảo mật, hỗ trợ cơ chế Multi-tenant trên cả 2 nền tảng Web Client (`open-erp-web`) và Mobile Client (`open-erp-mobile`). Người dùng đăng nhập bằng tài khoản email và mật khẩu tại subdomain của doanh nghiệp. Hệ thống trả về mã xác thực JWT Access Token ngắn hạn và HTTP-Only Cookie Refresh Token dài hạn lưu trong Redis Session để quản lý phiên.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Chiến lược Token & Quản lý Phiên kết nối
* **Access Token (JWT):** Có thời gian hết hạn là **15 phút**. Lưu trong bộ nhớ RAM của ứng dụng Client (không lưu trong LocalStorage để tránh tấn công XSS). Payload chứa thông tin: `user_id`, `email`, `role`, và `tenant_id`.
* **Refresh Token:** Có thời gian hết hạn là **7 ngày**.
  - **Trên Web:** Lưu dưới dạng **HTTP-Only, Secure, SameSite=Strict Cookie** để ngăn chặn tấn công XSS và CSRF.
  - **Trên Mobile (Ionic):** Do trình duyệt di động / Capacitor không hỗ trợ Cookie chéo tốt, Refresh Token được lưu trữ bảo mật thông qua thư viện **Capacitor Secure Storage** và truyền lên API qua Custom Header.
  - Tất cả các Refresh Token đang hoạt động phải được đăng ký session trong **Redis Cache** theo cặp key-value `session:user_id:token_hash` để phục vụ cơ chế thu hồi quyền lập tức (Revocation) khi người dùng chọn Đăng xuất (Logout) hoặc đổi mật khẩu.

#### 2.2 Luồng phân tích Tenant ID (Subdomain là tùy chọn)
* Hệ thống hỗ trợ phân tích định danh Tenant thông qua:
  1. **Subdomain từ host**: Được trích xuất động dựa trên cấu hình tên miền cơ sở trong biến môi trường `APP_DOMAIN` (tránh hardcode hostname).
  2. **Custom HTTP Headers**: `X-Tenant-ID` (tìm theo UUID của tenant) hoặc `X-Subdomain` (tìm theo subdomain). Cách này cho phép các ứng dụng truy cập từ main portal hoặc domain khách hàng tùy biến không bắt buộc sử dụng subdomain.
* Backend truy vấn bảng `tenants` để tìm `tenant_id` tương ứng và thiết lập biến ngữ cảnh phiên kết nối RLS PostgreSQL.

#### 2.3 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/auth/login`**
  - **Payload yêu cầu:**
    ```json
    {
      "email": "owner@gotech.com",
      "password": "SecurePassword123!"
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi...",
        "expiresIn": 900
      }
    }
    ```
* **`POST /api/v1/auth/refresh`** (Gửi kèm Refresh Token trong Cookie hoặc Header)
* **`POST /api/v1/auth/logout`** (Xóa cookie và xóa session tương ứng trong Redis)

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Middleware trích xuất Tenant & RLS Context**
  - Viết NestJS Middleware để phân tích subdomain từ header `Host` hoặc `Origin` và thiết lập `tenant_id` vào `AsyncLocalStorage` dùng chung toàn luồng xử lý.
* **Nhiệm vụ 2: Xây dựng bộ API Auth**
  - Triển khai chiến lược đăng nhập, tạo mã hash mật khẩu bằng `bcrypt`.
  - Kết nối thư viện **`ioredis`** để lưu trữ và quản lý thời gian hết hạn của Refresh Token Session trong Redis.
  - Viết logic `/auth/refresh` và `/auth/logout` để thu hồi phiên.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Giao diện Đăng nhập**
  - Thiết kế trang Đăng nhập sử dụng các UI components từ thư viện dùng chung **`open-erp-ui`**, đảm bảo tông màu **Rose Gold (`#B76E79`)** và hiển thị sắc nét ở cả hai chế độ **Light/Dark Mode**.
* **Nhiệm vụ 2: HTTP Interceptor & Silent Refresh**
  - Viết Angular HTTP Interceptor để tự động đính kèm `Authorization: Bearer <Token>` vào header của mọi request.
  - Viết logic tự động gọi API `/auth/refresh` ngầm khi Access Token sắp hết hạn (Silent Refresh) để người dùng không bị gián đoạn trải nghiệm.
  - Sử dụng Transloco để hiển thị đa ngôn ngữ cho nhãn nhầm lẫn và thông tin cảnh báo lỗi.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Giao diện Đăng nhập Mobile (Ionic Page)**
  - Xây dựng giao diện đăng nhập tối giản trên Mobile, đồng bộ màu sắc Rose Gold và chế độ hiển thị Dark/Light Mode.
  - Cho phép người dùng nhập địa chỉ workspace subdomain (ví dụ: `gotech`) trước khi nhập tài khoản.
* **Nhiệm vụ 2: Tích hợp Capacitor Secure Storage**
  - Viết service lưu trữ Access Token và Refresh Token vào phân vùng nhớ bảo mật của thiết bị (iOS Keychain / Android Keystore) thông qua Plugin `@capacitor-community/secure-storage`.

#### 3.4 UI/UX Designer
* Phác thảo mockups trang Đăng nhập Web và Mobile đảm bảo tối giản, High Density Mode theo đặc tả tại [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md).

#### 3.5 QA Engineer
* Viết Test Cases kiểm tra:
  - Đăng nhập thành công với thông tin đúng, trả về đầy đủ token.
  - Đăng nhập thất bại (Sai mật khẩu, tài khoản chưa kích hoạt, sai subdomain).
  - Tự động logout khi Token bị hết hạn hoặc giả mạo.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Hạ tầng):** Đảm bảo cụm hạ tầng PostgreSQL & Redis local đang chạy:
  ```bash
  docker compose -f ../../../../docker-compose.local.yml up -d
  ```
* **Bước 2 (Gỡ lỗi Backend):** Mở dự án `open-erp-services` trong VSCode, bật tab Run and Debug và chọn **"Debug NestJS Backend"**. Đặt breakpoint trong `auth.controller.ts` để kiểm tra luồng login.
* **Bước 3 (Gỡ lỗi Client):**
  - Đối với Web: Khởi chạy `npm run start` trong `open-erp-web` và debug tại `http://localhost:4200`.
  - Đối với Mobile: Khởi chạy `ionic serve` trong `open-erp-mobile` và debug tại `http://localhost:8100`.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Bộ APIs `/login`, `/refresh`, `/logout` hoàn thành chạy kiểm thử thành công (coverage > 80%).
  - Cơ chế trích xuất tenant_id hoạt động ổn định và lọc dữ liệu bằng RLS.
  - Giao diện đăng nhập Web & Mobile hoạt động tốt, đồng bộ màu Rose Gold và hỗ trợ Light/Dark mode.
  - Đa ngôn ngữ Transloco hoạt động tốt khi chuyển đổi ngôn ngữ.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.

---

### 6. Kết quả thực hiện (Implementation Status)
- **Trạng thái**: [x] Đã hoàn thành (Completed - Staged, pending user commit)
- **Kết quả**:
  - Triển khai [TenantMiddleware](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts) trích xuất subdomain và gán vào [tenantContextStorage](../../../../open-erp-services/src/core/tenant/tenant.context.ts).
  - Tích hợp Redis và triển khai [RedisService](../../../../open-erp-services/src/core/redis/redis.service.ts) để lưu trữ phiên làm việc của Refresh Token.
  - Xây dựng thành công các API endpoints trong [AuthController](../../../../open-erp-services/src/features/auth/auth.controller.ts) và xử lý logic tương ứng trong [AuthService](../../../../open-erp-services/src/features/auth/auth.service.ts).
  - Triển khai giao diện đăng nhập [LoginComponent](../../../../open-erp-web/src/app/features/auth/login/login.component.ts) & [login.component.html](../../../../open-erp-web/src/app/features/auth/login/login.component.html) tuân thủ theme Rose Gold và chế độ Light/Dark Mode.
  - Xây dựng functional [authInterceptor](../../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts) hỗ trợ đính kèm JWT và tự động Silent Refresh ngầm.
