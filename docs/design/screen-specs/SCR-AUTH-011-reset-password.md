# SCR-AUTH-011 — Đặt lại mật khẩu

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-011 |
| Route | /reset-password |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Cho phép người dùng đặt mật khẩu mới từ reset link |

## 2. Layout và cấu trúc

- Card form gồm mật khẩu mới + xác nhận mật khẩu.
- Hiển thị yêu cầu chính sách mật khẩu.
- CTA đặt lại và thông báo thành công.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| password-input | Form | required | Meter độ mạnh mật khẩu |
| confirm-password-input | Form | required | So khớp mật khẩu mới |
| btn-primary | Footer form | default | Submit reset password |

## 4. Trạng thái màn hình

- Token không hợp lệ/hết hạn.
- Validation lỗi mật khẩu.
- Thành công: tự động redirect login sau 3 giây.

## 5. Dữ liệu hiển thị

- `resetToken`, `newPassword`, `confirmPassword`.
- Lỗi nghiệp vụ hiển thị bằng `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Form giữa màn hình |
| <768px | Form full width, spacing 16px |
