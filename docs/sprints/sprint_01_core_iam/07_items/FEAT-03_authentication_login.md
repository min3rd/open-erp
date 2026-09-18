# [FEAT-03] Đăng Nhập & Xác Định Ngữ Cảnh Tenant (Multi-Tenant Login)

- **Mã Tính Năng**: FEAT-03
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] In Review
- **Tiến độ (2026-09-18)**: Đã triển khai xong Web + Mobile, backend 22/22 automated test PASS; chờ QA Browser Manual Testing để chuyển `Done`.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một người dùng đã có tài khoản, tôi muốn đăng nhập bằng Email và Mật khẩu để truy cập vào hệ thống; nếu tôi thuộc về nhiều Doanh nghiệp khác nhau, tôi có thể lựa chọn đúng Doanh nghiệp (Tenant) để làm việc và nhận JWT Token mang đúng ngữ cảnh `tenant_id`.
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../02_analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Đăng nhập thành công với 1 Tenant duy nhất**: Given tài khoản hợp lệ chỉ thuộc 1 Tenant và chưa bật 2FA, When đăng nhập thành công, Then cấp phát cặp JWT (Access Token 15 phút + Refresh Token 7 ngày), lưu phiên vào Redis, chuyển thẳng vào Dashboard.
- [x] **Kịch bản 2: Đăng nhập với tài khoản thuộc nhiều Tenant (Workspace Picker)**: Given tài khoản thuộc về 2 Doanh nghiệp trở lên, When xác thực mật khẩu đúng, Then hiển thị danh sách Tenant kèm quyền của người dùng để chọn Tenant làm việc, token được cấp sau khi chọn xong.
- [x] **Kịch bản 3: Tài khoản đã kích hoạt 2FA**: Given tài khoản đã bật 2FA, When đăng nhập mật khẩu đúng, Then trả về token tạm thời `2FA_REQUIRED` và chuyển sang bước nhập mã OTP 6 số.
- [x] **Kịch bản 4: Khóa tài khoản khi nhập sai quá 5 lần (Brute-force protection)**: Given nhập sai mật khẩu liên tiếp 5 lần trong 10 phút, Then tạm khóa tài khoản 15 phút và thông báo thời gian chờ.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-111: Thiết kế cấu trúc JWT Claims (`sub`, `tenant_id`, `roles`, `permissions`, `session_id`).
- [x] TASK-112: Hiện thực API Quarkus `POST /api/v1/auth/login`, `POST /api/v1/auth/select-tenant`, `POST /api/v1/auth/refresh`.
- [x] TASK-113: Tích hợp Redis lưu trữ Active Sessions và Blacklist Tokens khi đăng xuất.
- [x] TASK-114: Viết Unit Test Backend kiểm tra logic xác thực mật khẩu, JWT signing/verification, và brute-force lockout.
- [x] TASK-115: Xây dựng màn hình đăng nhập nhỏ gọn Angular 22 & Ionic 8 (thiết kế vuông vắn, form mật độ cao).
- [x] TASK-116: QA/QC thực hiện Browser Manual Testing các kịch bản login đúng, login sai, chọn tenant.
