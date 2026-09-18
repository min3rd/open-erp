# [DES-02] Đặc Tả Kỹ Thuật REST API: Core Identity & Access Management (i18n Code-Driven)

- **Mã Tài Liệu**: DES-02
- **Phụ Trách**: Solution Architect Agent
- **Base URL**: `/api/v1`
- **Quy Chuẩn Định Dạng**: JSON Envelope chuẩn hóa (Code-Based i18n Contract)

---

## 1. Khung Phản Hồi Chuẩn Mực (Standardized Response Envelope)

Để đảm bảo khả năng đa ngôn ngữ (i18n) hoàn toàn tự chủ ở Frontend, backend **tuyệt đối không hardcode text tiếng Việt**. Mọi response tuân thủ cấu trúc sau:

### 1.1. Khung Thành Công (`ApiResponse<T>`)
```json
{
  "success": true,
  "code": "AUTH_REGISTER_SUCCESS",
  "message": "User registered successfully",
  "params": {},
  "data": { ... }
}
```

### 1.2. Khung Thất Bại (`ApiErrorResponse`)
```json
{
  "success": false,
  "code": "AUTH_EMAIL_ALREADY_EXISTS",
  "message": "Email is already taken",
  "params": { "field": "email" },
  "errors": [
    {
      "field": "email",
      "code": "VALIDATION_EMAIL_DUPLICATE"
    }
  ],
  "timestamp": "2026-09-17T15:30:00Z"
}
```

---

## 2. Nhóm API Xác Thực & Đăng Ký (`/api/v1/auth`)

### 2.1. `POST /api/v1/auth/register/personal` - Đăng Ký Tài Khoản Cá Nhân
- **Request Body**:
  ```json
  {
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "password": "Password123!@",
    "phone": "0987654321"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "code": "AUTH_REGISTER_SUCCESS",
      "message": "Registration successful. Please verify your email.",
      "params": { "email": "nguyenvana@gmail.com" },
      "data": {
        "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "email": "nguyenvana@gmail.com",
        "status": "PENDING_VERIFICATION"
      }
    }
    ```
  - `400 Bad Request`: `code: "VALIDATION_FAILED"`, danh sách `errors` gồm `VALIDATION_REQUIRED`, `VALIDATION_PASSWORD_TOO_WEAK`.
  - `409 Conflict`:
    ```json
    {
      "success": false,
      "code": "AUTH_EMAIL_ALREADY_EXISTS",
      "message": "Email already registered in system",
      "params": { "field": "email" },
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```

---

### 2.2. `POST /api/v1/auth/verify-email` - Xác Thực Kích Hoạt Email
- **Request Body**:
  ```json
  {
    "email": "nguyenvana@gmail.com",
    "otp_code": "123456"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "AUTH_EMAIL_VERIFIED_SUCCESS",
      "message": "Email verified successfully.",
      "data": { "status": "ACTIVE" }
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "code": "AUTH_OTP_INVALID_OR_EXPIRED",
      "message": "The verification code is invalid or has expired.",
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```

---

### 2.3. `POST /api/v1/auth/register/business` - Đăng Ký Quản Trị Doanh Nghiệp (Tạo Tenant)
- **Request Body**:
  ```json
  {
    "admin": {
      "full_name": "Tran Thi B",
      "email": "admin@acme.vn",
      "password": "AdminPassword123!@"
    },
    "tenant": {
      "name": "Acme Vietnam JSC",
      "slug": "acme-vn",
      "tax_code": "0101234567",
      "company_size": "11-50",
      "currency": "VND"
    }
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "code": "AUTH_BUSINESS_REGISTER_SUCCESS",
      "message": "Business organization initialized successfully.",
      "data": {
        "tenant_id": "8a2cfb11-4f1b-4d0c-8d1e-1f0e2a3b4c5d",
        "tenant_slug": "acme-vn",
        "user_id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
        "role": "TENANT_ADMIN"
      }
    }
    ```
  - `409 Conflict`:
    ```json
    {
      "success": false,
      "code": "AUTH_TENANT_SLUG_DUPLICATE",
      "message": "Tenant identifier slug is already taken.",
      "params": { "slug": "acme-vn" },
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```

---

### 2.4. `POST /api/v1/auth/login` - Đăng Nhập Hệ Thống
- **Request Body**:
  ```json
  {
    "email": "admin@acme.vn",
    "password": "AdminPassword123!@"
  }
  ```
