# [FEAT-01] Đăng Ký Tài Khoản Cá Nhân

- **Mã Tính Năng**: FEAT-01
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] High
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] Resolved

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một cá nhân (nhân viên, chuyên gia tự do hoặc người dùng tiềm năng), tôi muốn tự đăng ký tài khoản bằng email và mật khẩu để có thể truy cập vào hệ sinh thái Open-ERP và tham gia vào các không gian làm việc (Tenants).
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../02_analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Đăng ký thành công**: Given người dùng nhập họ tên, email hợp lệ chưa tồn tại trong hệ thống, mật khẩu $\ge$ 8 ký tự (có chữ hoa, chữ thường, số, ký tự đặc biệt), When bấm "Đăng Ký", Then tài khoản được tạo ở trạng thái `PENDING_VERIFICATION`, gửi email chứa mã OTP 6 số kích hoạt qua Mailpit, hiển thị màn hình xác nhận.
- [x] **Kịch bản 2: Email đã tồn tại**: Given email đã được đăng ký trước đó, When người dùng đăng ký lại, Then hệ thống thông báo lỗi rõ ràng "Email đã được sử dụng", không tạo bản ghi mới.
- [x] **Kịch bản 3: Xác thực email hoàn tất**: Given mã OTP nhập đúng trong vòng 15 phút, When bấm xác thực, Then trạng thái chuyển thành `ACTIVE`, cấp phát Personal Workspace mặc định, cho phép đăng nhập.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-101: Thiết kế bảng `users`, `user_credentials` trong CSDL PostgreSQL.
- [x] TASK-102: Hiện thực API Quarkus `POST /api/v1/auth/register/personal` và `POST /api/v1/auth/verify-email` (tự động tạo Personal Workspace với `tenants.type = 'PERSONAL'` khi kích hoạt email).
- [x] TASK-103: Viết Unit Test Backend (JUnit 5 + RestAssured) kiểm tra validation, mã hóa Argon2id và gửi mail.
- [x] TASK-104: Xây dựng màn hình đăng ký cá nhân Angular 22 & Ionic 8 (thiết kế vuông vắn, font nhỏ gọn `text-xs`, ít margin).
- [x] TASK-105: QA/QC thực hiện Browser Manual Testing luồng đăng ký và kiểm tra email tại Mailpit.
