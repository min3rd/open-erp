# TASK-SPRINT-01-AUTH-003: Auth Service — Multi-Factor Authentication (TOTP)

## Thông tin

| Thuộc tính      | Giá trị                 |
| --------------- | ----------------------- |
| Task ID         | TASK-SPRINT-01-AUTH-003 |
| Sprint          | Sprint 01               |
| Cluster         | auth                    |
| Loại            | Backend                 |
| Người phụ trách | Backend                 |
| Story Points    | 5                       |
| Trạng thái      | � REVIEW                |
| Phụ thuộc       | TASK-SPRINT-01-AUTH-001 |

## Mô tả

Triển khai xác thực hai yếu tố (2FA/MFA) bằng TOTP (Time-based One-Time Password) trong `auth-service`. Người dùng có thể thiết lập MFA qua ứng dụng authenticator (Google Authenticator, Authy), với backup codes phòng khi mất thiết bị. Tenant Admin có thể bắt buộc MFA cho toàn bộ nhân viên.

## Phạm vi kỹ thuật

### Backend (NestJS — `auth-service`, bổ sung vào Auth module)

**Cấu trúc bổ sung:**

```
src/
└── mfa/
    ├── mfa.controller.ts
    ├── mfa.service.ts
    └── dto/
        ├── setup-mfa.dto.ts
        └── verify-mfa.dto.ts
```

**Luồng thiết lập MFA:**

```
1. POST /api/v1/auth/mfa/setup   (user đã đăng nhập)
   → Tạo TOTP secret (otplib.authenticator.generateSecret())
   → Tạo QR code URL (otpauth://totp/OpenERP:{email}?secret={secret}&issuer=OpenERP)
   → Trả về { secret, qrCodeUrl, qrCodeImage } (chưa bật MFA)

2. POST /api/v1/auth/mfa/verify  (xác nhận setup)
   Body: { code: "123456" }
   → Verify TOTP code (otplib.authenticator.verify)
   → Nếu đúng → lưu secret vào DB (encrypted), bật mfaEnabled = true
   → Tạo 10 backup codes (random 8 chars mỗi code)
   → Trả về backup codes (chỉ trả một lần!)
```

**Luồng đăng nhập với MFA:**

```
1. POST /api/v1/auth/login → trả về { mfaRequired: true, mfaToken: "tmp_token" }
   (mfaToken là JWT ngắn hạn 5 phút, chỉ có quyền gọi /mfa/challenge)

2. POST /api/v1/auth/mfa/challenge
   Body: { mfaToken, code } hoặc { mfaToken, backupCode }
   → Verify TOTP hoặc backup code
   → Nếu đúng → tạo cặp JWT đầy đủ, trả về như login thành công
```

**Mã hoá TOTP secret:**

```typescript
// TOTP secret phải được encrypt tại tầng application (không phải chỉ DB at-rest encryption)
// Dùng AES-256-GCM với key từ environment
encrypt(secret: string): string   // lưu vào DB
decrypt(encrypted: string): string // dùng khi verify
```

**Backup codes:**

```typescript
// Tạo 10 backup codes, mỗi code 8 ký tự alphanumeric
// Lưu dạng bcrypt hash (không plaintext)
// Mỗi code chỉ dùng được 1 lần
generateBackupCodes(): { plaintext: string[]; hashed: string[] }
```

**MFA Policy per Tenant:**

```typescript
// Tenant Admin có thể bắt buộc MFA
interface TenantMfaPolicy {
  mfaRequired: boolean; // Bắt buộc MFA cho tất cả users
  mfaRequiredForRoles: string[]; // ['TENANT_ADMIN', 'MANAGER'] — bắt buộc theo role
  gracePeriodDays: number; // Cho phép bỏ qua MFA trong N ngày đầu
}
```

### Database (MongoDB)

**Cập nhật collection `users`** — thêm trường MFA:

| Trường           | Kiểu    | Mô tả                                |
| ---------------- | ------- | ------------------------------------ |
| `mfaEnabled`     | boolean | MFA có bật không (default: false)    |
| `mfaSecret`      | string  | AES-256 encrypted TOTP secret        |
| `mfaBackupCodes` | array   | Mảng bcrypt hash của 10 backup codes |
| `mfaEnabledAt`   | Date    | Thời điểm bật MFA                    |
| `mfaLastUsedAt`  | Date    | Lần cuối dùng MFA                    |

