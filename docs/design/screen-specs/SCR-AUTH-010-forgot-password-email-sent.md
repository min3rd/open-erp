# SCR-AUTH-010 — Quên mật khẩu: Đã gửi email

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-010 |
| Route | /forgot-password/sent |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Thông báo reset email đã gửi thành công |

## 2. Layout và cấu trúc

- State card thành công + email đã che một phần.
- Hướng dẫn kiểm tra inbox/spam.
- Nút gửi lại có cooldown.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| state-card | Nội dung | success | Hiển thị kết quả gửi mail |
| countdown-resend | Nội dung phụ | text + timer | Mở gửi lại khi hết thời gian |
| btn-secondary | Footer | default | Quay về đăng nhập |

## 4. Trạng thái màn hình

- Cooldown gửi lại.
- Gửi lại thành công.
- Vượt giới hạn gửi lại.

## 5. Dữ liệu hiển thị

- `maskedEmail`, `resendCooldownSeconds`.
- Thông báo backend theo `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Card 480-560px |
| <768px | Full width, nút full-width |
