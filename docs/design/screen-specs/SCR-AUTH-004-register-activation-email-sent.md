# SCR-AUTH-004 — Đăng ký DN: Đã gửi email kích hoạt

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-004 |
| Route | /register/activation-sent |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Xác nhận hệ thống đã gửi activation link và hướng dẫn thao tác tiếp theo |

## 2. Layout và cấu trúc

- Icon trạng thái + tiêu đề “Kiểm tra hộp thư của bạn”.
- Hiển thị email đã được che một phần.
- Hướng dẫn 3 bước kích hoạt qua link.
- CTA: Mở ứng dụng email, Gửi lại email, Đổi email.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| status-illustration | Header card | success/info | Tạo cảm giác hoàn tất bước gửi mail |
| masked-email | Nội dung | body-md | Hiển thị dạng m***@domain.com |
| btn-secondary | Hành động | default | Mở mail client |
| link resend | Hành động phụ | cooldown | Chỉ bật sau 60 giây |

## 4. Trạng thái màn hình

- Cooldown: khóa nút gửi lại.
- Resend success: hiển thị toast xác nhận.
- Resend limit reached: cảnh báo tối đa 3 lần/24h.

## 5. Dữ liệu hiển thị

- `maskedEmail`, `resendCooldownSeconds`, `resendAttemptLeft`.
- Message hiển thị từ backend theo `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | Card canh giữa, max-width 560px |
| <768px | Full width với padding 16px |
