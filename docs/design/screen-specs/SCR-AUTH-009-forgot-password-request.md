# SCR-AUTH-009 — Quên mật khẩu: Nhập email

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-009 |
| Route | /forgot-password |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Nhận email người dùng để gửi reset link |

## 2. Layout và cấu trúc

- Card đơn gồm icon, tiêu đề, mô tả, input email và CTA.
- Link quay lại đăng nhập.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| text-input email | Form | required | Validate email hợp lệ |
| btn-primary | Footer form | default | Gửi yêu cầu reset |
| link-back | Dưới form | text link | Điều hướng /login |

## 4. Trạng thái màn hình

- Default.
- Invalid email.
- Submit thành công chuyển SCR-AUTH-010.

## 5. Dữ liệu hiển thị

- `email`.
- Message phản hồi dùng `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Card giữa màn hình |
| <768px | Form full width |
