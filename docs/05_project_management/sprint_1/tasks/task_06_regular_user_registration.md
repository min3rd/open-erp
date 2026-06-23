# Tài liệu kỹ thuật chi tiết: TSK-1.6 - Đăng ký tài khoản thường (Không phải chủ doanh nghiệp)
## Phân hệ: Quản trị doanh nghiệp & Xác thực (SaaS Onboarding - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng luồng đăng ký tài khoản thường (Regular User) cho phép người dùng tự chủ động đăng ký tài khoản cá nhân trên hệ thống (không bắt buộc phải có doanh nghiệp/tenant). Tài khoản này là tài khoản global, giúp người dùng đăng nhập hệ thống và có thể tham gia vào nhiều doanh nghiệp/tenant khác nhau (ví dụ khi thay đổi công việc hoặc cộng tác viên cho nhiều bên). Tính năng này phải được triển khai đồng bộ trên cả Web Client và Mobile App.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng đăng ký tài khoản thường (Regular User Sign Up Flow)
* Thực hiện trên tên miền chung (Flat Domain - ví dụ: `https://open-erp.9ms.io.vn` hoặc `http://localhost:4200` / `http://localhost:8100`).
* **Không yêu cầu nhập subdomain hay thông tin doanh nghiệp.** Người dùng chỉ cung cấp thông tin cá nhân cơ bản: Email, Mật khẩu, Họ tên, và Số điện thoại.

```text
[Người dùng (Web / Mobile App)] ──► Điền Email, Mật khẩu, Họ tên, Số điện thoại (Flat Domain)
                                               │
                                               ▼
                              [Backend validate tính duy nhất của Email]
                                               │
                                               ▼
                              [Lưu DB: users (status: Pending / Active tùy cấu hình OTP)]
                                               │
                                               ▼
                              [Gửi email xác thực / OTP kích hoạt tài khoản]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/auth/register/user`** (Public - Đăng ký tài khoản thường toàn cầu)
  - **Payload yêu cầu:**
    ```json
    {
      "email": "employee@gmail.com",
      "password": "SecurePassword123!",
      "firstName": "Nguyễn Văn",
      "lastName": "A",
      "phone": "0987654321"
    }
    ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "messageKey": "auth.user_register_success"
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: API Đăng ký tài khoản thường**
  - Viết logic `registerUser` trong `AuthService` và controller tương ứng.
  - Mã hóa mật khẩu bằng `bcrypt`. Lưu thông tin vào bảng `users` với `tenant_id = null` (tài khoản global chưa thuộc tenant nào cho đến khi được gán hoặc tham gia).
* **Nhiệm vụ 2: Unit tests**
  - Viết unit tests kiểm chứng tính duy nhất của email, định dạng email, độ mạnh mật khẩu và lưu database thành công.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Form Đăng ký tài khoản thường trên Web**
  - Thiết kế trang Đăng ký cá nhân `/register/user` riêng biệt với trang đăng ký doanh nghiệp (không có trường subdomain/companyName).
  - Sử dụng các UI components dùng chung từ thư viện `@open-erp/shared-ui` đồng bộ theme Rose Gold và Light/Dark mode.
  - Tích hợp Transloco hiển thị đa ngôn ngữ.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Form Đăng ký tài khoản thường trên Mobile (Ionic)**
  - Xây dựng màn hình đăng ký tài khoản thường (Sign Up Page) trên ứng dụng di động. Giao diện trực quan, tối ưu cho bàn phím ảo di động.
  - Sử dụng các component UI dùng chung và đồng bộ theme Rose Gold / chế độ Light/Dark Mode của Mobile App.
  - Thực hiện validate form (email hợp lệ, password trùng khớp) trực tiếp trên Client trước khi gửi API.

#### 3.4 UI/UX Designer
* Phác thảo mockup màn hình Đăng ký tài khoản thường cho cả phiên bản Web và Mobile App, tối giản hóa các bước để nâng cao trải nghiệm người dùng.

#### 3.5 QA Engineer
* Thực hiện viết test cases và kiểm thử:
  - Đăng ký tài khoản thường thành công trên cả Web và Mobile.
  - Kiểm tra các trường hợp lỗi trùng email, mật khẩu không đúng định dạng.
  - Xác nhận tài khoản thường sau khi tạo có thể được mời vào một tenant thành công.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Chạy hạ tầng local**:
  ```bash
  docker compose -f ../../../../docker-compose.local.yml up -d
  ```
* **Debug Backend**:
  Mở cấu hình **"Debug NestJS Backend"** trong VSCode, đặt breakpoint tại hàm `registerUser` trong `auth.service.ts`.
* **Kiểm tra Client**:
  - Web: Chạy ứng dụng và test tại `http://localhost:4200/register/user`.
  - Mobile: Chạy ứng dụng di động và test tại `http://localhost:8100/register`.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* API đăng ký tài khoản thường hoạt động ổn định và bảo mật. [x]
