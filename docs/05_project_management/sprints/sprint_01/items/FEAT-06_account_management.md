# [FEAT-06] Quản Lý Tài Khoản (Profile, Security, Active Sessions)

- **Mã Tính Năng**: FEAT-06
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Medium
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] In Progress

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một người dùng đã đăng nhập, tôi muốn quản lý thông tin cá nhân của mình (họ tên, avatar, số điện thoại, múi giờ, ngôn ngữ), đổi mật khẩu, quản lý trạng thái 2FA và kiểm tra các thiết bị/phiên đang đăng nhập để duy trì tính an toàn và tiện dụng cho tài khoản của mình.
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../../../01_requirements/analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../../../01_requirements/confirmations/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Cập nhật thông tin cá nhân (Profile Update)**: Given người dùng mở màn hình Quản lý tài khoản (qua Drawer hoặc Split-Screen), When chỉnh sửa họ tên, số điện thoại, avatar và bấm Lưu, Then dữ liệu được cập nhật tức thời và hiển thị ngay trên thanh Header/TopBar.
- [ ] **Kịch bản 2: Đổi mật khẩu an toàn**: Given người dùng nhập đúng mật khẩu hiện tại và nhập mật khẩu mới hợp lệ, When bấm Đổi mật khẩu, Then mật khẩu mới được cập nhật, đồng thời hệ thống cho phép chọn "Đăng xuất khỏi tất cả các thiết bị khác".
- [ ] **Kịch bản 3: Giám sát phiên đăng nhập (Active Sessions Monitor)**: Given người dùng truy cập mục Phiên đăng nhập, When xem danh sách, Then hiển thị chi tiết: Thiết bị (Browser, OS), Địa chỉ IP, Thời điểm đăng nhập gần nhất, và gắn nhãn "Phiên hiện tại".
- [ ] **Kịch bản 4: Thu hồi phiên đăng nhập từ xa (Remote Session Revocation)**: Given người dùng bấm "Đăng xuất thiết bị này" hoặc "Đăng xuất toàn bộ thiết bị khác", When xác nhận, Then phiên tương ứng bị xóa khỏi Redis và token của thiết bị đó bị vô hiệu hóa ngay lập tức.
- [ ] **Kịch bản 5: Giao diện Anti-Modal**: Given người dùng mở tính năng quản lý tài khoản trên Web Desktop, Then hiển thị dưới dạng **Drawer trượt từ cạnh phải** hoặc **Split-Screen**; **tuyệt đối không bật pop-up modal** che màn hình làm việc chính.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] TASK-129: Thiết kế bảng `user_profiles` và tích hợp Redis session tracking (`user:{id}:sessions`).
- [ ] TASK-130: Hiện thực API Quarkus `GET/PUT /api/v1/account/profile`, `POST /api/v1/account/change-password`, `GET /api/v1/account/sessions`, `DELETE /api/v1/account/sessions/{id}`.
- [ ] TASK-131: Viết Unit Test Backend kiểm tra logic đổi mật khẩu, kiểm tra phiên hợp lệ và thu hồi session trong Redis.
- [ ] TASK-132: Xây dựng giao diện `AccountDrawerComponent` trượt từ cạnh phải màn hình với thiết kế vuông vắn, font chữ nhỏ `text-xs`, ít margin trên Angular 22 và Ionic 8.
- [ ] TASK-133: QA/QC thực hiện Browser Manual Testing kiểm tra cập nhật thông tin, đổi mật khẩu và đăng xuất phiên từ xa.
