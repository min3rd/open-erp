# SCR-AUTH-010 — Quên mật khẩu: Đã gửi email

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-010 |
| Route | /forgot-password/sent |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Thông báo reset email đã gửi thành công |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: trạng thái gửi thành công và thông điệp chính.
- Vùng B: email đã được ẩn bớt.
- Vùng C: hướng dẫn kiểm tra inbox/spam.
- Vùng D: gửi lại email reset với cooldown.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Card căn giữa, span 5 cột | Max-width 520px, gap 12px |
| <768px | 4 cột | Card full width | Padding 16px, gap 10px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| state-card | Vùng A | success, info | stateTitle, stateMessage | Nội dung không tiết lộ thông tin bảo mật |
| masked-email-text | Vùng B | body-md | maskedEmail | Che local-part theo chuẩn bảo mật |
| resend-link | Vùng D | disabled, enabled, exhausted | resendCooldownSeconds, resendLimitLeft | Khóa khi cooldown > 0 hoặc hết lượt |
| btn-back-login | Vùng D | secondary | route | Luôn hiển thị |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhấn Gửi lại email khi được phép | Gọi API resend reset-link | Toast thành công, reset cooldown |
| Nhấn Gửi lại khi đang cooldown | Không gọi API | Hiển thị đếm ngược thời gian còn lại |
| Nhấn Quay lại đăng nhập | Điều hướng /login | Chuyển trang tức thì |
| API trả quá giới hạn gửi lại | Nhận messageKey limit | Hiển thị cảnh báo và khóa nút |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- State-card hiện bằng fade + scale nhẹ 180ms.
- Bộ đếm cooldown cập nhật theo giây, không nhảy layout.
- Toast dạng slide-up 200ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: email gửi thành công, người dùng mở link trong hộp thư.
- Validation error: không áp dụng cho form nhập.
- Expired: reset link hết hạn xử lý ở SCR-AUTH-011.
- Locked: vượt ngưỡng resend -> khóa gửi lại trong cửa sổ cấu hình.
- Permission: không áp dụng.
- Offline: resend thất bại do mất mạng -> cho thử lại khi có kết nối.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: maskedEmail, resendCooldownSeconds, resendLimitLeft.
- Định dạng countdown theo mm:ss.
- Thông điệp hiển thị từ messageKey + metadata.
