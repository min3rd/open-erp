# [ANL-01] Phân Tích Nghiệp Vụ Chi Tiết: Core Identity, Access & Account Management

- **Mã Tài Liệu**: ANL-01
- **Phụ Trách**: BA Agent
- **Ngày Thực Hiện**: 2026-09-17
- **Thuộc Sprint**: Sprint 01
- **Tài Liệu Nguồn**: [RAW-01_sprint_01_core_identity.md](../raw_notes/RAW-01_sprint_01_core_identity.md)

---

## 1. Các Tác Nhân Hệ Thống (Actors)

1. **Khách vãng lai (Guest / Anonymous User)**:
   - Chưa đăng nhập, có thể xem trang đăng ký cá nhân, đăng ký doanh nghiệp, đăng nhập, hoặc yêu cầu quên mật khẩu.
2. **Người dùng cá nhân (Personal User / Employee)**:
   - Đã sở hữu tài khoản xác thực, có thể thuộc về một hoặc nhiều Không gian Doanh nghiệp (Tenants) với các quyền hạn khác nhau; sở hữu Personal Workspace.
3. **Quản trị viên Doanh nghiệp (Tenant Admin)**:
   - Người đăng ký khởi tạo Doanh nghiệp mới; có toàn quyền quản trị người dùng, cấu hình, cài đặt plugin trong phạm vi Tenant của mình.

---

## 2. Mô Hình Định Danh & Khách Thuê (Identity & Multi-Tenancy Architecture)

Trong hệ thống Open-ERP, kiến trúc định danh được bóc tách thành 3 tầng độc lập:

```
+--------------------------------------------------------------------+
| 1. GLOBAL IDENTITY (Tài Khoản Toàn Cục)                            |
| - user_id, email, password_hash, status, 2fa_secret, profile       |
+--------------------------------------------------------------------+
                                |
                                v
+--------------------------------------------------------------------+
| 2. MEMBERSHIP / TENANT LINKAGE (Liên Kết Doanh Nghiệp)             |
| - Quan hệ N - N giữa User và Tenant                                |
| - user_id, tenant_id, role (TENANT_ADMIN | MEMBER | VIEWER)        |
+--------------------------------------------------------------------+
                                |
                                v
+--------------------------------------------------------------------+
| 3. TENANT CONTEXT (Ngữ Cảnh Làm Việc Của Phiên Làm Việc)           |
| - Mỗi request API mang Header: `X-Tenant-Id` hoặc JWT `tenant_id`  |
| - CSDL tự động lọc dữ liệu bằng RLS hoặc kết nối Database riêng    |
+--------------------------------------------------------------------+
```

---

## 3. Phân Tích Chi Tiết 6 Chức Năng Cốt Lõi

### 3.1. Đăng Ký Tài Khoản Cá Nhân (Personal Registration)
- **Mục tiêu**: Cho phép cá nhân tự tạo tài khoản định danh trong hệ thống.
- **Dữ liệu đầu vào**:
  - Họ và tên (`full_name`, 2 - 100 ký tự).
  - Email (`email`, chuẩn RFC 5322, duy nhất trong toàn hệ thống).
  - Mật khẩu (`password`, tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt).
  - Số điện thoại (`phone_number`, tùy chọn).
- **Luồng xử lý**:
  1. Người dùng gửi form đăng ký.
  2. Hệ thống kiểm tra trùng lặp email.
  3. Mã hóa mật khẩu bằng thuật toán an toàn **Argon2id** (lựa chọn duy nhất, không dùng BCrypt).
  4. Tạo bản ghi User ở trạng thái `PENDING_VERIFICATION`.
  5. Sinh mã OTP kích hoạt 6 chữ số (hạn dùng 15 phút), gửi email thông báo qua Quarkus Mailer (bắt tại Mailpit port 8025).
  6. Người dùng nhập mã OTP để kích hoạt tài khoản sang `ACTIVE` và hệ thống tự động cấp một Personal Workspace (`tenants.type = 'PERSONAL'`, vai trò `TENANT_ADMIN`).