**Collection `mfa_challenges`** (ngắn hạn, TTL 5 phút):

| Trường      | Kiểu     | Mô tả                      |
| ----------- | -------- | -------------------------- |
| `_id`       | ObjectId | —                          |
| `tenantId`  | ObjectId | —                          |
| `userId`    | ObjectId | —                          |
| `token`     | string   | SHA-256 hash của mfa_token |
| `expiresAt` | Date     | TTL 5 phút                 |
| `used`      | boolean  | Đã dùng chưa               |

**Indexes:**

```
{ token: 1 }        — unique
{ expiresAt: 1 }    — TTL index
```

### Cấu hình môi trường

```env
MFA_ENCRYPTION_KEY=32-byte-hex-key-for-aes-256
MFA_ISSUER=OpenERP
MFA_TOTP_WINDOW=1   # Chấp nhận code ±1 khoảng thời gian (30s window)
```

## API Endpoints

| Method | Path                            | Mô tả                                 | Auth              |
| ------ | ------------------------------- | ------------------------------------- | ----------------- |
| POST   | `/api/v1/auth/mfa/setup`        | Khởi tạo MFA: tạo secret + QR code    | Bearer JWT (full) |
| POST   | `/api/v1/auth/mfa/verify`       | Xác nhận setup MFA, nhận backup codes | Bearer JWT (full) |
| POST   | `/api/v1/auth/mfa/disable`      | Tắt MFA (cần verify TOTP trước)       | Bearer JWT (full) |
| GET    | `/api/v1/auth/mfa/backup-codes` | Xem (regenerate) backup codes         | Bearer JWT (full) |
| POST   | `/api/v1/auth/mfa/challenge`    | Verify MFA code trong luồng đăng nhập | MFA Token         |

**Request/Response mẫu:**

```
POST /api/v1/auth/mfa/setup
Headers: Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/OpenERP:admin@acme.com?secret=JBSWY3DPEHPK3PXP&issuer=OpenERP",
    "qrCodeImage": "data:image/png;base64,..."   // base64 QR code
  }
}
```

```
POST /api/v1/auth/mfa/verify
Body: { "code": "123456" }

Response 200:
{
  "success": true,
  "data": {
    "backupCodes": ["ABCD1234", "EFGH5678", ...]   // 10 codes, chỉ hiển thị 1 lần
  }
}
```

## Yêu cầu bảo mật

- [ ] TOTP secret được encrypt bằng AES-256-GCM trước khi lưu DB
- [ ] Backup codes lưu dạng bcrypt hash, không plaintext
- [ ] MFA challenge token (mfaToken) chỉ có TTL 5 phút
- [ ] Replay attack prevention: mỗi TOTP code chỉ dùng được 1 lần trong cùng window
- [ ] Rate limiting: 5 lần verify sai → lock account 15 phút
- [ ] Disable MFA phải xác nhận bằng TOTP code hiện tại (không chỉ cần password)
- [ ] Backup codes phải được regenerate (cũ bị revoke) khi user yêu cầu

## Acceptance Criteria

- [ ] Setup MFA: tạo QR code đúng định dạng `otpauth://totp/...`
- [ ] QR code quét được bằng Google Authenticator
- [ ] Verify TOTP code đúng → MFA bật thành công, nhận 10 backup codes
- [ ] Login với user có MFA → `mfaRequired: true` + `mfaToken`
- [ ] MFA challenge với code đúng → nhận JWT đầy đủ
- [ ] MFA challenge với code sai → 401
- [ ] Backup code hoạt động thay TOTP code
- [ ] Backup code đã dùng không dùng được lần 2
- [ ] Disable MFA cần verify TOTP trước
- [ ] Tenant policy bắt buộc MFA → user không có MFA → redirect setup sau login
- [ ] Unit test coverage ≥ 80%

## Ghi chú kỹ thuật

- Package: `otplib` (TOTP chuẩn RFC 6238) và `qrcode` (tạo QR code base64).
- `otplib.authenticator.options = { window: 1 }` — chấp nhận code ±30 giây.
- AES-256-GCM: mỗi lần encrypt tạo IV ngẫu nhiên mới, lưu kèm ciphertext (`iv:ciphertext` base64).
- MFA enforcement check trong `jwt.strategy.ts`: nếu tenant yêu cầu MFA nhưng user chưa bật → throw exception với code `MFA_REQUIRED`.
- Backup codes được tạo bằng `crypto.randomBytes` để đảm bảo entropy.
- Cân nhắc WebAuthn/FIDO2 làm phương án MFA nâng cao cho Sprint sau.