* Giao diện đăng ký trên cả Web và Mobile hoàn thiện, responsive, hỗ trợ đa ngôn ngữ Transloco và Light/Dark mode. [x]
* Tích hợp thành công và mã nguồn đã được review và merge vào nhánh `develop`. [x]

---

### 6. Kết quả triển khai thực tế (Actual Implementation)

Tính năng đăng ký tài khoản thường đã được triển khai hoàn chỉnh trên cả Backend, Web Client, Mobile App và thư viện dùng chung. Dưới đây là chi tiết các thay đổi:

#### Danh sách các file thay đổi (Changed Files)
| Trạng thái | Tên file | Đường dẫn chi tiết |
| :--- | :--- | :--- |
| **[MODIFY]** | [user.entity.ts](../../../../open-erp-services/src/core/user/user.entity.ts) | Cho phép `tenantId` nullable và thêm các trường `first_name`, `last_name`, `phone` |
| **[NEW]** | [register-user.dto.ts](../../../../open-erp-services/src/features/auth/dto/register-user.dto.ts) | Định nghĩa DTO validate cho đăng ký tài khoản thường |
| **[MODIFY]** | [auth.service.ts](../../../../open-erp-services/src/features/auth/auth.service.ts) | Triển khai phương thức `registerUser` và tối ưu `login` an toàn với tenantId null |
| **[MODIFY]** | [auth.controller.ts](../../../../open-erp-services/src/features/auth/auth.controller.ts) | Bổ sung API `POST /api/v1/auth/register/user` |
| **[MODIFY]** | [auth.model.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/models/auth.model.ts) | Thêm interface payload `RegisterUserPayload` |
| **[MODIFY]** | [api-endpoints.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/constants/api-endpoints.ts) | Bổ sung endpoint đăng ký tài khoản thường |
| **[MODIFY]** | [auth.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts) | Triển khai phương thức API client `registerUser` |
| **[MODIFY]** | [app.routes.ts](../../../../open-erp-web/src/app/app.routes.ts) | Đăng ký tuyến đường `/register/user` trên Web |
| **[NEW]** | [register-user.component.ts](../../../../open-erp-web/src/app/features/auth/register-user/register-user.component.ts) | Thành phần logic trang đăng ký tài khoản cá nhân trên Web |
| **[NEW]** | [register-user.component.html](../../../../open-erp-web/src/app/features/auth/register-user/register-user.component.html) | Giao diện HTML trang đăng ký cá nhân hỗ trợ theme Rose Gold lấp lánh và Dark Mode |
| **[MODIFY]** | Ngôn ngữ dịch Web | Cập nhật nhãn và validate trong các file `vi.json`, `en.json`, `zh.json`, `ja.json` của Web |
| **[MODIFY]** | [app.routes.ts](../../../../open-erp-mobile/src/app/app.routes.ts) | Đăng ký tuyến đường `/register/user` trên Mobile |
| **[NEW]** | [register-user.page.ts](../../../../open-erp-mobile/src/app/auth/register-user/register-user.page.ts) | Logic Ionic page đăng ký cá nhân trên Mobile |
| **[NEW]** | [register-user.page.html](../../../../open-erp-mobile/src/app/auth/register-user/register-user.page.html) | Layout Ionic page đăng ký cá nhân hỗ trợ theme Rose Gold |
| **[NEW]** | [register-user.page.scss](../../../../open-erp-mobile/src/app/auth/register-user/register-user.page.scss) | Style hiệu ứng động và chuyển cảnh cho Mobile |
| **[MODIFY]** | Ngôn ngữ dịch Mobile | Cập nhật các nhãn ngôn ngữ tương ứng trong file `vi.json`, `en.json`, `zh.json`, `ja.json` của Mobile |