- **Responses**:
  - `200 OK` (1 Tenant duy nhất, không bật 2FA):
    ```json
    {
      "success": true,
      "code": "AUTH_LOGIN_SUCCESS",
      "message": "Authenticated successfully.",
      "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "def50200...",
        "expires_in": 900,
        "user": {
          "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
          "email": "admin@acme.vn",
          "full_name": "Tran Thi B",
          "tenant_id": "8a2cfb11-4f1b-4d0c-8d1e-1f0e2a3b4c5d",
          "role": "TENANT_ADMIN"
        }
      }
    }
    ```
  - `200 OK` (Tài khoản thuộc NHIỀU Tenant $\rightarrow$ Yêu cầu chọn Workspace):
    ```json
    {
      "success": true,
      "code": "AUTH_SELECT_TENANT_REQUIRED",
      "message": "Select workspace tenant to proceed.",
      "data": {
        "pre_auth_token": "pre_token_abc123...",
        "tenants": [
          {"id": "8a2cfb11...", "name": "Acme Vietnam", "slug": "acme-vn", "role": "TENANT_ADMIN"},
          {"id": "7b1dea22...", "name": "Global Logistics", "slug": "global-log", "role": "MEMBER"}
        ]
      }
    }
    ```
  - `200 OK` (Tài khoản ĐÃ BẬT 2FA $\rightarrow$ Yêu cầu mã OTP):
    ```json
    {
      "success": true,
      "code": "AUTH_2FA_REQUIRED",
      "message": "Two-factor authentication code required.",
      "data": {
        "pre_auth_token": "pre_token_xyz789..."
      }
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "code": "AUTH_INVALID_CREDENTIALS",
      "message": "Invalid email or password.",
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```
  - `423 Locked`:
    ```json
    {
      "success": false,
      "code": "AUTH_ACCOUNT_LOCKED",
      "message": "Account temporarily locked due to excessive failed attempts.",
      "params": { "locked_seconds": 900 },
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```

---

### 2.5. `POST /api/v1/auth/select-tenant` - Chọn Tenant Sau Khi Đăng Nhập
- **Request Body**:
  ```json
  {
    "pre_auth_token": "pre_token_abc123...",
    "tenant_id": "8a2cfb11-4f1b-4d0c-8d1e-1f0e2a3b4c5d"
  }
  ```
- **Responses**:
  - `200 OK`: `code: "AUTH_LOGIN_SUCCESS"` kèm bộ JWT Access & Refresh Token của Tenant đã chọn.

---

### 2.6. `POST /api/v1/auth/2fa/verify-login` - Xác Thực Mã 2FA Khi Đăng Nhập
- **Request Body**:
  ```json
  {
    "pre_auth_token": "pre_token_xyz789...",
    "code": "482910"
  }
  ```
- **Responses**:
  - `200 OK`: `code: "AUTH_LOGIN_SUCCESS"` kèm token chính thức.
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "code": "AUTH_2FA_CODE_INVALID",
      "message": "Invalid two-factor authentication code.",
      "timestamp": "2026-09-17T15:30:00Z"
    }
    ```

---

### 2.7. `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`
- **Forgot Password Request**: `{"email": "user@example.com"}`
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "AUTH_FORGOT_PASSWORD_REQUESTED",
      "message": "If the account exists, reset instructions have been sent."
    }
    ```
- **Reset Password Request**:
  ```json
  {
    "token": "secure_reset_token_from_email",
    "new_password": "NewSecretPassword123!@"
  }
  ```
  - `200 OK`: `code: "AUTH_PASSWORD_RESET_SUCCESS"`
  - `400 Bad Request`: `code: "AUTH_RESET_TOKEN_INVALID_OR_EXPIRED"`

---

## 3. Nhóm API Quản Lý Tài Khoản (`/api/v1/account`)
*(Yêu cầu Header `Authorization: Bearer <access_token>`)*

### 3.1. Bảng Tổng Hợp Endpoint
| Method | Endpoint | Mã Code Phản Hồi Thành Công | Mã Code Khi Lỗi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/account/profile` | `ACCOUNT_PROFILE_FETCH_SUCCESS` | `UNAUTHORIZED` |
| `PUT` | `/api/v1/account/profile` | `ACCOUNT_PROFILE_UPDATE_SUCCESS` | `VALIDATION_FAILED` |
| `POST` | `/api/v1/account/change-password` | `ACCOUNT_PASSWORD_CHANGE_SUCCESS` | `ACCOUNT_OLD_PASSWORD_INCORRECT` |
| `GET` | `/api/v1/account/2fa/status` | `ACCOUNT_2FA_STATUS_FETCH_SUCCESS` | `UNAUTHORIZED` |
| `POST` | `/api/v1/account/2fa/setup` | `ACCOUNT_2FA_SETUP_SUCCESS` | `ACCOUNT_2FA_ALREADY_ENABLED` |
| `POST` | `/api/v1/account/2fa/enable` | `ACCOUNT_2FA_ENABLED_SUCCESS` | `AUTH_2FA_CODE_INVALID` |
| `POST` | `/api/v1/account/2fa/disable` | `ACCOUNT_2FA_DISABLED_SUCCESS` | `ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE` |
| `POST` | `/api/v1/account/2fa/regenerate-backup-codes` | `ACCOUNT_2FA_BACKUP_CODES_REGENERATED` | `ACCOUNT_PASSWORD_REQUIRED` |
| `GET` | `/api/v1/account/sessions` | `ACCOUNT_SESSIONS_FETCH_SUCCESS` | `UNAUTHORIZED` |
| `DELETE` | `/api/v1/account/sessions/{sessionId}` | `ACCOUNT_SESSION_REVOKED_SUCCESS` | `ACCOUNT_SESSION_NOT_FOUND` |
| `DELETE` | `/api/v1/account/sessions/other` | `ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS` | `UNAUTHORIZED` |

---

### 3.2. Chi Tiết API Đăng Ký & Xóa/Tắt 2FA

#### 3.2.1. `GET /api/v1/account/2fa/status` - Xem Trạng Thái 2FA Hiện Tại
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "ACCOUNT_2FA_STATUS_FETCH_SUCCESS",
      "message": "Two-factor authentication status retrieved.",
      "data": {
        "is_enabled": true,
        "enabled_at": "2026-09-17T10:00:00Z",
        "backup_codes_remaining": 6
      }
    }
    ```