### 3.2. Đăng Ký Tài Khoản Quản Trị Doanh Nghiệp (Business Registration / Tenant Creation)
- **Mục tiêu**: Cho phép một doanh nghiệp mới gia nhập nền tảng Open-ERP, tạo ra một Tenant độc lập.
- **Dữ liệu đầu vào**:
  - *Thông tin Quản trị viên*: Họ tên, Email quản trị, Mật khẩu.
  - *Thông tin Doanh nghiệp*:
    - Tên công ty (`company_name`, ví dụ: "Công ty Cổ phần Công nghệ OpenERP").
    - Định danh Tenant / Subdomain (`tenant_slug`, ví dụ: `openerp-tech`).
    - Mã số thuế (`tax_code`, tùy chọn).
    - Quy mô nhân sự (`company_size`: 1-10, 11-50, 51-200, 200+).
    - Quốc gia / Tiền tệ mặc định (`currency`: VND, USD).
- **Luồng xử lý**:
  1. Kiểm tra tính khả dụng của `tenant_slug` (chỉ chấp nhận chữ thường, số và dấu gạch ngang; không trùng với các slug hệ thống như `api`, `admin`, `core`).
  2. Trong một Database Transaction:
     - Tạo bản ghi `tenants` với `type = 'BUSINESS'`.
     - Tạo tài khoản User mới. Nếu email đã tồn tại trong hệ thống, hệ thống **không tự động liên kết** mà trả về lỗi `AUTH_EMAIL_ALREADY_EXISTS` (người dùng phải đăng nhập và dùng chức năng tạo thêm doanh nghiệp ở giai đoạn sau) nhằm chống chiếm đoạt tài khoản.
     - Thiết lập quan hệ trong `user_tenants` với vai trò `TENANT_ADMIN`.
     - Khởi tạo Tenant Data Isolation (Row-Level Security Tenant ID hoặc Database riêng).
  3. Gửi email xác nhận kèm link truy cập workspace.

### 3.3. Đăng Nhập & Phân Giải Ngữ Cảnh (Authentication & Multi-Tenant Resolution)
- **Mục tiêu**: Xác thực người dùng an toàn và định tuyến đúng Tenant làm việc.
- **Luồng xử lý**:
  1. Người dùng nhập Email và Mật khẩu.
  2. Hệ thống kiểm tra Brute-force: Nếu thất bại $\ge 5$ lần trong 10 phút $\rightarrow$ khóa tạm thời 15 phút.
  3. Xác thực mã hash mật khẩu.
  4. Kiểm tra trạng thái 2FA:
     - Nếu **ĐÃ BẬT 2FA**: Trả về `2FA_REQUIRED` kèm `pre_auth_token` (hạn 5 phút) để chuyển sang màn hình nhập OTP 6 số.
     - Nếu **CHƯA BẬT 2FA**: Chuyển sang bước giải quyết Tenant.
  5. Giải quyết Tenant:
     - Nếu người dùng chỉ thuộc **1 Tenant**: Cấp phát cặp JWT Tokens (Access Token 15 phút, Refresh Token 7 ngày) mang `tenant_id` tương ứng, lưu phiên vào Redis.
     - Nếu người dùng thuộc **nhiều Tenant**: Trả về danh sách Tenant (Workspace Picker). Người dùng chọn 1 Tenant $\rightarrow$ Cấp JWT Token mang `tenant_id` đã chọn.

### 3.4. Quên Mật Khẩu & Khôi Phục Tài Khoản (Password Recovery)
- **Mục tiêu**: Cho phép người dùng lấy lại quyền truy cập khi quên mật khẩu qua kênh xác thực Email.
- **Luồng xử lý**:
  1. Người dùng nhập email tại màn hình "Quên Mật Khẩu".
  2. Hệ thống kiểm tra: Dù email có tồn tại hay không, vẫn trả về phản hồi chung: "Chúng tôi đã gửi link đặt lại mật khẩu nếu email tồn tại" (ngăn chặn tấn công dò quét email - Account Enumeration).
  3. Nếu email hợp lệ: Sinh token ngẫu nhiên mật mã học 32-bytes (`SecureRandom`), hash SHA-256 lưu CSDL kèm `expires_at` (15 phút).
  4. Gửi email chứa đường dẫn `http://localhost:4200/reset-password?token=...`.
  5. Người dùng truy cập link, nhập mật khẩu mới.
  6. Hệ thống kiểm tra token, cập nhật mật khẩu mới, hủy token, đồng thời thu hồi toàn bộ các phiên đăng nhập cũ trong Redis (`Session Revocation`).

