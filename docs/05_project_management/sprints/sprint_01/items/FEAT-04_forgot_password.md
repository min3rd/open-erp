# [FEAT-04] Quên Mật Khẩu & Khôi Phục Tài Khoản

- **Mã Tính Năng**: FEAT-04
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] High
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] In Progress

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một người dùng quên mật khẩu đăng nhập, tôi muốn yêu cầu gửi link hoặc mã xác nhận khôi phục mật khẩu về email của mình để có thể thiết lập lại mật khẩu mới một cách an toàn mà không cần nhờ đến quản trị viên hỗ trợ thủ công.
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../../../01_requirements/analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../../../01_requirements/confirmations/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Yêu cầu khôi phục mật khẩu**: Given người dùng nhập email đã đăng ký, When bấm "Gửi Yêu Cầu Khôi Phục", Then hệ thống sinh một `reset_token` an toàn (sử dụng mật mã học `SecureRandom`, hash SHA-256 lưu CSDL, TTL 15 phút), gửi email chứa link đặt lại mật khẩu về hòm thư người dùng (qua Mailpit trong môi trường dev).
- [ ] **Kịch bản 2: Bảo mật chống liệt kê tài khoản (Account Enumeration Prevention)**: Given người dùng nhập một email không hề tồn tại trong hệ thống, When gửi yêu cầu, Then giao diện vẫn hiển thị thông báo chung: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn khôi phục", ngăn chặn kẻ tấn công dò tìm email người dùng.
- [ ] **Kịch bản 3: Đặt lại mật khẩu thành công**: Given người dùng truy cập link hợp lệ trong thời hạn 15 phút và nhập mật khẩu mới hợp lệ, When bấm "Cập Nhật Mật Khẩu", Then mật khẩu mới được mã hóa Argon2id, token khôi phục bị vô hiệu hóa ngay lập tức, và toàn bộ phiên đăng nhập cũ trên các thiết bị khác bị thu hồi (revoke sessions trong Redis).

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] TASK-117: Thiết kế bảng `password_reset_tokens` (token hash, user_id, expires_at, used_at).
- [ ] TASK-118: Hiện thực API Quarkus `POST /api/v1/auth/forgot-password` và `POST /api/v1/auth/reset-password`.
- [ ] TASK-119: Tích hợp template email khôi phục mật khẩu gửi qua Quarkus Mailer (bắt tại Mailpit port 8025).
- [ ] TASK-120: Viết Unit Test Backend kiểm tra token expiry, token single-use, revoke sessions trong Redis.
- [ ] TASK-121: Xây dựng màn hình Quên Mật Khẩu và Đặt Lại Mật Khẩu trên Angular 22 & Ionic 8 (thiết kế vuông vắn, ít margin).
- [ ] TASK-122: QA/QC thực hiện Browser Manual Testing kiểm tra nhận mail tại Mailpit và đặt lại mật khẩu thành công.
