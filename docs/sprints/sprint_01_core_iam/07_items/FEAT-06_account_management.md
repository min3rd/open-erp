# [FEAT-06] Quản Lý Tài Khoản (Profile, 2FA Management, Security, Active Sessions)

- **Mã Tính Năng**: FEAT-06
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Medium
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] Done
- **Tiến độ (2026-09-18)**: Đã triển khai xong Web + Mobile; backend 30/30 automated test PASS; QA browser/mobile automation PASS; khách hàng nghiệm thu và chuyển `Done`.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một người dùng đã đăng nhập, tôi muốn quản lý thông tin cá nhân của mình (họ tên, avatar, số điện thoại, múi giờ, ngôn ngữ), đổi mật khẩu, tự kích hoạt hoặc xóa/tắt xác thực 2 yếu tố (2FA) và kiểm tra các thiết bị/phiên đang đăng nhập để duy trì tính an toàn và tiện dụng cao nhất cho tài khoản của mình.
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../02_analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Cập nhật thông tin cá nhân (Profile Update)**: Given người dùng mở màn hình Quản lý tài khoản (qua Drawer hoặc Split-Screen), When chỉnh sửa họ tên, số điện thoại, avatar và bấm Lưu, Then dữ liệu được cập nhật tức thời và hiển thị ngay trên thanh Header/TopBar.
- [x] **Kịch bản 2: Đổi mật khẩu an toàn**: Given người dùng nhập đúng mật khẩu hiện tại và nhập mật khẩu mới hợp lệ, When bấm Đổi mật khẩu, Then mật khẩu mới được cập nhật, đồng thời hệ thống cho phép chọn "Đăng xuất khỏi tất cả các thiết bị khác".
- [x] **Kịch bản 3: Đăng ký kích hoạt 2FA trong Drawer (Setup & Enable 2FA)**: Given tài khoản chưa bật 2FA, When người dùng bấm "Bật 2FA" tại Tab Bảo Mật của Drawer Quản lý tài khoản, Then Drawer phụ xếp chồng (`Setup2FaDrawerComponent`) trượt mở hiển thị QR Code và Secret key; khi người dùng quét vào Authenticator và nhập đúng mã OTP 6 số hiện tại thì kích hoạt 2FA thành công, hiển thị danh sách 8 mã Backup Codes kèm nút sao chép / tải file txt.
- [x] **Kịch bản 4: Xóa / Tắt 2FA an toàn với bảo mật kép (Disable 2FA Re-Auth)**: Given tài khoản đang bật 2FA, When người dùng bấm "Tắt 2FA", Then Drawer con (`Disable2FaDrawerComponent`) trượt mở yêu cầu nhập mật khẩu hiện tại VÀ mã OTP 6 số (hoặc Backup Code); khi xác thực đúng, hệ thống xóa 2FA secret, hủy backup codes, cập nhật trạng thái Chưa kích hoạt, và gửi email cảnh báo bảo mật tức thì.
- [x] **Kịch bản 5: Quản lý và tái tạo bộ mã Backup Codes**: Given tài khoản đã kích hoạt 2FA, When người dùng bấm "Mã dự phòng" và chọn tạo lại mã, Then sau khi nhập đúng mật khẩu hiện tại, hệ thống cấp 8 mã dự phòng mới và tiêu hủy vĩnh viễn các mã cũ.
- [x] **Kịch bản 6: Giám sát phiên đăng nhập (Active Sessions Monitor)**: Given người dùng truy cập mục Phiên đăng nhập, When xem danh sách, Then hiển thị chi tiết: Thiết bị (Browser, OS), Địa chỉ IP, Thời điểm đăng nhập gần nhất, và gắn nhãn "Phiên hiện tại".
- [x] **Kịch bản 7: Thu hồi phiên đăng nhập từ xa (Remote Session Revocation)**: Given người dùng bấm "Đăng xuất thiết bị này" hoặc "Đăng xuất toàn bộ thiết bị khác", When xác nhận, Then phiên tương ứng bị xóa khỏi Redis và token của thiết bị đó bị vô hiệu hóa ngay lập tức.
- [x] **Kịch bản 8: Giao diện Anti-Modal với Drawer xếp chồng (Stacked Drawers)**: Given người dùng thực hiện bất kỳ thao tác nào trong quản lý tài khoản trên Web Desktop, Then hiển thị dưới dạng **Drawer trượt từ cạnh phải** và các **Drawer con xếp chồng (Stacked Drawers)**; **tuyệt đối không bật pop-up modal** che màn hình làm việc chính.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-129: Thiết kế bảng `user_profiles` và tích hợp Redis session tracking (`user:{id}:sessions`).
- [x] TASK-130: Hiện thực nhóm API Quarkus `/api/v1/account`:
  - Profile: `GET/PUT /api/v1/account/profile`
  - Đổi mật khẩu: `POST /api/v1/account/change-password`
  - Quản lý 2FA: `GET /api/v1/account/2fa/status`, `POST /api/v1/account/2fa/setup`, `POST /api/v1/account/2fa/enable`, `POST /api/v1/account/2fa/disable`, `POST /api/v1/account/2fa/regenerate-backup-codes`
  - Quản lý Sessions: `GET /api/v1/account/sessions`, `DELETE /api/v1/account/sessions/{id}`, `DELETE /api/v1/account/sessions/other`.
- [x] TASK-131: Viết Unit Test Backend kiểm tra logic đổi mật khẩu, xác thực bật/tắt 2FA an toàn (bảo mật kép mật khẩu + OTP), và thu hồi session trong Redis.
- [x] TASK-132: Xây dựng giao diện `AccountDrawerComponent` trượt từ cạnh phải màn hình kèm các Drawer con xếp chồng (`Setup2FaDrawerComponent`, `Disable2FaDrawerComponent`) với thiết kế vuông vắn, font chữ nhỏ `text-xs`, ít margin trên Angular 22 và Ionic 8.
- [x] TASK-133: QA/QC thực hiện Browser Manual Testing kiểm tra cập nhật thông tin, đổi mật khẩu, kích hoạt 2FA bằng quét QR, tắt 2FA bằng xác thực kép và đăng xuất phiên từ xa.
- **Nghiệm thu (2026-09-18)**: Khách hàng đã nghiệm thu và đồng ý đóng Sprint 01.
