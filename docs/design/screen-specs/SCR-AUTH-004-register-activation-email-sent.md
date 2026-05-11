# SCR-AUTH-004 — Đăng ký DN: Đã gửi email kích hoạt

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| Mã màn hình     | SCR-AUTH-004                                                             |
| Route           | /register/activation-sent                                                |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001                                                |
| Mục tiêu        | Xác nhận hệ thống đã gửi activation link và hướng dẫn thao tác tiếp theo |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: trạng thái thành công với minh họa và tiêu đề.
- Vùng B: email đã ẩn bớt ký tự + hướng dẫn kiểm tra inbox/spam.
- Vùng C: hành động chính Mở ứng dụng email.
- Vùng D: hành động phụ Gửi lại email (có cooldown).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính              | Khoảng cách chính                              |
| ---------- | ------ | ------------------------------------ | ---------------------------------------------- |
| >=768px    | 12 cột | Card trạng thái căn giữa, span 6 cột | Max-width 560px, padding 32px, action gap 12px |
| <768px     | 4 cột  | Card full width, action stack dọc    | Padding ngang 16px, action gap 8px             |

## 3. Đặc tả component

| Component           | Vị trí | Variant/State                | Dữ liệu đầu vào                          | Ràng buộc hiển thị                                            |
| ------------------- | ------ | ---------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| status-illustration | Vùng A | success, info                | illustrationKey                          | Dùng minh họa tĩnh khi giảm chuyển động hệ điều hành bật      |
| masked-email-text   | Vùng B | body-md                      | maskedEmail                              | Bắt buộc che thông tin cá nhân: ẩn ít nhất 60% local-part     |
| btn-open-mail       | Vùng C | primary                      | deepLinkMailClient                       | Nếu không mở được mail client thì hiển thị hướng dẫn thủ công |
| resend-link         | Vùng D | disabled, enabled, exhausted | resendCooldownSeconds, resendAttemptLeft | Chỉ enable khi cooldown = 0 và còn lượt gửi                   |
| resend-counter      | Vùng D | info, warning                | resendAttemptLeft                        | Hiển thị rõ số lượt gửi còn lại trong 24h                     |

## 4. Hành động và phản hồi UI

| Trigger                             | Xử lý                           | Phản hồi UI                                                     |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| Nhấn Mở ứng dụng email              | Gọi mailto/deep link            | Nếu thành công mở client; nếu thất bại hiển thị toast hướng dẫn |
| Nhấn Gửi lại email khi đủ điều kiện | Gọi API resend activation       | Link về trạng thái cooldown, hiển thị toast thành công          |
| Nhấn Gửi lại email khi hết lượt     | Không gọi API                   | Hiển thị cảnh báo giới hạn 3 lần/24h                            |
| Hết thời gian cooldown              | Cập nhật trạng thái local timer | Kích hoạt lại link Gửi lại email                                |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Animation check success xuất hiện 1 lần khi vào màn hình (240ms).
- Đồng hồ cooldown cập nhật theo giây, không giật layout.
- Toast xuất hiện/biến mất kiểu slide-fade 200ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: nhận email -> mở link kích hoạt -> SCR-AUTH-005.
- Validation error: không áp dụng form nhập liệu.
- Expired: link kích hoạt trong email hết hạn sẽ được xử lý ở màn lỗi/flow tiếp theo.
- Locked: vượt giới hạn gửi lại -> khóa hành động resend trong cửa sổ 24h.
- Permission: không áp dụng.
- Offline: thao tác resend thất bại do mất mạng -> giữ countdown cũ và cho thử lại.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu bắt buộc: maskedEmail, resendCooldownSeconds, resendAttemptLeft.
- Cooldown hiển thị định dạng mm:ss.
- Thông điệp backend tuân thủ messageKey + metadata contract.
