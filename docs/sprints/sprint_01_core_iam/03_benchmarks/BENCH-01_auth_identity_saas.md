# [BENCH-01] Khảo Sát & Đối Chuẩn: Kiến Trúc Multi-Tenant Identity & Access Management

- **Mã Tài Liệu**: BENCH-01
- **Phụ Trách**: BA Agent
- **Ngày Thực Hiện**: 2026-09-17
- **Hệ Thống Khảo Sát**: Keycloak, Supabase Auth, Auth0 Organizations, Odoo Multi-Company, ERPNext

---

## 1. Bảng So Sánh Các Mô Hình Xác Thực Multi-Tenant

| Tiêu Chí | Odoo Community / Enterprise | Keycloak IAM | Auth0 Organizations | Mô Hình Đề Xuất Open-ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Phân tách User & Tenant** | User thuộc Database cụ thể; chuyển db bằng DB Selector | Realm-based (mỗi Tenant là 1 Realm riêng biệt) | 1 Global User có thể thuộc nhiều Organizations | **1 Global Identity $\rightarrow$ N Organizations (Tenants) qua bảng liên kết** |
| **Cơ chế Token** | Session Cookie (Stateful) | OIDC / OAuth2 JWT Tokens | JWT với `org_id` claim | **JWT Stateless (Access 15p) + Redis Stateful Sessions (Refresh 7d)** |
| **Xác thực 2FA** | Hỗ trợ TOTP (Authenticator app) | TOTP, WebAuthn, SMS | TOTP, Push notification | **Chuẩn TOTP RFC 6238 + 8 Mã dự phòng (Backup Codes)** |
| **Chống Brute-force** | Delay theo cấp số nhân | Brute force detection per IP/User | Account Lockout & Anomaly Detection | **Khóa tạm 15p sau 5 lần thất bại; Rate Limiter trên Redis** |
| **UI/UX Quản lý tài khoản** | Màn hình Preferences dạng form phẳng | Account Console độc lập | Universal Login | **Drawer trượt cạnh phải (Desktop) / Page trượt (Mobile), không Modal** |

---

## 2. Bài Học Kinh Nghiệm Rút Ra Cho Open-ERP

1. **Từ Auth0 Organizations**:
   - Tách rời danh tính toàn cục (`User`) và vai trò trong từng tổ chức (`Membership`). Người dùng chỉ cần nhớ 1 mật khẩu duy nhất cho cả tài khoản cá nhân và tài khoản công việc.
   - Khi đăng nhập, nếu thuộc nhiều doanh nghiệp, hiển thị màn hình chọn Workspace trực quan.
2. **Từ Keycloak**:
   - Sử dụng RFC 6238 cho TOTP giúp người dùng tương thích ngay với các app phổ biến (Google Authenticator, Microsoft Authenticator) mà không cần xây app riêng.
   - Hỗ trợ xem danh sách Active Sessions kèm địa chỉ IP và thiết bị, cho phép người dùng tự thu hồi phiên từ xa khi bị lộ tài khoản.
3. **Từ Odoo & ERPNext**:
   - Giao diện ERP cần hiển thị dữ liệu cô đọng, tránh dùng modal che màn hình. Màn hình quản lý tài khoản và đổi mật khẩu trong Open-ERP sẽ dùng **Drawer trượt** từ mép phải màn hình để không ngắt quãng công việc của người dùng.