#### 3.2.2. `POST /api/v1/account/2fa/setup` - Khởi Tạo Đăng Ký 2FA
- **Mục đích**: Sinh Base32 Secret Key ngẫu nhiên và chuẩn bị mã QR để người dùng quét vào app Authenticator.
- **Request Body**: `{}` (rỗng)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "ACCOUNT_2FA_SETUP_SUCCESS",
      "message": "2FA setup initiated successfully. Please verify with OTP to complete.",
      "data": {
        "secret_key": "JBSWY3DPEHPK3PXP",
        "qr_code_uri": "otpauth://totp/OpenERP:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=OpenERP",
        "backup_codes": [
          "A1B2-C3D4",
          "E5F6-G7H8",
          "I9J0-K1L2",
          "M3N4-O5P6",
          "Q7R8-S9T0",
          "U1V2-W3X4",
          "Y5Z6-A7B8",
          "C9D0-E1F2"
        ]
      }
    }
    ```
  - `400 Bad Request`: `code: "ACCOUNT_2FA_ALREADY_ENABLED"` nếu tài khoản đã bật 2FA trước đó.

#### 3.2.3. `POST /api/v1/account/2fa/enable` - Xác Nhận Kích Hoạt 2FA
- **Mục đích**: Kiểm tra mã OTP 6 số người dùng nhập thử, nếu đúng sẽ chính thức bật 2FA trên tài khoản.
- **Request Body**:
  ```json
  {
    "code": "482910"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "ACCOUNT_2FA_ENABLED_SUCCESS",
      "message": "Two-factor authentication enabled successfully.",
      "data": {
        "is_enabled": true,
        "enabled_at": "2026-09-18T09:00:00Z"
      }
    }
    ```
  - `400 Bad Request`: `code: "AUTH_2FA_CODE_INVALID"` khi mã OTP sai hoặc lệch thời gian quá 30 giây.

#### 3.2.4. `POST /api/v1/account/2fa/disable` - Xóa / Tắt 2FA (Bảo Mật Kép)
- **Mục đích**: Vô hiệu hóa 2FA và xóa toàn bộ Secret Key cùng Backup Codes của người dùng.
- **Ràng buộc an toàn**: Yêu cầu xác thực đồng thời **mật khẩu hiện tại** và **mã OTP 6 số hiện tại** (hoặc 1 Backup Code).
- **Request Body**:
  ```json
  {
    "current_password": "MySecretPassword123!@",
    "code": "592813"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "ACCOUNT_2FA_DISABLED_SUCCESS",
      "message": "Two-factor authentication disabled successfully.",
      "data": {
        "is_enabled": false
      }
    }
    ```
  - `400 Bad Request`: `code: "ACCOUNT_2FA_NOT_ENABLED"` nếu tài khoản hiện chưa bật 2FA.
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "code": "ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE",
      "message": "Current password or 2FA code is invalid.",
      "timestamp": "2026-09-18T09:00:00Z"
    }
    ```

#### 3.2.5. `POST /api/v1/account/2fa/regenerate-backup-codes` - Tái Tạo Bộ Mã Dự Phòng
- **Request Body**:
  ```json
  {
    "current_password": "MySecretPassword123!@"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "code": "ACCOUNT_2FA_BACKUP_CODES_REGENERATED",
      "message": "Backup codes regenerated successfully. Previous codes are now invalid.",
      "data": {
        "backup_codes": [
          "K8L9-M0N1",
          "O2P3-Q4R5",
          "S6T7-U8V9",
          "W0X1-Y2Z3",
          "A4B5-C6D7",
          "E8F9-G0H1",
          "I2J3-K4L5",
          "M6N7-O8P9"
        ]
      }
    }
    ```

