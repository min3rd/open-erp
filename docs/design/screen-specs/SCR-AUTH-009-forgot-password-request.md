# SCR-AUTH-009 — Quên mật khẩu: Nhập email

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-009 |
| Route | /forgot-password |
| Luồng liên quan | Đặt lại mật khẩu |
| Mục tiêu | Nhận email người dùng để gửi reset link |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: tiêu đề và mô tả ngắn về quy trình đặt lại mật khẩu.
- Vùng B: form nhập email.
- Vùng C: hành động Gửi liên kết đặt lại mật khẩu.
- Vùng D: liên kết quay về đăng nhập.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Card căn giữa, span 4-5 cột | Max-width 420px, gap 16px |
| <768px | 4 cột | Form full width | Padding ngang 16px, gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| text-input-email | Vùng B | default, error, disabled | email | Bắt buộc email hợp lệ trước submit |
| btn-send-reset-link | Vùng C | disabled, loading, enabled | formValidity | Chỉ enable khi email hợp lệ |
| info-note | Vùng A | info | policyText | Không tiết lộ email có tồn tại hay không |
| link-back-login | Vùng D | text-link | targetRoute | Luôn hiển thị |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhập email và blur | Validate định dạng | Lỗi inline nếu không hợp lệ |
| Nhấn Gửi liên kết | Gọi API forgot-password | Loading, thành công chuyển SCR-AUTH-010 |
| API trả rate limit | Nhận thời gian chờ | Hiển thị cảnh báo và khóa submit tạm thời |
| Nhấn Quay lại đăng nhập | Điều hướng /login | Chuyển trang tức thì |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Card xuất hiện bằng fade-in 160ms.
- Nút submit loading với spinner trung tâm.
- Lỗi nhập liệu có chuyển màu viền mượt 120ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: gửi yêu cầu thành công -> SCR-AUTH-010.
- Validation error: email sai định dạng hoặc để trống.
- Expired: không áp dụng.
- Locked: tạm khóa gửi yêu cầu khi vượt ngưỡng rate-limit.
- Permission: không áp dụng.
- Offline: mất mạng khi submit -> giữ email và cho gửi lại.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: email, rateLimitWindow.
- Thông điệp phải trung lập bảo mật, không phân biệt email tồn tại/không tồn tại.
- Nội dung phản hồi dùng messageKey + metadata.
