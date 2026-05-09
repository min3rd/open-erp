# SCR-AUTH-008 — MFA

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-008 |
| Route | /login/mfa |
| Luồng liên quan | Đăng nhập có MFA |
| Mục tiêu | Xác thực yếu tố thứ hai trước khi cấp phiên |

## 2. Layout và cấu trúc

- Card MFA cùng layout với màn hình đăng nhập.
- OTP input 6 ký tự và tùy chọn backup code.
- CTA xác nhận, link quay lại đăng nhập.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| otp-input-6 | Form | segmented | Auto focus và paste toàn bộ |
| btn-primary | Footer | full width | Verify OTP |
| link backup-code | Dưới OTP | text link | Mở modal nhập mã dự phòng |

## 4. Trạng thái màn hình

- OTP sai: báo lỗi và highlight toàn bộ ô.
- Quá số lần thử: bắt buộc quay lại bước đăng nhập.
- Loading verify.

## 5. Dữ liệu hiển thị

- `sessionToken`, `otpCode`, `attemptLeft`.
- Thông báo từ backend qua `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=768px | OTP ở giữa card |
| <768px | Bàn phím số ưu tiên, spacing 12px giữa ô |