---

## 4. Bảng Từ Điển Mã Thông Điệp & Bản Dịch Mẫu Ở Frontend (i18n Mapping)

Frontend (Angular / Ionic) duy trì file từ điển ngôn ngữ `i18n/vi.json` và `i18n/en.json`. Dưới đây là bảng đối chiếu:

| Mã `code` | Bản Dịch Tiếng Việt (Frontend `vi.json`) | Bản Dịch Tiếng Anh (Frontend `en.json`) |
| :--- | :--- | :--- |
| `AUTH_REGISTER_SUCCESS` | Đăng ký tài khoản thành công. Vui lòng kiểm tra email để kích hoạt. | Registration successful. Please verify your email. |
| `AUTH_EMAIL_VERIFIED_SUCCESS` | Kích hoạt email thành công. Bạn đã có thể sử dụng hệ thống. | Email verified successfully. You can now use the system. |
| `AUTH_BUSINESS_REGISTER_SUCCESS`| Khởi tạo tổ chức doanh nghiệp thành công. | Business organization initialized successfully. |
| `AUTH_LOGIN_SUCCESS` | Đăng nhập thành công. | Logged in successfully. |
| `AUTH_SELECT_TENANT_REQUIRED` | Vui lòng chọn không gian làm việc doanh nghiệp để tiếp tục. | Please select a workspace tenant to continue. |
| `AUTH_2FA_REQUIRED` | Vui lòng nhập mã xác thực 2 yếu tố (2FA). | Please enter your 2FA authentication code. |
| `AUTH_EMAIL_ALREADY_EXISTS` | Email này đã được sử dụng trong hệ thống. | This email address is already in use. |
| `AUTH_TENANT_SLUG_DUPLICATE` | Định danh doanh nghiệp '{{slug}}' đã có người sử dụng. | Workspace identifier '{{slug}}' is already taken. |
| `AUTH_INVALID_CREDENTIALS` | Email hoặc mật khẩu không chính xác. | Invalid email or password. |
| `AUTH_ACCOUNT_LOCKED` | Tài khoản tạm khóa {{locked_seconds}} giây do nhập sai nhiều lần. | Account locked for {{locked_seconds}} seconds due to failed attempts. |
| `AUTH_OTP_INVALID_OR_EXPIRED` | Mã xác thực không chính xác hoặc đã hết hạn. | Invalid or expired verification code. |
| `AUTH_2FA_CODE_INVALID` | Mã xác thực 2FA không chính xác. | Invalid 2FA verification code. |
| `AUTH_PASSWORD_RESET_SUCCESS` | Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại. | Password reset successfully. Please log in again. |
| `ACCOUNT_PROFILE_UPDATE_SUCCESS`| Cập nhật thông tin hồ sơ thành công. | Profile updated successfully. |
| `ACCOUNT_PASSWORD_CHANGE_SUCCESS`| Đổi mật khẩu thành công. | Password changed successfully. |
| `ACCOUNT_OLD_PASSWORD_INCORRECT`| Mật khẩu hiện tại không chính xác. | Current password is incorrect. |
| `ACCOUNT_2FA_STATUS_FETCH_SUCCESS`| Tải trạng thái 2FA thành công. | 2FA status retrieved successfully. |
| `ACCOUNT_2FA_SETUP_SUCCESS` | Khởi tạo cấu hình 2FA thành công. Vui lòng quét mã QR. | 2FA setup initialized. Please scan the QR code. |
| `ACCOUNT_2FA_ENABLED_SUCCESS` | Kích hoạt xác thực 2 yếu tố (2FA) thành công! | Two-factor authentication enabled successfully! |
| `ACCOUNT_2FA_DISABLED_SUCCESS` | Đã tắt xác thực 2 yếu tố (2FA) trên tài khoản. | Two-factor authentication disabled successfully. |
| `ACCOUNT_2FA_ALREADY_ENABLED` | Xác thực 2FA đã được kích hoạt từ trước. | 2FA is already enabled on this account. |
| `ACCOUNT_2FA_NOT_ENABLED` | Tài khoản chưa bật xác thực 2FA. | 2FA is not enabled on this account. |
| `ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE`| Mật khẩu hiện tại hoặc mã 2FA không chính xác. | Current password or 2FA verification code is incorrect. |
| `ACCOUNT_2FA_BACKUP_CODES_REGENERATED`| Đã cấp lại 8 mã dự phòng mới thành công. | Backup codes regenerated successfully. |
| `ACCOUNT_SESSION_REVOKED_SUCCESS`| Đã đăng xuất thiết bị thành công. | Device session revoked successfully. |
| `ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS`| Đã đăng xuất khỏi tất cả các thiết bị khác. | Revoked all other active sessions successfully. |
