# Tài liệu kỹ thuật chi tiết: TSK-1.1 - Đăng ký doanh nghiệp & Khởi tạo Tenant
## Phân hệ: Quản trị doanh nghiệp & Xác thực (SaaS Onboarding - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng luồng đăng ký doanh nghiệp mới (SaaS Onboarding) trên Web Client. Hệ thống tự động tạo Workspace độc lập cho doanh nghiệp thông qua việc cấp phát subdomain riêng biệt, gán tài khoản Quản trị viên tối cao (Tenant Owner), khởi tạo cấu trúc cơ sở dữ liệu tenant cô lập logic và gửi email kích hoạt tài khoản.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng dữ liệu đăng ký (Registration Flow)
```text
[Người dùng (Web Form)] ──► Điền thông tin (Email, Password, Subdomain)
                                      │
                                      ▼
                        (Kiểm tra trùng lặp Subdomain)
                                      │
                                      ▼
                        [Ghi vào DB: tenants & users]
                                      │
                                      ▼
                      [Gửi email xác thực kèm Activation Token]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../03_functional/api_overview.md).

* **`POST /api/v1/auth/register`** (Public)
  - **Payload yêu cầu:**
    ```json
    {
      "companyName": "Công ty Cổ phần GoTech",
      "email": "owner@gotech.com",
      "password": "SecurePassword123!",
      "subdomain": "gotech",
      "phone": "0901234567"
    }
    ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "messageKey": "auth.register_success"
    }
    ```
* **`GET /api/v1/auth/check-subdomain`** (Public)
  - **Tham số query:** `?subdomain=gotech`
  - **Phản hồi (200 OK):**
    ```json
    {
      "success": true,
      "data": { "available": true }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Khởi tạo dữ liệu và Tenant Isolation**
  - Viết logic tạo bản ghi mới trong bảng `tenants` và `users` (trạng thái user ban đầu là `Pending`). Mật khẩu được mã hóa bằng thư viện `bcrypt`.
  - Áp dụng cơ chế Row-Level Security (RLS) để cô lập dữ liệu của Tenant vừa tạo theo đặc tả trong [system_design.md](../../04_technical/system_design.md).
* **Nhiệm vụ 2: Viết APIs Đăng ký & Kiểm tra Subdomain**
  - Thực hiện validate regex đầu vào: subdomain chỉ chứa chữ thường và số, không chứa ký tự đặc biệt, email đúng định dạng.
  - Sử dụng hàng đợi BullMQ gửi email bất đồng bộ chứa link kích hoạt: `https://gotech.open-erp.9ms.io.vn/activate?token=xxx` (Token hết hạn sau 24 giờ).

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Xây dựng Form đăng ký**
  - Tạo trang đăng ký sử dụng các UI components dùng chung (Button, Input, Form) từ thư viện **`open-erp-ui`** đảm bảo màu chủ đạo **Rose Gold (`#B76E79`)** và hiển thị sắc nét ở cả hai chế độ **Light/Dark Mode**.
  - Tích hợp kiểm tra trùng lặp subdomain realtime (gọi API check subdomain sau khi người dùng ngừng gõ 500ms - debounce).
* **Nhiệm vụ 2: Tích hợp Đa ngôn ngữ (Transloco)**
  - Cấu hình tất cả các nhãn (labels), placeholder, và thông báo lỗi (validation messages) trong các file ngôn ngữ `vi.json`, `en.json`, `zh.json`, `ja.json`. Sử dụng directive `*transloco="let t"` để render động.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Lưu ý nghiệp vụ:* Đối với phiên bản MVP, Mobile App không hỗ trợ chức năng đăng ký doanh nghiệp mới trực tiếp trên app. Người dùng được hướng dẫn thực hiện đăng ký trên trình duyệt web. Do đó, FE Mobile chỉ thiết lập màn hình chờ điều hướng hoặc mở trình duyệt ngoài trỏ đến trang đăng ký.

#### 3.4 UI/UX Designer
* Cung cấp thiết kế chi tiết trang Đăng ký (SaaS Register Layout) trên Figma đảm bảo responsive cho Desktop, Tablet, Mobile theo đặc tả trong [sitemap_and_wireframes.md](../../02_user_requirements/sitemap_and_wireframes.md).

#### 3.5 DevOps
* Cấu hình Nginx Ingress Controller hỗ trợ Wildcard Routing (`*.open-erp.9ms.io.vn`) để đảm bảo các subdomain mới khởi tạo lập tức truy cập được mà không cần cấu hình mạng lại.

#### 3.6 QA Engineer
* Viết kịch bản kiểm thử (Test Cases) kiểm tra:
  - Đăng ký thành công với subdomain hợp lệ và check nhận được mail kích hoạt.
  - Lỗi validate dữ liệu (Email sai định dạng, mật khẩu yếu, subdomain chứa dấu cách).
  - Lỗi đăng ký trùng lặp subdomain đã tồn tại.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Hạ tầng):** Đảm bảo cụm hạ tầng PostgreSQL & Redis local đang chạy:
  ```bash
  docker compose -f ../../docker-compose.local.yml up -d
  ```
