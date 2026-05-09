# SCR-AUTH-007 — Đăng nhập

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-007 |
| Route | /login |
| Luồng liên quan | Xác thực người dùng |
| Mục tiêu | Xác thực email/mật khẩu trước khi vào hệ thống |

## 2. Layout và cấu trúc

- Card đăng nhập ở giữa màn hình.
- Field: email hoặc username, mật khẩu, ghi nhớ đăng nhập.
- Link quên mật khẩu, tùy chọn OAuth, link sang đăng ký.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| auth-card | Nội dung | centered | Max-width 400px |
| text-input | Form | required | Validate bắt buộc |
| btn-primary | Footer form | full width | Trigger login |
| oauth-button | Dưới divider | secondary | Redirect provider |

## 4. Trạng thái màn hình

- Loading submit.
- Sai thông tin đăng nhập.
- Tài khoản bị khóa hoặc tenant bị tạm ngưng.

## 5. Dữ liệu hiển thị

- `email`, `password`, `rememberMe`.
- Hiển thị thông báo theo `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Card giữa màn hình |
| <768px | Full-screen form, padding 24px |
