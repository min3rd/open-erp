# TASK-SPRINT-01-AUTH-001: Auth Service — JWT Authentication

## Thông tin

| Thuộc tính       | Giá trị                                                          |
|------------------|------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-01-AUTH-001                                          |
| Sprint           | Sprint 01                                                        |
| Cluster          | auth                                                             |
| Loại             | Backend                                                          |
| Người phụ trách  | Backend                                                          |
| Story Points     | 8                                                                |
| Trạng thái       | ⬜ TODO                                                          |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004     |

## Mô tả

Xây dựng `auth-service` — microservice chịu trách nhiệm xác thực người dùng. Cung cấp đăng nhập bằng email/password với JWT, refresh token, đăng xuất (token blacklist), và luồng quên/đặt lại mật khẩu qua OTP email.

## Phạm vi kỹ thuật

### Backend (NestJS — `auth-service`, port 3001)

**Cấu trúc module:**
```
src/
├── auth.module.ts
├── main.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── reset-password.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts          ← PassportJS JWT strategy
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── token/
│   ├── token.service.ts             ← Generate/verify/revoke tokens
│   └── schemas/
│       ├── refresh-token.schema.ts
│       └── password-reset-token.schema.ts
└── users/
    └── schemas/
        └── user.schema.ts           ← Dùng chung với user-service
```

**Luồng đăng nhập:**
```
Client → POST /api/v1/auth/login
  → Validate email + password (bcrypt.compare)
  → Kiểm tra user status (ACTIVE)
  → Kiểm tra tenant status (ACTIVE/TRIAL)
  → Kiểm tra MFA required → nếu có → trả mfaRequired: true
  → Generate access token (JWT, 15 phút)
  → Generate refresh token (JWT opaque, 7 ngày, lưu DB)
  → Trả về { accessToken, refreshToken, user }
```

**Luồng refresh token:**
```
Client → POST /api/v1/auth/refresh-token
  → Verify refresh token (không hết hạn, tồn tại trong DB)
  → Xoay token (rotate): revoke token cũ, tạo token mới
  → Trả về { accessToken, refreshToken }
```

**Luồng đăng xuất:**
```
Client → POST /api/v1/auth/logout
  → Xóa refresh token khỏi DB
  → Thêm access token JTI vào Redis blacklist (TTL = thời gian còn lại của token)
  → Publish event: user.logout
```

**Luồng forgot/reset password:**
```
POST /api/v1/auth/forgot-password { email }
  → Tạo OTP 6 số, hết hạn 10 phút, lưu DB
  → Gửi email (queue sang notification-service hoặc trực tiếp Nodemailer)

POST /api/v1/auth/reset-password { token, newPassword }
  → Verify OTP còn hiệu lực
  → Hash password mới bằng bcrypt (rounds: 12)
  → Xóa OTP
  → Revoke tất cả refresh tokens của user
```

### Database (MongoDB)

**Collection: `users`** (thuộc auth-service, sync sang user-service qua event)

| Trường            | Kiểu        | Ràng buộc                     | Mô tả                          |
|-------------------|-------------|-------------------------------|--------------------------------|
| `_id`             | ObjectId    | —                             | Primary key                    |
| `tenantId`        | ObjectId    | required, indexed             | Tenant sở hữu                  |
| `email`           | string      | required, lowercase, trim     | Email đăng nhập                |
| `passwordHash`    | string      | required                      | bcrypt hash, rounds=12         |
| `status`          | enum        | ACTIVE/INACTIVE/LOCKED        | Trạng thái tài khoản           |
| `mfaEnabled`      | boolean     | default: false                | MFA có bật không               |
| `mfaSecret`       | string      | encrypted at rest             | TOTP secret                    |
| `lastLoginAt`     | Date        | —                             | Lần đăng nhập cuối             |
| `failedLoginCount`| number      | default: 0                    | Đếm đăng nhập thất bại         |
| `lockedUntil`     | Date        | —                             | Khóa tạm thời (brute force)    |
| `isDeleted`       | boolean     | default: false                | Soft delete                    |
| `createdAt`       | Date        | auto                          | —                              |
| `updatedAt`       | Date        | auto                          | —                              |

**Indexes:**
```
{ tenantId: 1, email: 1 }    — unique (per tenant)
{ tenantId: 1, status: 1 }
{ tenantId: 1, isDeleted: 1 }
```

**Collection: `refresh_tokens`**

| Trường       | Kiểu     | Ràng buộc     | Mô tả                     |
|--------------|----------|---------------|---------------------------|
| `_id`        | ObjectId | —             | Primary key               |
| `tenantId`   | ObjectId | required      | Tenant                    |
| `userId`     | ObjectId | required      | User sở hữu token         |
| `tokenHash`  | string   | required      | SHA-256 hash của token    |
| `expiresAt`  | Date     | required      | Hết hạn sau 7 ngày        |
| `isRevoked`  | boolean  | default: false| Token bị thu hồi chưa     |
| `deviceInfo` | object   | optional      | User-Agent, IP            |
| `createdAt`  | Date     | auto          | —                         |