* **Bước 2 (Gỡ lỗi Backend):** Mở dự án trong VSCode, đặt breakpoint tại controller đăng ký, mở tab Run and Debug của VSCode và chọn **"Debug NestJS Backend"** để khởi động runtime debug.
* **Bước 3 (Chạy Web Client):** Truy cập thư mục `open-erp-web` chạy lệnh `npm run start` và kiểm thử giao diện tại `http://localhost:4200`.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - API đăng ký và check subdomain hoạt động ổn định, được viết unit test đầy đủ (coverage > 80%).
  - Giao diện đăng ký Web responsive, hỗ trợ Light/Dark mode, màu nhấn Rose Gold và hiển thị đúng ngôn ngữ khi chuyển đổi qua Transloco.
  - Luồng gửi mail kích hoạt chạy ổn định qua hàng đợi BullMQ.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)

Task TSK-1.1 đã được hoàn thành đầy đủ các tiêu chí bàn giao và tích hợp thành công trên nhánh `develop`:

* **Backend Services (`open-erp-services`):**
  - Khởi tạo thành công hai thực thể cơ sở dữ liệu [Tenant Entity](../../../open-erp-services/src/core/tenant/tenant.entity.ts) và [User Entity](../../../open-erp-services/src/core/user/user.entity.ts).
  - Triển khai APIs trong [AuthController](../../../open-erp-services/src/features/auth/auth.controller.ts) và [AuthService](../../../open-erp-services/src/features/auth/auth.service.ts) thực hiện kiểm tra subdomain khả dụng và xử lý transaction đăng ký, mã hóa mật khẩu qua `bcrypt`.
  - Giả lập gửi email kích hoạt tài khoản bất đồng bộ thông qua BullMQ.
  - Xây dựng bộ unit tests toàn diện trong [auth.service.spec.ts](../../../open-erp-services/src/features/auth/auth.service.spec.ts) đạt 100% tỷ lệ pass.
* **Web Client (`open-erp-web`):**
  - Tích hợp thành công thư viện `@jsverse/transloco` phiên bản 8 điều phối đa ngôn ngữ và `feather-icons` hiển thị icon chuẩn hóa qua `<oerp-icon>`.
  - Triển khai [RegisterComponent](../../../open-erp-web/src/app/features/auth/register/register.component.ts) sử dụng các component dùng chung như `<oerp-input>`, `<oerp-button>`.
  - Tích hợp kiểm tra subdomain khả dụng với cơ chế debounce 500ms.
  - Hỗ trợ lưu trữ trạng thái người dùng về giao diện (Light/Dark Mode) và cấu hình ngôn ngữ xuống LocalStorage.
* **Tài liệu & Xác nhận visual:**
  - Quy trình đăng ký và chuyển đổi giao diện đã được kiểm chứng tự động qua Playwright.
