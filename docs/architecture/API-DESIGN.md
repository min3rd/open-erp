# API Design — Open ERP

# Thiết kế API RESTful

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Tác giả:** Technical Leader  
**Trạng thái:** Hoàn chỉnh

---

## Mục lục

1. [Nguyên tắc thiết kế API](#1-nguyên-tắc-thiết-kế-api)
2. [Chuẩn URL & Versioning](#2-chuẩn-url--versioning)
3. [Xác thực & Phân quyền](#3-xác-thực--phân-quyền)
4. [Request & Response Format](#4-request--response-format)
5. [Phân trang & Lọc dữ liệu](#5-phân-trang--lọc-dữ-liệu)
6. [Giới hạn tốc độ (Rate Limiting)](#6-giới-hạn-tốc-độ-rate-limiting)
7. [API Sprint 01 — Chi tiết endpoint](#7-api-sprint-01--chi-tiết-endpoint)

---

## 1. Nguyên tắc thiết kế API

### 1.1 REST Design Principles

| Nguyên tắc          | Mô tả                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| Stateless           | Mỗi request phải đầy đủ thông tin, không phụ thuộc session server-side                 |
| Resource-based URL  | URL phản ánh tài nguyên (danh từ), không dùng động từ                                  |
| HTTP Verbs chuẩn    | GET (đọc), POST (tạo), PUT (cập nhật toàn bộ), PATCH (cập nhật một phần), DELETE (xóa) |
| Consistent Response | Mọi response đều theo cùng một cấu trúc JSON                                           |
| Versioning          | Phiên bản API qua prefix URL (`/api/v1/`)                                              |

### 1.2 HTTP Status Codes

| Code                      | Tình huống                             |
| ------------------------- | -------------------------------------- |
| 200 OK                    | GET thành công, PUT/PATCH thành công   |
| 201 Created               | POST tạo mới thành công                |
| 204 No Content            | DELETE thành công                      |
| 400 Bad Request           | Dữ liệu đầu vào không hợp lệ           |
| 401 Unauthorized          | Không có hoặc token hết hạn            |
| 403 Forbidden             | Không có quyền truy cập                |
| 404 Not Found             | Tài nguyên không tồn tại               |
| 409 Conflict              | Trùng dữ liệu (email đã tồn tại, v.v.) |
| 422 Unprocessable         | Lỗi nghiệp vụ (rule validation)        |
| 429 Too Many Requests     | Vượt rate limit                        |
| 500 Internal Server Error | Lỗi server không mong đợi              |

---

## 2. Chuẩn URL & Versioning

### 2.1 URL Pattern

```
https://{tenant}.openErp.vn/api/v{N}/{resource}/{id}/{sub-resource}
```

Ví dụ:

```
GET    /api/v1/users
GET    /api/v1/users/abc123
POST   /api/v1/users
PATCH  /api/v1/users/abc123
DELETE /api/v1/users/abc123

GET    /api/v1/users/abc123/roles
POST   /api/v1/departments/dep01/members
GET    /api/v1/orders/ORD-001/items
```

### 2.2 Quy tắc đặt tên

- Dùng **kebab-case** cho URL segment: `/leave-requests`, `/purchase-orders`
- Dùng **số nhiều** cho collection: `/users`, `/orders`, `/invoices`
- **Không dùng động từ** trong URL (sai: `/createUser`, đúng: `POST /users`)
- Ngoại lệ cho action đặc biệt: `/api/v1/auth/login`, `/api/v1/tenants/id/activate`

---

## 3. Xác thực & Phân quyền

### 3.1 Headers bắt buộc

```http
Authorization: Bearer {access_token}
X-Tenant-ID: {tenantId}
Content-Type: application/json
Accept: application/json
```

### 3.2 JWT Access Token Payload

```json
{
  "sub": "userId",
  "tenantId": "tenantId",
  "email": "user@company.com",
  "roles": ["MANAGER", "SALES"],
  "permissions": ["order:read", "order:create"],
  "sessionId": "session-uuid",
  "iat": 1699999999,
  "exp": 1700000900
}
```

- **Access token TTL:** 15 phút
- **Refresh token TTL:** 7 ngày (lưu httpOnly cookie)
- **Algorithm:** RS256 (bất đối xứng, private key ký tại auth-service)

### 3.3 Token Refresh Flow

```
Client                          api-gateway          auth-service
  |                                  |                     |
  |  POST /api/v1/auth/refresh       |                     |
  |  Cookie: refreshToken=xxx        |                     |
  |--------------------------------->|                     |
  |                                  | TCP request         |
  |                                  |-------------------->|
  |                                  |   Verify RT,        |
  |                                  |   Issue new AT      |
  |                                  |<--------------------|
  |  200 { accessToken: "new_token" }|                     |
  |<---------------------------------|                     |
```

---

## 4. Request & Response Format

### 4.1 Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-09T10:00:00Z",
    "requestId": "req-uuid-v4"
  }
}
```

Cho danh sách (có pagination):

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  },
  "meta": {
    "timestamp": "2026-05-09T10:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### 4.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": {
      "key": "error.validation.invalid_input",
      "params": {
        "field": "email"
      },
      "defaultMessage": "Dữ liệu đầu vào không hợp lệ"
    },
    "i18n": {
      "namespace": "common",
      "severity": "error",
      "traceKey": "validation.email"
    },
    "details": [
      {
        "field": "email",
        "message": {
          "key": "error.validation.email_format",
          "params": {},
          "defaultMessage": "Email không đúng định dạng"
        }
      },
      {
        "field": "password",
        "message": {
          "key": "error.validation.password_min_length",
          "params": { "min": 8 },
          "defaultMessage": "Mật khẩu tối thiểu 8 ký tự"
        }
      }
    ]
  },
  "meta": {
    "timestamp": "2026-05-09T10:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### 4.3 Mã lỗi chuẩn (Error Codes)

| Code                      | HTTP | Mô tả                        |
| ------------------------- | ---- | ---------------------------- |
| `VALIDATION_ERROR`        | 400  | Dữ liệu đầu vào không hợp lệ |
| `TOKEN_EXPIRED`           | 401  | Access token hết hạn         |
| `TOKEN_INVALID`           | 401  | Token không hợp lệ           |
| `UNAUTHORIZED`            | 401  | Chưa xác thực                |
| `FORBIDDEN`               | 403  | Không có quyền               |
| `NOT_FOUND`               | 404  | Không tìm thấy tài nguyên    |
| `CONFLICT`                | 409  | Trùng dữ liệu                |
| `QUOTA_EXCEEDED`          | 422  | Vượt giới hạn gói cước       |
| `BUSINESS_RULE_VIOLATION` | 422  | Vi phạm quy tắc nghiệp vụ    |
| `RATE_LIMIT_EXCEEDED`     | 429  | Vượt giới hạn tốc độ         |
| `INTERNAL_ERROR`          | 500  | Lỗi nội bộ server            |

### 4.4 Quy ước thông điệp đa ngôn ngữ (Backend trả key + metadata)

- Frontend (Angular Web, Ionic Mobile) dùng Transloco để render đa ngôn ngữ.
- Backend không trả text đã bản địa hóa theo locale của client.
- Backend trả message object gồm key + params + metadata để frontend tự dịch.

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": {
      "key": "tenant.activation.token_expired",
      "params": {
        "expiredAt": "2026-05-09T10:00:00Z"
      },
      "defaultMessage": "Liên kết kích hoạt đã hết hạn"
    },
    "i18n": {
      "namespace": "auth",
      "severity": "warning",
      "action": "request_new_activation_link"
    }
  }
}
```

Quy tắc chuẩn:

- `message.key`: key duy nhất để frontend map sang Transloco namespace.
- `message.params`: tham số nội suy, không chứa HTML.
- `message.defaultMessage`: fallback khi thiếu dictionary ở client.
- `i18n.namespace`: gợi ý namespace (`auth`, `tenant`, `common`, ...).
- `i18n.action`: hành động UI gợi ý (nếu có), không bắt buộc.

---

## 5. Phân trang & Lọc dữ liệu

### 5.1 Pagination Query Parameters

```
GET /api/v1/users?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

| Tham số     | Kiểu    | Mặc định  | Tối đa | Mô tả                   |
| ----------- | ------- | --------- | ------ | ----------------------- |
| `page`      | integer | 1         | —      | Số trang (bắt đầu từ 1) |
| `limit`     | integer | 20        | 100    | Số bản ghi mỗi trang    |
| `sortBy`    | string  | createdAt | —      | Trường sắp xếp          |
| `sortOrder` | enum    | desc      | —      | `asc` hoặc `desc`       |

### 5.2 Filter Syntax

```
GET /api/v1/orders?filter[status]=active
GET /api/v1/orders?filter[status]=active&filter[customerId]=CUS-001
GET /api/v1/employees?filter[department]=IT&filter[status]=active
GET /api/v1/orders?filter[total][gte]=1000000&filter[total][lte]=5000000
GET /api/v1/users?search=nguyen
```

| Operator          | Cú pháp                   | Ví dụ                               |
| ----------------- | ------------------------- | ----------------------------------- |
| Bằng              | `filter[field]=value`     | `filter[status]=active`             |
| Lớn hơn hoặc bằng | `filter[field][gte]=v`    | `filter[total][gte]=100000`         |
| Nhỏ hơn hoặc bằng | `filter[field][lte]=v`    | `filter[date][lte]=2026-12-31`      |
| Tìm kiếm text     | `search=keyword`          | `search=nguyen van a`               |
| Thuộc tập         | `filter[field][in]=a,b,c` | `filter[status][in]=active,pending` |

---

## 6. Giới hạn tốc độ (Rate Limiting)

### 6.1 Rate Limit Tiers

| Gói          | Limit chung    | Auth endpoints | Upload         |
| ------------ | -------------- | -------------- | -------------- |
| Free         | 100 req/phút   | 10 req/phút    | 5 MB/request   |
| Starter      | 500 req/phút   | 30 req/phút    | 10 MB/request  |
| Professional | 2000 req/phút  | 60 req/phút    | 50 MB/request  |
| Enterprise   | 10000 req/phút | 120 req/phút   | 200 MB/request |

### 6.2 Rate Limit Headers

```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1699999960
Retry-After: 30
```

---

## 7. API Sprint 01 — Chi tiết Endpoint

### 7.1 Authentication API (`/api/v1/auth`)

#### POST /api/v1/auth/login

```
Mô tả: Đăng nhập bằng email + password
Auth: Không yêu cầu
Request:
  {
    "email": "string",       // required, valid email
    "password": "string",    // required, min 8 chars
    "tenantId": "string"     // optional, auto-detect từ subdomain
  }
Response 200:
  {
    "accessToken": "jwt_string",
    "user": { "id", "email", "fullName", "roles", "permissions" },
    "tenant": { "id", "name", "logo" }
  }
  Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict
Errors: 400 VALIDATION_ERROR, 401 UNAUTHORIZED (sai credentials), 403 TENANT_SUSPENDED
```

#### POST /api/v1/auth/logout

```
Auth: Bearer token
Mô tả: Đăng xuất, thu hồi refresh token
Response 204: No Content
```

#### POST /api/v1/auth/refresh

```
Auth: Cookie refreshToken
Mô tả: Làm mới access token
Response 200: { "accessToken": "new_jwt" }
Errors: 401 TOKEN_EXPIRED, 401 TOKEN_INVALID
```

#### POST /api/v1/auth/forgot-password

```
Auth: Không yêu cầu
Request: { "email": "string", "tenantId": "string" }
Response 200:
  {
    "message": {
      "key": "auth.forgot_password.email_sent",
      "params": { "cooldownSeconds": 60 },
      "defaultMessage": "Email đặt lại mật khẩu đã được gửi"
    }
  }
Ghi chú: Luôn trả 200 dù email không tồn tại (anti-enumeration)
```

#### POST /api/v1/auth/reset-password

```
Auth: Không yêu cầu (dùng reset token)
Request: { "token": "string", "newPassword": "string", "confirmPassword": "string" }
Response 200:
  {
    "message": {
      "key": "auth.reset_password.success",
      "params": {},
      "defaultMessage": "Mật khẩu đã được đặt lại thành công"
    }
  }
Errors: 400 TOKEN_EXPIRED_OR_INVALID
```

#### GET /api/v1/auth/oauth/google

```
Auth: Không yêu cầu
Mô tả: Redirect tới Google OAuth2
Response 302: Redirect to Google authorization URL
```

#### GET /api/v1/auth/oauth/google/callback

```
Mô tả: Callback từ Google sau khi user xác nhận
Response 302: Redirect về frontend với accessToken
```

#### GET /api/v1/auth/oauth/microsoft, GET /api/v1/auth/oauth/microsoft/callback

```
Tương tự Google OAuth2 nhưng dùng Microsoft (Azure AD)
```

#### POST /api/v1/auth/mfa/setup

```
Auth: Bearer token
Mô tả: Khởi tạo TOTP MFA, trả về QR code
Response 200: { "secret": "base32_secret", "qrCode": "data:image/png;base64,..." }
```

#### POST /api/v1/auth/mfa/verify

```
Auth: Bearer token
Request: { "code": "string" }   // 6-digit TOTP
Response 200: { "verified": true }
```

---

### 7.2 Public Registration API (`/api/v1/register`)

#### POST /api/v1/register

```
Mô tả: Khởi tạo đăng ký doanh nghiệp tự phục vụ
Auth: Không yêu cầu
Request:
  {
    "taxCode": "string",
    "email": "string",
    "password": "string"
  }
Response 200:
  {
    "data": {
      "registrationId": "reg_123",
      "status": "PENDING_EMAIL_ACTIVATION"
    },
    "message": {
      "key": "tenant.register.activation_email_sent",
      "params": { "emailMasked": "a***@company.com" },
      "defaultMessage": "Email kích hoạt đã được gửi"
    }
  }
```

#### GET /api/v1/register/activate

```
Mô tả: Xác thực activation link từ email trước khi vào luồng verify-tax-code và onboarding
Auth: Không yêu cầu
Query: ?token=<activation_token>
Response 200:
  {
    "data": {
      "registrationId": "reg_123",
      "status": "EMAIL_VERIFIED"
    },
    "message": {
      "key": "tenant.register.activation_success",
      "params": {},
      "defaultMessage": "Kích hoạt email thành công"
    }
  }
Errors:
  400 TOKEN_INVALID
  410 TOKEN_EXPIRED
```

---

### 7.3 Tenant API (`/api/v1/tenants`)

> Yêu cầu quyền: `PLATFORM_ADMIN`

#### GET /api/v1/tenants

```
Mô tả: Danh sách tất cả tenants (platform admin only)
Params: ?page=1&limit=20&filter[status]=active&search=
Response 200: { data: Tenant[], pagination }
```

#### POST /api/v1/tenants

```
Mô tả: Tạo tenant mới
Request:
  {
    "name": "string",
    "slug": "string",          // unique subdomain slug
    "plan": "free|starter|professional|enterprise",
    "adminEmail": "string",
    "adminFullName": "string",
    "industry": "string"       // optional
  }
Response 201: { data: Tenant }
Errors: 409 CONFLICT (slug đã tồn tại)
```

#### GET /api/v1/tenants/:id

```
Response 200: { data: Tenant }
Errors: 404 NOT_FOUND
```

#### PATCH /api/v1/tenants/:id

```
Request: Partial<Tenant>
Response 200: { data: Tenant }
```

#### DELETE /api/v1/tenants/:id

```
Mô tả: Soft delete — đổi status = TERMINATED
Response 204
```

#### POST /api/v1/tenants/:id/activate

```
Mô tả: Kích hoạt tenant (PENDING_SETUP → ACTIVE)
Response 200: { data: Tenant }
```

#### POST /api/v1/tenants/:id/suspend

```
Request: { "reason": "string" }
Response 200: { data: Tenant }
```

#### GET /api/v1/tenants/:id/stats

```
Mô tả: Thống kê sử dụng tài nguyên
Response 200:
  {
    "users": { "used": 45, "limit": 100 },
    "storage": { "used": 4.2, "limit": 10, "unit": "GB" },
    "apiCalls": { "used": 12500, "limit": 50000 }
  }
```

---

### 7.4 User API (`/api/v1/users`)

#### GET /api/v1/users

```
Auth: Bearer token + quyền user:list
Params: ?page&limit&filter[status]&filter[department]&filter[role]&search
Response 200: { data: User[], pagination }
```

#### POST /api/v1/users

```
Auth: quyền user:create
Request:
  {
    "email": "string",
    "fullName": "string",
    "phone": "string",           // optional
    "departmentId": "string",    // optional
    "roleIds": ["string"],       // optional, default: basic role
    "sendInviteEmail": true      // optional
  }
Response 201: { data: User }
Errors: 409 CONFLICT (email đã tồn tại trong tenant)
```

#### GET /api/v1/users/:id

```
Response 200: { data: User }
Errors: 404 NOT_FOUND
```

#### PATCH /api/v1/users/:id

```
Request: Partial<User>
Response 200: { data: User }
```

#### DELETE /api/v1/users/:id

```
Mô tả: Soft delete user
Response 204
Errors: 409 CONFLICT (cannot delete the last admin)
```

#### PATCH /api/v1/users/:id/status

```
Request: { "status": "active|inactive|suspended" }
Response 200: { data: User }
```

#### GET /api/v1/users/me/profile

```
Mô tả: Lấy thông tin cá nhân của user đang đăng nhập
Response 200: { data: UserProfile }
```

#### PATCH /api/v1/users/me/profile

```
Request: { "fullName", "phone", "avatar", "language", "timezone" }
Response 200: { data: UserProfile }
```

---

### 7.5 RBAC API (`/api/v1/roles`, `/api/v1/permissions`)

#### GET /api/v1/roles

```
Params: ?page&limit&filter[type]=system|custom
Response 200: { data: Role[] }
```

#### POST /api/v1/roles

```
Request: { "name", "description", "permissionIds": ["string"] }
Response 201: { data: Role }
```

#### GET /api/v1/roles/:id

Response 200: { data: Role (kèm permissions) }

#### PATCH /api/v1/roles/:id

```
Request: Partial<Role>
Response 200: { data: Role }
```

#### DELETE /api/v1/roles/:id

```
Errors: 409 (vai trò đang được gán cho ít nhất 1 user)
Response 204
```

#### GET /api/v1/roles/:id/permissions

Response 200: { data: Permission[] }

#### PUT /api/v1/roles/:id/permissions

```
Mô tả: Gán/thay thế toàn bộ permissions cho role
Request: { "permissionIds": ["string"] }
Response 200: { data: Role }
```

#### GET /api/v1/permissions

```
Params: ?module=auth|user|hr|sale|...
Response 200: { data: Permission[] }  // toàn bộ danh sách permissions của hệ thống
```

#### POST /api/v1/users/:id/roles

```
Mô tả: Gán roles cho user
Request: { "roleIds": ["string"] }
Response 200: { data: User }
```

#### DELETE /api/v1/users/:id/roles/:roleId

```
Mô tả: Xóa role khỏi user
Response 204
```

---

### 7.6 Department API (`/api/v1/departments`)

#### GET /api/v1/departments

```
Params: ?page&limit&filter[parentId]
Response 200: { data: Department[] }
```

#### GET /api/v1/departments/tree

```
Mô tả: Lấy cây phòng ban (hierarchical)
Response 200: { data: DepartmentTree[] }
```

#### POST /api/v1/departments

```
Request:
  {
    "name": "string",
    "code": "string",       // mã phòng ban, unique
    "parentId": "string",   // optional (null = root)
    "managerId": "string",  // optional, user ID
    "description": "string" // optional
  }
Response 201: { data: Department }
```

#### GET /api/v1/departments/:id

Response 200: { data: Department }

#### PATCH /api/v1/departments/:id

Response 200: { data: Department }

#### DELETE /api/v1/departments/:id

```
Errors: 409 (phòng ban có phòng ban con hoặc có nhân viên)
Response 204
```

#### GET /api/v1/departments/:id/members

```
Params: ?page&limit
Response 200: { data: User[], pagination }
```
