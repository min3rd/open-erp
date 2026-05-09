# SCR-AUTH-011 — Đặt lại mật khẩu

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-011 |
| Route | /reset-password |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Cho phép người dùng đặt mật khẩu mới từ reset link |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: thông điệp bảo mật và trạng thái token reset.
- Vùng B: form mật khẩu mới + xác nhận mật khẩu.
- Vùng C: yêu cầu độ mạnh mật khẩu theo policy.
- Vùng D: CTA cập nhật mật khẩu.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Card căn giữa span 5 cột | Max-width 480px, gap 14px |
| <768px | 4 cột | Form full width | Padding 16px, gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| new-password-input | Vùng B | default, error, show/hide | newPassword | Bắt buộc theo policy bảo mật tenant |
| confirm-password-input | Vùng B | default, error | confirmPassword, newPassword | Phải khớp mật khẩu mới |
| password-strength-meter | Vùng C | weak, medium, strong | newPassword | Cập nhật theo thời gian thực |
| btn-reset-password | Vùng D | disabled, loading, enabled | formValidity, tokenValidity | Disable nếu token không hợp lệ hoặc form sai |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Mở trang với reset token | Gọi API validate token | Token hợp lệ: mở form; token lỗi: hiển thị trạng thái expired/invalid |
| Nhấn Cập nhật mật khẩu | Gọi API reset-password | Loading, thành công điều hướng /login kèm thông báo |
| Mật khẩu không đạt policy | Validate client-side | Hiển thị checklist lỗi theo tiêu chí chưa đạt |
| Token đã dùng/hết hạn | Chặn submit | Hiển thị CTA gửi lại reset link |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Password meter chuyển mức bằng transition 120ms.
- Checklist policy đổi màu theo từng tiêu chí đạt/chưa đạt.
- Thông báo thành công hiển thị toast ngắn trước khi redirect.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: token hợp lệ + mật khẩu đạt chuẩn -> cập nhật thành công -> /login.
- Validation error: mật khẩu yếu, xác nhận không khớp.
- Expired: token quá hạn -> hiển thị trạng thái hết hạn và CTA gửi lại email reset.
- Locked: tài khoản bị khóa bảo mật -> chặn reset và hướng dẫn liên hệ admin.
- Permission: không áp dụng.
- Offline: submit lỗi do mất mạng -> giữ dữ liệu, cho phép thử lại.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: resetToken, newPassword, confirmPassword, passwordPolicy.
- Tuyệt đối không log dữ liệu mật khẩu trong UI layer.
- Mọi thông điệp lỗi/thành công nhận từ messageKey + metadata.