**Indexes:**
```
{ tokenHash: 1 }              — unique
{ userId: 1, isRevoked: 1 }
{ expiresAt: 1 }              — TTL index (auto delete expired)
```

**Collection: `password_reset_tokens`**

| Trường      | Kiểu     | Ràng buộc | Mô tả                  |
|-------------|----------|-----------|------------------------|
| `_id`       | ObjectId | —         | —                      |
| `tenantId`  | ObjectId | required  | —                      |
| `userId`    | ObjectId | required  | —                      |
| `otpHash`   | string   | required  | SHA-256 hash của OTP   |
| `expiresAt` | Date     | required  | Hết hạn 10 phút        |
| `isUsed`    | boolean  | default: false | Đã dùng chưa      |

**Indexes:**
```
{ userId: 1, isUsed: 1 }
{ expiresAt: 1 }    — TTL index
```

### JWT Payload

```typescript
interface JwtPayload {
  sub: string;       // userId
  tenantId: string;  // tenantId
  email: string;
  roles: string[];   // ['TENANT_ADMIN', 'EMPLOYEE']
  jti: string;       // JWT ID (UUID v4) — dùng cho blacklist
  iat: number;
  exp: number;
}
```

**Cấu hình JWT:**
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '15m',
    algorithm: 'HS256',
    issuer: 'openErp',
    audience: 'openErp-client',
  },
})
```

## API Endpoints

| Method | Path                            | Mô tả                              | Auth        |
|--------|---------------------------------|-------------------------------------|-------------|
| POST   | `/api/v1/auth/login`            | Đăng nhập email/password            | Không       |
| POST   | `/api/v1/auth/logout`           | Đăng xuất, revoke token             | Bearer JWT  |
| POST   | `/api/v1/auth/refresh-token`    | Làm mới access token                | Refresh     |
| POST   | `/api/v1/auth/forgot-password`  | Gửi OTP reset mật khẩu qua email   | Không       |
| POST   | `/api/v1/auth/reset-password`   | Đặt lại mật khẩu bằng OTP          | Không       |
| GET    | `/api/v1/auth/me`               | Lấy thông tin user hiện tại         | Bearer JWT  |

**Request/Response mẫu:**

```
POST /api/v1/auth/login
Body: { "email": "admin@acme.com", "password": "Abc@1234" }

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "mfaRequired": false,
    "user": { "id": "...", "email": "...", "roles": [...] }
  }
}
```

## Yêu cầu bảo mật

- [ ] Mật khẩu hash bằng bcrypt, cost factor = 12
- [ ] Không lưu mật khẩu plaintext bất kỳ nơi nào (kể cả logs)
- [ ] Token JTI được lưu Redis blacklist khi logout
- [ ] Refresh token được rotate mỗi lần dùng (tránh token theft)
- [ ] Brute force protection: khóa tài khoản sau 5 lần đăng nhập sai trong 15 phút
- [ ] OTP 6 số có entropy đủ lớn (`crypto.randomInt`)
- [ ] Rate limiting: 10 req/phút cho tất cả auth endpoints
- [ ] JWT secret lưu trong environment variables, không hardcode

## Acceptance Criteria

- [ ] Đăng nhập thành công → nhận `accessToken` và `refreshToken`
- [ ] `accessToken` hết hạn sau 15 phút
- [ ] Refresh token hoạt động: dùng `refreshToken` cũ → nhận cặp token mới
- [ ] Refresh token đã dùng bị vô hiệu hóa (rotation)
- [ ] Logout: `accessToken` bị blacklist, không dùng được nữa
- [ ] Forgot password: OTP gửi qua email, hết hạn 10 phút
- [ ] Reset password: đặt mật khẩu mới thành công, OTP bị đánh dấu đã dùng
- [ ] Brute force: khóa sau 5 lần sai
- [ ] Multi-tenancy: users của tenant A không thể đăng nhập tenant B
- [ ] Unit test coverage ≥ 80%
- [ ] Publish event `user.login` và `user.logout` lên RabbitMQ

## Ghi chú kỹ thuật

- Cân nhắc dùng `argon2` thay vì `bcrypt` (tốt hơn về bảo mật và hiệu năng).
- Nếu dùng RS256 (asymmetric): giữ private key để sign, chia sẻ public key cho các service verify.
- `mfaRequired: true` trong login response → client redirect sang màn hình MFA verify.
- Không lưu device fingerprint ở giai đoạn này — chỉ lưu User-Agent cơ bản.
- Publish `user.login` event kèm IP address và User-Agent cho audit log.
