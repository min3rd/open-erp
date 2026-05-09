# TASK-SPRINT-01-AUTH-002: Auth Service — OAuth2 Social Login (Google, Microsoft)

## Thông tin

| Thuộc tính       | Giá trị                     |
|------------------|-----------------------------|
| Task ID          | TASK-SPRINT-01-AUTH-002     |
| Sprint           | Sprint 01                   |
| Cluster          | auth                        |
| Loại             | Backend                     |
| Người phụ trách  | Backend                     |
| Story Points     | 5                           |
| Trạng thái       | ⬜ TODO                     |
| Phụ thuộc        | TASK-SPRINT-01-AUTH-001     |

## Mô tả

Tích hợp đăng nhập xã hội qua Google OAuth2 và Microsoft OAuth2 (Azure AD) vào `auth-service`. Khi user đăng nhập lần đầu qua OAuth, hệ thống tự động tạo tài khoản và liên kết với tenant. Các lần sau sẽ tự nhận diện qua `providerAccountId`.

## Phạm vi kỹ thuật

### Backend (NestJS — `auth-service`, bổ sung vào Sprint 01 task 001)

**Cấu trúc bổ sung:**
```
src/
├── auth/
│   └── strategies/
│       ├── google.strategy.ts        ← PassportJS Google OAuth2
│       └── microsoft.strategy.ts    ← PassportJS Azure AD OAuth2
└── oauth/
    ├── oauth.controller.ts
    └── oauth.service.ts
```

**Luồng OAuth2:**
```
1. Client → GET /api/v1/auth/oauth/google
   → Redirect sang Google consent screen

2. Google → callback → GET /api/v1/auth/oauth/google/callback?code=...
   → Exchange code → access token
   → Lấy profile (email, name, avatar)
   → Tìm user theo { tenantId, 'oauthAccounts.providerId': googleId }
   → Nếu chưa có → tạo user mới (status: ACTIVE, mfaEnabled: false)
   → Tạo cặp JWT access + refresh token
   → Redirect về frontend: {frontendUrl}/auth/oauth-callback?token=...

3. Client lưu token, proceed như đăng nhập thường
```

**Google Strategy:**
```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true,   // để trích xuất tenantId từ state param
    });
  }
}
```

**Microsoft (Azure AD) Strategy:**
```typescript
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor() {
    super({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      scope: ['user.read'],
      tenant: 'common',          // Multi-tenant Azure AD
      passReqToCallback: true,
    });
  }
}
```

**Truyền tenantId qua OAuth flow:**
- Client khởi tạo OAuth với `state` param chứa `tenantId` (encoded base64)
- Callback nhận lại `state`, decode để biết user đang đăng nhập vào tenant nào
- Validate `state` để chống CSRF (dùng nonce)

### Database (MongoDB)

**Cập nhật collection `users`** — thêm trường OAuth:

| Trường                         | Kiểu     | Mô tả                                         |
|-------------------------------|----------|------------------------------------------------|
| `authProvider`                | enum     | `LOCAL`, `GOOGLE`, `MICROSOFT`, `MIXED`        |
| `oauthAccounts`               | array    | Danh sách tài khoản OAuth đã liên kết          |
| `oauthAccounts[].provider`    | string   | `google` hoặc `microsoft`                      |
| `oauthAccounts[].providerId`  | string   | ID từ provider (Google sub, Microsoft oid)     |
| `oauthAccounts[].email`       | string   | Email từ provider                              |
| `oauthAccounts[].linkedAt`    | Date     | Thời điểm liên kết                             |

**Index bổ sung:**
```
{ tenantId: 1, 'oauthAccounts.providerId': 1 }    — Tìm user theo OAuth ID
{ tenantId: 1, 'oauthAccounts.provider': 1 }
```

### Cấu hình môi trường

```env
# Google OAuth2
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://api.openErp.vn/api/v1/auth/oauth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_CALLBACK_URL=https://api.openErp.vn/api/v1/auth/oauth/microsoft/callback

# Frontend redirect sau OAuth thành công
OAUTH_SUCCESS_REDIRECT=https://app.openErp.vn/auth/oauth-callback
OAUTH_FAILURE_REDIRECT=https://app.openErp.vn/auth/login?error=oauth_failed
```

## API Endpoints

| Method | Path                                       | Mô tả                              | Auth   |
|--------|--------------------------------------------|------------------------------------|--------|
| GET    | `/api/v1/auth/oauth/google`                | Khởi tạo Google OAuth2 flow        | Không  |
| GET    | `/api/v1/auth/oauth/google/callback`       | Google callback sau consent        | Không  |
| GET    | `/api/v1/auth/oauth/microsoft`             | Khởi tạo Microsoft OAuth2 flow     | Không  |
| GET    | `/api/v1/auth/oauth/microsoft/callback`    | Microsoft callback sau consent     | Không  |
| POST   | `/api/v1/auth/oauth/link`                  | Liên kết OAuth account với user hiện tại | Bearer JWT |
| DELETE | `/api/v1/auth/oauth/:provider/unlink`      | Huỷ liên kết OAuth account         | Bearer JWT |

## Yêu cầu bảo mật

- [ ] `state` parameter chứa CSRF nonce (random string, verify khi callback)
- [ ] Không log OAuth access token từ provider
- [ ] Validate email từ provider phải là `verified` (Google: `email_verified: true`)
- [ ] Nếu email đã tồn tại với `authProvider: LOCAL` → liên kết tài khoản (không tạo mới)
- [ ] Không cho phép đăng ký qua OAuth nếu tenant đã disable tính năng này
- [ ] PKCE (Proof Key for Code Exchange) nếu provider hỗ trợ

## Acceptance Criteria

- [ ] Redirect đúng sang Google consent screen khi gọi `/oauth/google`
- [ ] Callback từ Google → tạo user mới nếu chưa có, trả về JWT
- [ ] Callback từ Google → nhận diện user cũ, trả về JWT (không tạo trùng)
- [ ] Tương tự với Microsoft OAuth2
- [ ] `state` CSRF protection hoạt động: request giả không qua callback
- [ ] Email đã tồn tại (LOCAL auth) → merge OAuth account, không tạo mới
- [ ] Lỗi OAuth (user từ chối) → redirect về `/login?error=oauth_failed`
- [ ] Unit test coverage ≥ 80%
- [ ] Publish event `user.oauth_login` lên RabbitMQ

## Ghi chú kỹ thuật

- Package: `passport-google-oauth20`, `passport-microsoft`
- `state` encode thêm `tenantId` + `nonce`: `base64(JSON.stringify({ tenantId, nonce }))`.
- Trong môi trường dev, dùng `ngrok` để expose localhost cho OAuth callback.
- Microsoft OAuth hỗ trợ đăng nhập bằng tài khoản Microsoft cá nhân và Azure AD (work/school) — dùng `tenant: 'common'`.
- Nếu tenant có domain riêng (acme.com) → có thể giới hạn chỉ email @acme.com qua `hd` param (Google).
- Per-tenant OAuth configuration (mỗi tenant có credentials riêng) sẽ triển khai ở sprint sau.
