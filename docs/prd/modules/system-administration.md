# PRD — Phân hệ System Administration
# Quản trị Hệ thống SaaS & Quản trị Doanh nghiệp

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 01, Sprint 02  
**Trạng thái:** Đang soạn thảo  

---

## 1. Mục tiêu phân hệ

Phân hệ **System Administration** là nền tảng lõi của toàn bộ hệ thống Open ERP, đảm nhiệm:

- **Quản trị SaaS:** Vận hành nền tảng multi-tenant, quản lý tenant, gói dịch vụ
- **Quản trị doanh nghiệp:** Cho phép Tenant Admin quản lý tổ chức, người dùng, phân quyền
- **Bảo mật và kiểm soát truy cập:** Xác thực mạnh, phân quyền chi tiết (RBAC)
- **Dữ liệu nền tảng:** Quản lý danh mục dùng chung, biểu mẫu động
- **Giám sát và kiểm toán:** Audit log toàn diện cho mọi thao tác

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng | Mô tả |
|---|---|
| Xác thực JWT + OAuth2 | Đăng nhập, đăng ký, refresh token, đăng xuất an toàn |
| Quản lý Tenant | CRUD tenant, trạng thái, cấu hình, quota |
| Quản lý Người dùng | CRUD user, gán vai trò, trạng thái tài khoản |
| Quản lý Vai trò (RBAC) | Tạo/sửa/xóa role, gán quyền, phân role cho user |
| Quản lý Phòng ban | Tạo cơ cấu tổ chức (org chart), chi nhánh, bộ phận |
| Phân quyền chi tiết | Quyền chức năng, quyền dữ liệu, quyền theo phòng ban |
| Audit Log | Ghi log toàn bộ thao tác CRUD, truy cập, đăng nhập |
| Multi-tenant Isolation | Tất cả dữ liệu tách biệt theo tenantId |

### Should Have

| Tính năng | Mô tả |
|---|---|
| MFA (Multi-factor Auth) | TOTP/OTP qua email, SMS, Authenticator app |
| Quản lý Session | Xem và thu hồi phiên đăng nhập đang hoạt động |
| Danh mục động | Tạo và quản lý danh mục tùy chỉnh theo tenant |
| Biểu mẫu động | Tạo form tùy chỉnh cho các nghiệp vụ |
| Quản lý API Key | Cấp phát API key cho tích hợp bên ngoài |
| Cấu hình thông báo | Thiết lập kênh thông báo (email, push, in-app) |
| AI Gợi ý phân quyền | AI đề xuất role phù hợp theo chức danh |
| Phát hiện bất thường | AI cảnh báo hành vi đăng nhập/thao tác bất thường |

### Could Have

| Tính năng | Mô tả |
|---|---|
| SSO (Single Sign-On) | Tích hợp với hệ thống xác thực doanh nghiệp (LDAP/SAML) |
| Subscription Management | Quản lý gói dịch vụ, thanh toán, hóa đơn subscription |
| White-label | Tùy chỉnh giao diện theo branding doanh nghiệp |
| Phân tích sử dụng | Báo cáo mức độ sử dụng từng tính năng theo tenant |
| AI phân tích hành vi | Phân tích pattern sử dụng để gợi ý tối ưu |

### Won't Have (v1.0)

- Tích hợp LDAP/Active Directory phức tạp
- Billing tự động với cổng thanh toán
- Marketplace module (third-party extensions)

---

## 3. User Flows chính

### 3.1 Flow: Tenant Onboarding

```
Super Admin tạo tenant
    → Gửi email mời Tenant Admin
        → Tenant Admin đặt mật khẩu & đăng nhập lần đầu
            → Wizard cấu hình ban đầu:
                1. Thông tin doanh nghiệp (tên, MST, địa chỉ)
                2. Chọn múi giờ & ngôn ngữ
                3. Tạo phòng ban đầu tiên
                4. Mời người dùng đầu tiên
                5. Chọn phân hệ cần kích hoạt
            → Dashboard chính của tenant
```

### 3.2 Flow: Đăng nhập và Xác thực

```
Người dùng nhập email + mật khẩu
    → Hệ thống kiểm tra tenant từ subdomain/domain
        → Xác thực credentials
            → [Nếu MFA bật] → Nhập OTP
                → Phát JWT access token (15 phút) + refresh token (7 ngày)
                    → Ghi audit log: đăng nhập thành công
                        → Redirect đến Dashboard
    → [Nếu sai] → Tăng counter, sau 5 lần → khóa tài khoản tạm thời
```

### 3.3 Flow: Phân quyền người dùng

