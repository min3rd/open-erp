# [SOL-01] Nghiên Cứu Giải Pháp: Kiến Trúc Core Identity, Access & Account Management

- **Mã Giải Pháp**: SOL-01
- **Phụ Trách**: Solution Architect Agent
- **Ngày Thực Hiện**: 2026-09-17
- **Tài Liệu Yêu Cầu**: [CONF-01_sprint_01_scope.md](../01_requirements/confirmations/CONF-01_sprint_01_scope.md)

---

## 1. Kiến Trúc Xác Thực & Phân Quyền (Authentication & Authorization Flow)

Hệ thống sử dụng cơ chế Hybrid: **Stateless Access Token (JWT)** kết hợp **Stateful Session Store (Redis)** nhằm tối ưu hiệu năng vừa cho phép thu hồi phiên tức thì (Instant Session Revocation).

```
Browser / Mobile App              Quarkus Backend                   Redis Cache           PostgreSQL
       |                                |                                |                    |
       |--- 1. POST /auth/login ------->|                                |                    |
       |    (email, password)           |--- 2. Verify Argon2id ----------------------------->|
       |                                |<-- User & Tenant Records ---------------------------|
       |                                |                                |                    |
       |                                |--- 3. Create Session --------->|                    |
       |                                |    `session:{session_id}`      |                    |
       |                                |    (ttl: 7 days)               |                    |
       |<-- 4. Return JWTs -------------|                                |                    |
       |    - Access Token (15 min)     |                                |                    |
       |    - Refresh Token (7 days)    |                                |                    |
       |                                |                                |                    |
       |--- 5. API Request (X-Tenant) ->|                                |                    |
       |    Authorization: Bearer JWT   |--- 6. Check Blacklist/Session->|                    |
       |                                |<-- Valid ----------------------|                    |
       |                                |--- 7. Query with tenant_id ------------------------>|
       |<-- 8. Return Business Data ----|<-- Tenant-isolated data ----------------------------|
```

---

## 2. Các Quyết Định Kỹ Thuật Trọng Yếu (Key Technical Decisions)

### 2.1. Mã Hóa Mật Khẩu (Password Hashing)
- **Lựa chọn**: **Argon2id** (hoặc BCrypt `cost = 12`).
- **Lý do**: Argon2id là chuẩn vô địch Password Hashing Competition (PHC), chống tấn công GPU/ASIC và tấn công thời gian (side-channel attacks).

### 2.2. Cơ Chế Xác Thực Hai Yếu Tố (2FA - TOTP)
- **Lựa chọn**: Chuẩn **RFC 6238** (HMAC-SHA1, 6 chữ số, chu kỳ thời gian $T_0 = 30s$).
- **Bảo vệ Secret Key**: Khóa bí mật Base32 của người dùng được mã hóa đối xứng bằng thuật toán **AES-256-GCM** trước khi lưu vào CSDL PostgreSQL.
- **Mã dự phòng (Backup Codes)**: Tạo 8 mã dạng `XXXX-XXXX`, được băm một chiều (SHA-256) trước khi lưu. Khi người dùng sử dụng mã nào, bản ghi mã đó sẽ bị xóa ngay (Single-use).

### 2.3. Ngữ Cảnh Multi-Tenant (Tenant Context & Data Isolation)
- Cấu trúc JWT Payload:
  ```json
  {
    "sub": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "admin@acme.com",
    "tenant_id": "tnt_8a2cfb11-4f1b-4d0c-8d1e-1f0e2a3b4c5d",
    "roles": ["TENANT_ADMIN"],
    "session_id": "ses_01h7x8...",
    "exp": 1726610000
  }
  ```
- Backend Quarkus sử dụng CDI `@RequestScoped` `TenantContext` tự động trích xuất `tenant_id` từ JWT hoặc Header `X-Tenant-Id`.
- Mọi câu lệnh SQL qua Hibernate Panache tự động kích hoạt bộ lọc Hibernate `@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")`.

### 2.4. Quản Lý Phiên (Session Management & Revocation)
- Khi người dùng bấm "Đổi mật khẩu" hoặc "Đăng xuất từ xa":
  - Backend cập nhật key `blacklist:token:{jti}` trong Redis với thời gian sống bằng thời gian còn lại của token.
  - Xóa key `user:{user_id}:session:{session_id}` khỏi Redis.
  - Mọi request sử dụng token cũ lập tức bị chặn với mã `401 Unauthorized`.
