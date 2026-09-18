# [DES-01] Thiết Kế Chi Tiết Cơ Sở Dữ Liệu: Core Identity & Multi-Tenant

- **Mã Tài Liệu**: DES-01
- **Phụ Trách**: Solution Architect Agent
- **Hệ Quản Trị CSDL**: PostgreSQL 16+
- **Schema**: `public` (Shared Core Tables)

---

## 1. Sơ Đồ Quan Hệ Thực Thể (Entity Relationship Diagram)

```
+--------------------+           +-----------------------+           +--------------------+
|      tenants       |           |     user_tenants      |           |       users        |
+--------------------+           +-----------------------+           +--------------------+
| id (PK, UUID)      |<----------| tenant_id (PK, FK)    |---------->| id (PK, UUID)      |
| slug (VARCHAR, UQ) |           | user_id (PK, FK)      |           | email (VARCHAR, UQ)|
| name (VARCHAR)     |           | role (VARCHAR)        |           | status (VARCHAR)   |
| tax_code (VARCHAR) |           | is_default (BOOLEAN)  |           | created_at         |
| status (VARCHAR)   |           | joined_at             |           +--------------------+
+--------------------+           +-----------------------+                     |
                                                                               |
          +-------------------------------+------------------------------------+
          |                               |                                    |
          v                               v                                    v
+--------------------+          +--------------------+               +--------------------+
|  user_credentials  |          |  user_two_factor   |               |   user_profiles    |
+--------------------+          +--------------------+               +--------------------+
| user_id (PK, FK)   |          | user_id (PK, FK)   |               | user_id (PK, FK)   |
| password_hash      |          | secret_key_enc     |               | full_name (VARCHAR)|
| failed_login_count |          | is_enabled (BOOL)  |               | phone (VARCHAR)    |
| locked_until       |          | backup_codes_hash  |               | avatar_url (TEXT)  |
| updated_at         |          | enabled_at         |               | timezone (VARCHAR) |
+--------------------+          +--------------------+               +--------------------+
```

---

## 2. Chi Tiết Các Bảng Dữ Liệu

### 2.1. Bảng `tenants` (Danh mục Khách thuê / Tổ chức Doanh nghiệp)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,       -- Subdomain định danh: acme-corp
    name VARCHAR(255) NOT NULL,              -- Tên doanh nghiệp
    tax_code VARCHAR(32),                    -- Mã số thuế
    company_size VARCHAR(32),                -- Quy mô: 1-10, 11-50...
    currency VARCHAR(8) DEFAULT 'VND',       -- Tiền tệ mặc định
    status VARCHAR(32) DEFAULT 'ACTIVE',     -- ACTIVE, SUSPENDED, DELETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 2.2. Bảng `users` (Danh tính Toàn cục)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,      -- Email đăng nhập duy nhất
    status VARCHAR(32) DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, ACTIVE, LOCKED
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 2.3. Bảng `user_tenants` (Liên kết Thành viên & Vai trò trong Tenant)
```sql
CREATE TABLE user_tenants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'MEMBER', -- TENANT_ADMIN, MEMBER, VIEWER
    is_default BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant ON user_tenants(tenant_id);
```

### 2.4. Bảng `user_credentials` (Thông tin Mật khẩu & Bảo mật đăng nhập)
```sql
CREATE TABLE user_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,     -- Hash Argon2id
    failed_login_count INT DEFAULT 0,        -- Số lần nhập sai liên tiếp
    locked_until TIMESTAMP WITH TIME ZONE,   -- Thời điểm hết khóa nếu brute-force
    password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.5. Bảng `user_two_factor` (Xác thực 2FA TOTP)
```sql
CREATE TABLE user_two_factor (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret_key_enc VARCHAR(255) NOT NULL,    -- Secret Key mã hóa AES-256
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes_hash JSONB DEFAULT '[]'::jsonb, -- Danh sách SHA-256 backup codes
    enabled_at TIMESTAMP WITH TIME ZONE
);
```

### 2.6. Bảng `user_profiles` (Thông tin Cá nhân)
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    avatar_url TEXT,
    language VARCHAR(8) DEFAULT 'vi',
    timezone VARCHAR(64) DEFAULT 'Asia/Ho_Chi_Minh',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.7. Bảng `password_reset_tokens` (Token Khôi phục Mật khẩu)
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,         -- SHA-256 token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_hash ON password_reset_tokens(token_hash);
```