```
Tenant Admin chọn người dùng
    → Xem danh sách role hiện tại
        → Gán/gỡ role
            → [Tùy chọn] Override quyền cụ thể
                → [Tùy chọn] Giới hạn theo phòng ban/chi nhánh
                    → Lưu → Audit log ghi nhận
                        → User nhận thông báo quyền được thay đổi
```

### 3.4 Flow: Audit Log Query

```
Admin chọn phân hệ Audit Log
    → Lọc theo: người dùng / hành động / module / thời gian
        → Xem chi tiết từng log entry:
            - Thời gian, người thực hiện, IP
            - Module, action (CREATE/UPDATE/DELETE)
            - Dữ liệu trước và sau khi thay đổi
        → Xuất báo cáo Excel/CSV
```

---

## 4. Business Rules quan trọng

### 4.1 Multi-tenant Isolation
- **BR-SA-001:** Mọi truy vấn dữ liệu bắt buộc phải có `tenantId` được xác thực từ JWT token
- **BR-SA-002:** Không được phép truy cập dữ liệu của tenant khác dù có quyền Super Admin (chỉ được dùng qua giao diện quản trị riêng)
- **BR-SA-003:** Khi tenant bị suspended, toàn bộ API call trả về lỗi 403 với thông báo rõ ràng

### 4.2 Xác thực và Bảo mật
- **BR-SA-004:** Mật khẩu phải đáp ứng: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
- **BR-SA-005:** Sau 5 lần đăng nhập sai, tài khoản bị khóa 15 phút (tự động mở khóa)
- **BR-SA-006:** Access token hết hạn sau 15 phút; refresh token hết hạn sau 7 ngày
- **BR-SA-007:** Refresh token chỉ được dùng một lần (token rotation)
- **BR-SA-008:** Đăng xuất trên một thiết bị không ảnh hưởng thiết bị khác (trừ "đăng xuất tất cả")

### 4.3 Phân quyền
- **BR-SA-009:** Super Admin không thể bị xóa khỏi tenant hoặc bị tước quyền bởi Tenant Admin
- **BR-SA-010:** Quyền được tính theo nguyên tắc least privilege — chỉ cấp quyền tối thiểu cần thiết
- **BR-SA-011:** Khi role bị xóa, user được gán role đó tự động mất quyền ngay lập tức
- **BR-SA-012:** Phân quyền theo dữ liệu có thể giới hạn: xem/sửa chỉ dữ liệu của phòng ban mình

### 4.4 Audit Log
- **BR-SA-013:** Audit log là bất biến — không được phép xóa hoặc sửa sau khi ghi
- **BR-SA-014:** Lưu trữ audit log tối thiểu 2 năm
- **BR-SA-015:** Audit log phải ghi đủ: actor, action, resource, timestamp, IP, user-agent, kết quả

---

## 5. Tích hợp với phân hệ khác

| Phân hệ | Loại tích hợp | Mô tả |
|---|---|---|
| **Tất cả phân hệ** | Core dependency | Mọi phân hệ đều dùng auth token và phân quyền từ System Admin |
| **AI Agent** | Bidirectional | AI nhận dữ liệu user/role để gợi ý; AI ghi log qua cùng audit service |
| **Office** | Read | Office đọc org chart (phòng ban/nhân viên) để gán công việc |
| **HR** | Bidirectional | HR quản lý nhân viên, khi nhân viên được tạo → tự động tạo user account |
| **Dashboard** | Read | Dashboard đọc dữ liệu audit log và user activity để hiển thị thống kê |
| **Accounting** | Read | Accounting đọc danh mục và cấu hình tenant cho thiết lập kế toán |

---

## 6. Cấu trúc dữ liệu chính (tham khảo)

### Tenant
```
tenantId, name, subdomain, status (active/suspended/terminated),
plan (starter/business/enterprise), trialEndsAt,
settings: { timezone, language, logo, modules[] },
quota: { maxUsers, storage, apiCallsPerDay }
```

### User
```
userId, tenantId, email, passwordHash, status,
profile: { fullName, avatar, phone, position },
roles[], lastLoginAt, mfaEnabled, mfaSecret
```

### Role
```
roleId, tenantId, name, description,
permissions: [{ module, action, resource, scope }],
isSystem (true = không được xóa)
```

### AuditLog
```
logId, tenantId, userId, timestamp, ipAddress, userAgent,
module, action (CREATE/READ/UPDATE/DELETE/LOGIN/LOGOUT),
resourceType, resourceId,
dataBefore (object), dataAfter (object), result (success/failed)
```
