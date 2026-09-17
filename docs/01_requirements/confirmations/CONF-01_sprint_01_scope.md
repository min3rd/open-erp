# [CONF-01] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu: Sprint 01

- **Mã Biên Bản**: CONF-01
- **Ngày Xác Nhận**: 2026-09-17
- **Đại Diện Khách Hàng**: Người dùng (User / Customer)
- **Đại Diện Dự Án**: BA Agent, Solution Architect, PM Agent
- **Trạng Thái**: [x] ĐÃ XÁC NHẬN & PHÊ DUYỆT

---

## 1. Phạm Vi Thực Hiện Được Khách Hàng Xác Nhận (In-Scope)

1. **FEAT-01: Đăng Ký Tài Khoản Cá Nhân**:
   - Form đăng ký gọn gàng (Họ tên, Email, Mật khẩu $\ge$ 8 ký tự).
   - Xác thực email bằng OTP 6 số (gửi qua Mailpit trên local dev).
   - Tự động cấp không gian cá nhân (Personal Workspace).
2. **FEAT-02: Đăng Ký Tài Khoản Quản Trị Doanh Nghiệp**:
   - Đăng ký công ty mới (Tên công ty, Subdomain/Slug duy nhất, Mã số thuế).
   - Khởi tạo Tenant mới, thiết lập quyền `TENANT_ADMIN` cho người đăng ký.
   - Cô lập dữ liệu tuyệt đối theo `tenant_id`.
3. **FEAT-03: Đăng Nhập & Phân Giải Ngữ Cảnh**:
   - Đăng nhập bằng Email + Mật khẩu.
   - Trình chọn Doanh nghiệp (Workspace Picker) nếu người dùng thuộc nhiều Tenant.
   - Cấp cặp JWT Access Token (15 phút) & Refresh Token (7 ngày).
   - Chống Brute-force: Khóa 15 phút sau 5 lần sai liên tiếp.
4. **FEAT-04: Quên Mật Khẩu**:
   - Gửi link/mã khôi phục qua email (Mailpit local).
   - Đặt lại mật khẩu an toàn, thu hồi (revoke) các phiên đăng nhập cũ trong Redis.
5. **FEAT-05: Xác Thực 2 Yếu Tố (2FA)**:
   - Chuẩn TOTP RFC 6238 (Google Authenticator, Microsoft Authenticator).
   - Cấp 8 mã dự phòng (Backup Codes) sử dụng 1 lần.
6. **FEAT-06: Quản Lý Tài Khoản (Anti-Modal UI)**:
   - Xem và đổi thông tin cá nhân, avatar, đổi mật khẩu.
   - Giám sát danh sách thiết bị/phiên đang đăng nhập và nút đăng xuất từ xa.
   - Hiển thị qua **Drawer trượt từ cạnh phải (Side Sheet)** hoặc **Split-Screen**, tuyệt đối không dùng modal.

---

## 2. Tiêu Chí Nghiệm Thu Chung Của Sprint (Acceptance Gates)
1. **Tiêu chuẩn Kỹ thuật**:
   - 100% logic Backend có Unit Test (JUnit 5 + RestAssured).
   - Frontend không viết unit test; QA/QC kiểm thử trực tiếp trên Web Browser.
2. **Tiêu chuẩn UI/UX**:
   - Font chữ nhỏ (`text-xs`/`text-sm`), viền vuông (`rounded-none`), khoảng cách đệm nhỏ, không khoảng trắng thừa.
3. **Điều kiện hoàn thành Sprint (DoD)**:
   - Toàn bộ 6 tính năng không còn task/bug nào ở mức `Critical` hoặc `High` chưa giải quyết.
