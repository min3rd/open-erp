# Tài liệu kỹ thuật chi tiết: TSK-1.8 - Tích hợp đăng nhập OAuth (Google & Microsoft)
## Phân hệ: Xác thực & Phân quyền (SaaS IAM - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Tích hợp phương thức đăng nhập và đăng ký nhanh thông qua các nhà cung cấp định danh bên thứ ba phổ biến (OAuth 2.0): **Google** và **Microsoft**. Người dùng có thể sử dụng tài khoản Google/Microsoft cá nhân hoặc doanh nghiệp để đăng nhập trực tiếp trên tên miền chung (Flat Domain), tự động liên kết tài khoản và chọn workspace tương ứng. Tính năng này phải được triển khai đồng bộ và tối ưu hóa trải nghiệm trên cả Web Client và Mobile App.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng xác thực OAuth 2.0 (OAuth Verification Flow)
* Quá trình đăng nhập OAuth được thực hiện trên flat domain của Web và Mobile App.
* **Luồng xử lý:**

```text
[Người dùng (Web / Mobile)] ──► Nhấp nút "Đăng nhập với Google/Microsoft"
                                               │
                                               ▼
                              [Client gọi SDK Google/Microsoft]
                              (Mở pop-up xác thực / Native Auth screen)
                                               │
                                               ▼
                              [Nhận về ID Token / Access Token]
                                               │
                                               ▼
                              [Gửi Token lên Backend: /auth/oauth]
                                               │
                                               ▼
                              [Backend validate Token với Google/MS]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼ (Email chưa tồn tại)                          ▼ (Email đã tồn tại)
         [Tự động đăng ký tài khoản mới]                  [Xác minh thông tin tài khoản]
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                         [Đối soát danh sách Tenant & Trả về phiên JWT]
                         (Đi qua luồng Chọn Workspace nếu thuộc > 1 Tenant)
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/auth/oauth/google`** (Public - Xác thực Google ID Token)
  - **Payload yêu cầu:**
    ```json
    {
      "idToken": "eyJhbGciOiJSUzI1Ni..."
    }
    ```
  - **Phản hồi thành công (200 OK):** Trả về cờ `requireTenantSelection` hoặc thông tin JWT Token tương tự như luồng Login thông thường.
* **`POST /api/v1/auth/oauth/microsoft`** (Public - Xác thực Microsoft Token)
  - **Payload yêu cầu:**
    ```json
    {
      "accessToken": "ey...",
      "idToken": "ey..."
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai thư viện xác thực OAuth**
  - Cài đặt `google-auth-library` để giải mã và xác thực Google ID Token một cách an toàn trên server.
  - Viết logic xác thực chữ ký của Microsoft JWT Token sử dụng public keys từ JWKs endpoint của Microsoft (`https://login.microsoftonline.com/common/discovery/v2.0/keys`).
* **Nhiệm vụ 2: Logic liên kết và Đăng ký tự động**
  - Lấy email từ token. Nếu email chưa tồn tại trong bảng `users`, tự động tạo bản ghi mới (trạng thái `Active`, mật khẩu random) làm tài khoản thường toàn cầu.
  - Kiểm tra và liên kết các workspace/tenant hiện có của email này để trả về kết quả đăng nhập chính xác.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Nút đăng nhập Google & Microsoft trên Web**
  - Tích hợp Google Identity Services SDK (`https://accounts.google.com/gsi/client`) và hiển thị nút đăng nhập chuẩn của Google hoặc Google One Tap Sign-In.
  - Tích hợp MSAL Angular SDK (`@azure/msal-angular`) để gọi màn hình đăng nhập Microsoft.
  - Đồng bộ theme Rose Gold và chế độ Light/Dark Mode của trang đăng nhập.
* **Nhiệm vụ 2: Xử lý redirect và chọn Workspace**
  - Nhận kết quả Token từ SDK, gửi lên Backend, và xử lý điều hướng chọn Workspace tương tự như luồng Đăng nhập tài khoản thường (TSK-1.7).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Đăng nhập Google & Microsoft trên Mobile (Ionic/Capacitor)**
  - Tích hợp Capacitor Google Auth Plugin (`@codetrix-studio/capacitor-google-auth`) để kích hoạt màn hình đăng nhập Google Native (sử dụng tài khoản Google đã đăng nhập sẵn trên thiết bị iOS/Android).
  - Tích hợp Capacitor Browser Plugin để thực hiện OAuth Flow cho Microsoft thông qua cửa sổ InAppBrowser an toàn, tuân thủ tiêu chí bảo mật của Apple và Google.
  - Đảm bảo trải nghiệm native mượt mà và đồng bộ thiết kế giao diện di động.

#### 3.4 QA Engineer
* Thực hiện viết test cases:
  - Đăng nhập OAuth thành công với tài khoản chưa từng đăng ký -> Hệ thống tự động tạo user thường mới.
  - Đăng nhập OAuth với tài khoản đã liên kết với 1 tenant -> Vào thẳng dashboard.
  - Đăng nhập OAuth với tài khoản liên kết nhiều tenant -> Hiển thị danh sách chọn workspace.
  - Kiểm thử lỗi token giả mạo hoặc hết hạn -> Trả về lỗi `401 Unauthorized` chính xác.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Thiết lập credentials**:
  Đăng ký các ứng dụng trên Google Cloud Console (OAuth Client ID) và Microsoft Entra ID (Azure AD App Registration). Lưu Client ID/Secret vào file config môi trường backend và frontend.
* **Debug local**:
  Sử dụng ngrok hoặc cấu hình DNS local để chạy HTTPS trên local dev, do một số SDK của Google/Microsoft yêu cầu HTTPS hoặc tên miền cụ thể để chạy pop-up đăng nhập.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* API xác thực OAuth Google/Microsoft hoạt động ổn định và bảo mật.
* Giao diện nút đăng nhập Google/Microsoft trên cả Web và Mobile hoàn thiện, responsive, hỗ trợ đa ngôn ngữ và Light/Dark mode.
* Tích hợp thành công và mã nguồn đã được review và merge vào nhánh `develop`.