### 3.5. Xác Thực 2 Yếu Tố (Two-Factor Authentication - TOTP)
- **Mục tiêu**: Tăng cường bảo mật cấp ngân hàng bằng thuật toán TOTP (RFC 6238).
- **Luồng xử lý**:
  1. **Kích hoạt (Setup)**:
     - Hệ thống sinh Base32 Secret Key (160 bits).
     - Tạo QR code chứa URL: `otpauth://totp/OpenERP:<email>?secret=<secret>&issuer=OpenERP`.
     - Sinh 8 mã dự phòng (Backup Codes) dạng `XXXX-XXXX`.
     - Người dùng quét mã bằng Google Authenticator / Microsoft Authenticator và nhập thử mã 6 số hiện tại để kích hoạt.
  2. **Xác thực khi đăng nhập**:
     - Người dùng nhập mã 6 số từ app Authenticator.
     - Hệ thống kiểm tra với độ lệch thời gian cho phép $\pm 1$ bước (drift tolerance 30s).
     - Nhập sai 3 lần liên tiếp (tính từ lần sai thứ 3): hủy phiên xác thực tạm (`pre_auth_token` trong Redis) và buộc người dùng đăng nhập lại từ đầu.
  3. **Khôi phục khẩn cấp bằng Backup Code**:
     - Nhập mã dự phòng khi không có điện thoại. Mã dự phòng sử dụng 1 lần sẽ bị xóa vĩnh viễn.

