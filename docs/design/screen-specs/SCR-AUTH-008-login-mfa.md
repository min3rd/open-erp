# SCR-AUTH-008 — MFA

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-008 |
| Route | /login/mfa |
| Luồng liên quan | Đăng nhập có MFA |
| Mục tiêu | Xác thực yếu tố thứ hai trước khi cấp phiên |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: tiêu đề xác thực 2 bước và hướng dẫn nhập mã.
- Vùng B: cụm OTP 6 ô + timer mã.
- Vùng C: hành động xác nhận, gửi lại mã, dùng backup code.
- Vùng D: liên kết quay về đăng nhập.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Card MFA căn giữa, OTP nằm giữa card | Max-width 420px, gap 14px |
| <768px | 4 cột | OTP full width, ưu tiên bàn phím số | Padding ngang 16px, gap 10px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| otp-input-6 | Vùng B | default, error, disabled | otpCode | Chỉ nhận ký tự số, auto-focus và hỗ trợ paste 6 ký tự |
| timer-text | Vùng B | active, expired | secondsLeft | Hết hạn thì đổi trạng thái expired và enable gửi lại |
| btn-verify-otp | Vùng C | disabled, loading, enabled | otpComplete | Chỉ enable khi đủ 6 ký tự |
| btn-resend-otp | Vùng C | disabled, enabled | resendAllowed | Có cooldown theo chính sách bảo mật |
| backup-code-modal | Vùng C | closed, open, error | backupCode | Mỗi backup code chỉ dùng 1 lần |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhập đủ 6 số OTP | Validate client-side | Enable nút Xác nhận |
| Nhấn Xác nhận | Gọi API verify MFA | Loading, thành công cấp phiên và vào hệ thống |
| OTP sai | Backend trả attemptLeft | Hiển thị lỗi + số lần thử còn lại |
| Hết hạn OTP và nhấn Gửi lại | Gọi API resend OTP | Reset timer, toast thông báo mã mới đã gửi |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Di chuyển focus giữa các ô OTP mượt 100ms.
- Khi lỗi OTP, toàn bộ cụm OTP đổi viền lỗi và rung nhẹ 1 lần.
- Timer giảm dần theo giây, chuyển màu cảnh báo ở ngưỡng 10 giây.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: OTP đúng trong thời hạn -> cấp phiên thành công.
- Validation error: nhập thiếu hoặc sai định dạng OTP.
- Expired: OTP hết hạn -> yêu cầu gửi lại mã.
- Locked: vượt quá số lần thử -> khóa phiên MFA, yêu cầu quay lại đăng nhập.
- Permission: không áp dụng.
- Offline: verify OTP thất bại do mạng -> giữ mã đã nhập và cho thử lại.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: sessionToken, otpCode, secondsLeft, attemptLeft.
- Thông điệp lỗi và trạng thái timer map qua messageKey + metadata.
- Không hiển thị đầy đủ số điện thoại/email nhận mã nếu có thông tin nhạy cảm.