## Tiến độ thực thi

- [x] Đọc SRS, kiến trúc API, database và hệ thống liên quan.
- [x] Rà soát nhánh MFA hiện có trong auth-service.
- [x] Bổ sung setup / verify / challenge / disable / backup-codes.
- [x] Enforce MFA policy và TTL challenge token.
- [x] Viết unit test cho MFA flow.

## Kết quả triển khai

- Thêm setup / verify / challenge / disable / backup-codes cho MFA TOTP.
- Lưu secret bằng AES-256-GCM, backup codes hash dạng bcrypt và mfa challenge TTL 5 phút.
- Login trả MFA challenge token khi user đã bật MFA; tenant policy MFA dùng cờ `mfaRequired` trong tenant settings.

## QA / Evidence

### Retest QA — 2026-05-11

**Build:** ✅ PASS (`npm run build`)  
**Tests:** ✅ PASS — 222/222 tests, 35/35 suites  
**Coverage tổng backend:** Lines **63.2%** (dưới ngưỡng AC ≥ 80%)

#### Per-file coverage (liên quan task AUTH-003)

| File                                             | Stmts Coverage    | AC    | Kết quả |
| ------------------------------------------------ | ----------------- | ----- | ------- |
| `auth/auth.service.ts`                           | **75%** (225/299) | ≥ 80% | ❌ FAIL |
| `auth/auth.controller.ts`                        | **74%** (63/85)   | ≥ 80% | ❌ FAIL |
| `auth/mfa/schemas/mfa-challenge.schema.ts`       | 100%              | —     | ✅      |
| `auth/mfa/dto/*.ts` (challenge, verify, disable) | 100%              | —     | ✅      |
| `auth/guards/jwt-auth.guard.ts`                  | **78%** (32/41)   | ≥ 80% | ❌ FAIL |
| `common/guards/jwt-auth.guard.ts`                | **79%** (41/52)   | ≥ 80% | ❌ FAIL |

#### Test cases hiện có (`auth.mfa.spec.ts`)

- ✅ `setupMfa returns QR code payload`
- ✅ `verifyMfa enables MFA and returns backup codes`
- ✅ `challengeMfa returns JWT session after valid code`
- ✅ `disableMfa clears MFA fields`

#### Blocker — AC chưa đạt

1. **[BLOCKER]** `auth.service.ts` coverage **75%** < 80% — thiếu test cho: `challengeMfa` với **backup code path**, `regenerateBackupCodes`, các nhánh lỗi (code hết hạn, challenge expired, mfaEnabled=false)
2. **[BLOCKER]** `auth.controller.ts` coverage **74%** < 80% — cần thêm test cho MFA controller endpoints (setup/verify/disable/backup-codes/challenge)
3. **[BLOCKER]** `auth/guards/jwt-auth.guard.ts` **78%** và `common/guards/jwt-auth.guard.ts` **79%** — sát ngưỡng, cần test nhánh `mfaRequired` enforcement
4. **[THIẾU TEST]** Rate limiting: 5 lần verify sai → lock account 15 phút — chưa có test
5. **[THIẾU TEST]** Tenant policy MFA bắt buộc → user chưa bật MFA → code `MFA_REQUIRED` — chưa có test
6. **[THIẾU TEST]** Backup code đã dùng → không dùng lần 2 — chưa có test
7. **[THIẾU TEST]** `regenerateBackupCodes` endpoint — chưa có test

**Kết luận QA:** ❌ Giữ nguyên **🟡 REVIEW** — Implementation đầy đủ, nhưng coverage chưa đạt ngưỡng AC ≥ 80%. Cần bổ sung unit test cho backup code flow, rate limit, tenant policy, controller endpoints.

**Điều kiện đóng task:**

- [ ] `auth.service.ts` ≥ 80% — thêm test backup code path, regenerate, error branches
- [ ] `auth.controller.ts` ≥ 80% — thêm test MFA controller endpoints
- [ ] `jwt-auth.guard.ts` cả 2 file ≥ 80%
- [ ] Test case: 5 lần fail → lock 15 phút
- [ ] Test case: backup code dùng 1 lần → reject lần 2
- [ ] Test case: tenant `mfaRequired=true` + user `mfaEnabled=false` → `MFA_REQUIRED`
