# TASK-SPRINT-01-FOUNDATION-003: Auth Service — Đăng nhập và Quản lý Session

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-003 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | Feature |
| Người phụ trách | Backend |
| Story Points | 8 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-001 |

## Mô tả
Xây dựng `auth-service` xử lý toàn bộ nghiệp vụ xác thực: đăng nhập email/mật khẩu, phát hành JWT (access token + refresh token), token rotation, đăng xuất, đặt lại mật khẩu. Đây là service nền tảng mà tất cả người dùng phải đi qua.

## Phạm vi kỹ thuật

### Backend (NestJS — `services/auth-service/`)
- Khởi tạo NestJS Microservice (TCP transport, port 3100)
- **Login (F-SA-001)**:
  - Nhận `email`, `password`, `tenantId` (từ API Gateway context)
  - Validate: kiểm tra user tồn tại trong tenant, status ACTIVE
  - Verify bcrypt password (cost 12)
  - Kiểm tra lockout: ≥ 5 lần sai → khóa 15 phút
  - Nếu user có MFA bật: trả về `sessionToken` tạm (step 1 của MFA flow)
  - Nếu không MFA: phát hành `accessToken` + `refreshToken`
  - Increment `loginCount`, cập nhật `lastLoginAt`
  - Reset `failedLoginAttempts` khi đăng nhập thành công
  - Emit event: `auth.login.success` hoặc `auth.login.failed`
- **JWT Generation**:
  - `accessToken`: RS256, payload `{ sub, tenantId, email, roles, sessionId }`, TTL 15 phút
  - Dùng private key RSA 2048-bit (load từ env)
  - `refreshToken`: random UUID v4, TTL 7 ngày
  - Lưu refreshToken hash vào collection `refresh_tokens`
- **Refresh Token (F-SA-004)**:
  - Nhận refresh token từ HttpOnly cookie
  - Lookup `refresh_tokens` by tokenHash
  - Kiểm tra: not expired, not revoked, tenantId khớp
  - **Token Rotation**: revoke token cũ, tạo token mới
  - Phát hiện reuse: nếu token đã bị revoke mà vẫn được dùng → revoke tất cả session của user (security alert)
- **Logout (F-SA-005)**:
  - `single`: revoke refresh token hiện tại
  - `all`: revoke tất cả refresh tokens của user
  - Xóa Redis session cache nếu có
  - Emit event: `auth.logout`
- **Forgot Password / Reset Password (F-SA-006)**:
  - Bước 1: Tìm user theo email+tenantId, tạo reset token (UUID v4), lưu hash vào `password_resets`
  - Gửi event `notification.email.send` cho notification-service
  - Bước 2: Verify reset token (hết hạn 1 giờ, chỉ dùng 1 lần)
  - Hash mật khẩu mới bcrypt(12), lưu vào user
  - Revoke tất cả refresh tokens của user
  - Lưu mật khẩu cũ vào `passwordHistory` (max 5)
  - Emit event: `auth.password.changed`
- **Change Password**:
  - Verify mật khẩu hiện tại
  - Kiểm tra mật khẩu mới không trùng với 5 mật khẩu gần nhất
  - Hash và lưu mật khẩu mới
  - Revoke tất cả refresh tokens (trừ session hiện tại)
- **Get Current User** (`/auth/me`):
  - Trả về thông tin user từ JWT payload + lookup từ user-service
  - Cache trong Redis (TTL 5 phút)
- **Session Management**:
  - `GET /auth/sessions`: Danh sách thiết bị đang đăng nhập
  - Thông tin: deviceInfo, lastUsedAt, location (từ IP)

## Database (MongoDB)
- Collections:
  - `refresh_tokens` (fields: tenantId, userId, tokenHash, sessionId, deviceInfo, expiresAt, revokedAt)
  - `password_resets` (fields: tenantId, userId, tokenHash, expiresAt, usedAt)
- Indexes:
  - `{ tokenHash: 1 }` — unique (refresh_tokens)
  - `{ tenantId: 1, userId: 1 }` (refresh_tokens)
  - `{ expiresAt: 1 }` — TTL index (cả 2 collections)

## API Endpoints
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Đăng nhập |
| `POST` | `/auth/logout` | JWT | Đăng xuất thiết bị hiện tại |
| `POST` | `/auth/logout-all` | JWT | Đăng xuất tất cả thiết bị |
| `POST` | `/auth/refresh` | Cookie | Làm mới access token |
| `POST` | `/auth/forgot-password` | Public | Yêu cầu reset mật khẩu |
| `POST` | `/auth/reset-password` | Public | Đặt lại mật khẩu |
| `POST` | `/auth/change-password` | JWT | Đổi mật khẩu |
| `GET` | `/auth/activate` | Public | Kích hoạt tài khoản |
| `GET` | `/auth/me` | JWT | Thông tin user hiện tại |
| `GET` | `/auth/sessions` | JWT | Danh sách sessions |

## Acceptance Criteria
- [ ] Đăng nhập thành công trả về accessToken JWT hợp lệ (RS256)
- [ ] refreshToken được set vào HttpOnly cookie
- [ ] Đăng nhập sai mật khẩu 5 lần liên tiếp → tài khoản bị khóa 15 phút
- [ ] Refresh token rotation: token cũ bị revoke sau khi dùng
- [ ] Reuse detection: dùng token đã bị revoke → tất cả session bị hủy
- [ ] Đăng xuất single: chỉ session hiện tại bị hủy
- [ ] Đăng xuất all: tất cả sessions bị hủy
- [ ] Reset password link hết hạn sau 1 giờ
- [ ] Mật khẩu mới không thể trùng với 5 mật khẩu gần nhất
- [ ] JWT chứa đúng: `sub`, `tenantId`, `email`, `roles`, `sessionId`
- [ ] Token hết hạn trả về `TOKEN_EXPIRED` error code
- [ ] Unit test coverage ≥ 80%

## Ghi chú kỹ thuật
- RSA key pair được generate khi deploy lần đầu, lưu trong mounted volume hoặc secret
- Không lưu raw refresh token — chỉ lưu SHA-256 hash
- `sessionId` trong JWT dùng để lookup refresh token (link JWT ↔ refreshToken)
- `deviceInfo` extract từ User-Agent header (dùng `ua-parser-js`)
- IP address được lấy từ `X-Forwarded-For` header (sau proxy)
- Rate limiting cho login endpoint nên đặt ở API Gateway, không ở auth-service
- Redis cache cho `/auth/me`: key = `user:info:{userId}:{tenantId}`