### 3.6. Quản Lý Tài Khoản (Account Management)
- **Mục tiêu**: Người dùng tự quản lý thông tin hồ sơ cá nhân, các thiết lập bảo mật (mật khẩu, xác thực 2 yếu tố 2FA) và giám sát các thiết bị/phiên đăng nhập.
- **Các phân hệ chức năng chi tiết**:
  1. **Hồ sơ cá nhân (User Profile)**:
     - Xem và chỉnh sửa: Họ tên (`full_name`), ảnh đại diện (`avatar_url`), số điện thoại (`phone`), ngôn ngữ giao diện (`vi` / `en`), múi giờ làm việc (`timezone`).
  2. **Đổi mật khẩu an toàn (Password Change)**:
     - Nhập mật khẩu hiện tại + mật khẩu mới (xác nhận lại 2 lần).
     - Tùy chọn "Đăng xuất khỏi tất cả các thiết bị khác" khi đổi mật khẩu thành công.
  3. **Đăng Ký & Xóa/Tắt Xác Thực 2 Yếu Tố (2FA Management)**:
     - **Xem trạng thái 2FA**:
       - Trạng thái hiện tại: `ĐÃ BẬT` (Kèm thời điểm bật, số lượng Backup Codes còn lại) hoặc `CHƯA BẬT`.
     - **Quy trình Đăng ký / Bật 2FA (Setup & Enable)**:
       - Bước 1: Người dùng nhấn nút "Bật 2FA" tại Tab Bảo Mật của Drawer Quản lý tài khoản.
       - Bước 2: Hệ thống trượt mở Stacked Drawer con (`Setup2FaDrawer`), sinh Base32 Secret Key ngẫu nhiên và mã QR URI (`otpauth://totp/...`), đồng thời sinh trước 8 mã dự phòng (Backup Codes).
       - Bước 3: Người dùng dùng app Authenticator quét mã QR (hoặc sao chép chuỗi Secret Key thủ công trên mobile), sau đó nhập mã OTP 6 số hiện tại hiển thị trên app.
       - Bước 4: Hệ thống xác thực mã 6 số. Nếu hợp lệ $\rightarrow$ lưu Secret Key đã mã hóa AES-256 vào bảng `user_two_factor`, hash và lưu 8 Backup Codes, cập nhật `is_enabled = TRUE`, hiển thị danh sách 8 mã dự phòng kèm nút sao chép / tải file txt.
     - **Quy trình Xóa / Tắt 2FA (Disable / Delete 2FA)**:
       - *Mục đích*: Người dùng muốn đổi điện thoại mới, hủy xác thực 2 bước hoặc tạm ngưng sử dụng.
       - *Ràng buộc bảo mật bắt buộc (Security Guardrail)*: Thao tác tắt 2FA là hành động nhạy cảm làm giảm mức bảo mật tài khoản. **Bắt buộc người dùng phải xác thực chính chủ bằng mật khẩu đăng nhập hiện tại (`current_password`) VÀ mã OTP 6 số hiện tại (`code`)** (hoặc 1 mã Backup Code hợp lệ) trước khi thực hiện.
       - *Xử lý hệ thống*: Sau khi xác thực hợp lệ, hệ thống cập nhật `is_enabled = FALSE`, xóa Secret Key mã hóa, hủy toàn bộ mã dự phòng cũ, đồng thời gửi email thông báo bảo mật khẩn cấp qua Quarkus Mailer (bắt tại Mailpit local) cảnh báo người dùng rằng 2FA vừa bị tắt.
     - **Tái tạo mã dự phòng (Regenerate Backup Codes)**:
       - Khi người dùng đã dùng gần hết 8 mã dự phòng hoặc nghi ngờ bị lộ, có thể chọn "Tạo lại bộ mã dự phòng".
       - Yêu cầu nhập mật khẩu hiện tại để xác thực, sau đó hệ thống sinh 8 mã mới và vô hiệu hóa vĩnh viễn toàn bộ các mã cũ.
  4. **Quản lý phiên đăng nhập (Active Sessions Monitor)**:
     - Xem danh sách thiết bị đang hoạt động (Tên trình duyệt, Hệ điều hành, Địa chỉ IP, Thời điểm đăng nhập gần nhất).
     - Nút "Đăng xuất thiết bị này" (xóa session tương ứng trong Redis).
     - Nút "Đăng xuất khỏi tất cả các thiết bị khác" (thu hồi toàn bộ phiên trừ phiên hiện tại).
- **Quy chuẩn UI/UX**:
  - Toàn bộ giao diện quản lý tài khoản hiển thị dưới dạng **Drawer trượt từ cạnh phải (Side Sheet)** hoặc **Split-Screen** trên Desktop. **Tuyệt đối không dùng Modal popup**.
  - Font chữ nhỏ gọn (`text-xs`), viền vuông vắn (`rounded-none`), sử dụng Drawer phụ xếp chồng (`Stacked Drawer`) cho các luồng cài đặt và tắt 2FA.

---

## 4. Ma Trận Phân Định Nền Tảng: Desktop vs. Mobile

| Tính Năng | Web Desktop (Angular 22) | Mobile App (Ionic 8) | Ghi Chú Giao Diện |
| :--- | :---: | :---: | :--- |
| Đăng ký cá nhân | Có (Full) | Có (Full) | Form vuông vắn, 1 cột trên Mobile |
| Đăng ký doanh nghiệp | Có (Full 2 bước) | Có (Tối giản) | Mobile chỉ nhập các trường cơ bản |
| Đăng nhập & Chọn Tenant | Có (Full) | Có (Full) | Nhập OTP số lớn dễ bấm trên mobile |
| Quên mật khẩu | Có (Full) | Có (Full) | Nhập email nhận link khôi phục |
| Cài đặt 2FA | Có (Quét QR Code) | Có (Copy Secret Key) | Mobile ưu tiên copy key sang app auth |
| Quản lý thông tin & Đổi mật khẩu | Có (Drawer trượt / Split) | Có (Page trượt / Tab) | Desktop dùng Drawer cạnh phải |
| Giám sát & Hủy phiên từ xa | Có (Full bảng chi tiết) | Có (Danh sách thẻ gọn) | Hiển thị IP, thiết bị, thời gian |
