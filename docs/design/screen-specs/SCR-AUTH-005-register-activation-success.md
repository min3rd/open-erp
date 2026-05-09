# SCR-AUTH-005 — Đăng ký DN: Kích hoạt thành công

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-005 |
| Route | /register/activation-success |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Xác nhận activation link hợp lệ và thông báo khởi tạo tenant |

## 2. Layout và cấu trúc

- Thông điệp thành công, icon check, trạng thái tiến trình khởi tạo tenant.
- Thanh tiến trình hoặc trạng thái tuần tự: tạo tenant, tạo admin user, seed role.
- CTA: “Tiếp tục vào Onboarding”.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| success-state-card | Trung tâm | success | Nhấn mạnh đăng ký hợp lệ |
| progress-indicator | Nội dung | animated | Hiển thị tiến trình hậu kích hoạt |
| btn-primary | Footer card | default | Điều hướng SCR-AUTH-006 |

## 4. Trạng thái màn hình

- Processing: đang khởi tạo tenant.
- Success: hiện CTA vào onboarding.
- Failed: lỗi hệ thống, cho phép thử lại hoặc liên hệ hỗ trợ.

## 5. Dữ liệu hiển thị

- `registrationStatus`, `tenantProvisioningSteps`, `tenantCode` (nếu có).
- Thông điệp lỗi lấy theo `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Card giữa màn hình, progress ngang |
| <768px | Progress dọc, CTA full width |
