# [FEAT-05] Xác Thực 2 Yếu Tố (Two-Factor Authentication - 2FA)

- **Mã Tính Năng**: FEAT-05
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] High
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] In Progress

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một người dùng quan tâm đến an toàn bảo mật hoặc là Quản trị viên doanh nghiệp xử lý các dữ liệu nhạy cảm, tôi muốn kích hoạt xác thực 2 yếu tố (2FA - TOTP) trên tài khoản của mình để bảo vệ tài khoản khỏi các nguy cơ bị đánh cắp mật khẩu hoặc truy cập trái phép.
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../02_analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Thiết lập 2FA (Setup TOTP)**: Given người dùng vào Cài đặt bảo mật và chọn "Bật 2FA", When bấm kích hoạt, Then hệ thống sinh một Base32 Secret Key bí mật, sinh mã QR Code chứa URI `otpauth://totp/OpenERP:...` và lưu tạm trạng thái `PENDING_CONFIRMATION` (bộ 8 mã dự phòng được sinh sẵn ở server nhưng chỉ hiển thị cho người dùng sau khi xác nhận kích hoạt thành công).
- [ ] **Kịch bản 2: Xác nhận kích hoạt 2FA**: Given người dùng quét QR vào ứng dụng Authenticator (Google/Microsoft Auth) và nhập đúng mã 6 số hiện tại, When bấm xác nhận, Then 2FA được bật chính thức, lưu Secret Key đã mã hóa AES-256 và danh sách mã Backup Codes đã hash (JSONB trong bảng `user_two_factor`), đồng thời hiển thị 8 mã dự phòng để người dùng lưu trữ.
- [ ] **Kịch bản 3: Xác thực 2FA khi Đăng Nhập**: Given tài khoản đã kích hoạt 2FA đăng nhập đúng mật khẩu, When được yêu cầu mã OTP, Then nhập đúng mã 6 số trong vòng 30s cấp JWT Token chính thức; nếu nhập sai 3 lần liên tiếp thì hủy phiên xác thực tạm (`pre_auth_token`) và yêu cầu đăng nhập lại từ đầu.
- [ ] **Kịch bản 4: Sử dụng Backup Code khi mất điện thoại**: Given người dùng không có điện thoại, When chọn "Dùng mã khôi phục", Then nhập đúng 1 trong 8 mã dự phòng thì đăng nhập thành công và mã dự phòng đó bị tiêu hủy ngay lập tức (single-use).

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] TASK-123: Thiết kế bảng `user_two_factor` (lưu `secret_key_enc` mã hóa AES-256, `backup_codes_hash` dạng JSONB, `is_enabled`, `enabled_at`).
- [ ] TASK-124: Tích hợp thư viện Java TOTP (RFC 6238) và thuật toán HMAC-SHA1 trong Quarkus.
- [ ] TASK-125: Hiện thực API Quarkus: `POST /api/v1/auth/2fa/verify-login` (xác thực 2FA khi đăng nhập) và nhóm `POST /api/v1/account/2fa/setup|enable|disable|regenerate-backup-codes` (quản lý 2FA trong Drawer tài khoản).
- [ ] TASK-126: Viết Unit Test Backend kiểm tra sinh/kiểm tra mã TOTP, drift time $\pm 1$ interval, tiêu hủy backup code và khóa xác thực 2FA sau 3 lần nhập sai.
- [ ] TASK-127: Xây dựng giao diện hiển thị QR Code và form nhập OTP 6 số nhỏ gọn, vuông vắn trên Angular 22 & Ionic 8.
- [ ] TASK-128: QA/QC thực hiện Browser Manual Testing cài đặt 2FA trên ứng dụng di động thật và kiểm thử đăng nhập.
