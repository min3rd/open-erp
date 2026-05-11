# SCR-AUTH-002 — Đăng ký DN: Nhập thông tin ban đầu

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                              |
| --------------- | -------------------------------------------------------------------- |
| Mã màn hình     | SCR-AUTH-002                                                         |
| Route           | /register                                                            |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001                                            |
| Mục tiêu        | Thu thập MST, email đăng ký, mật khẩu ban đầu để tạo yêu cầu đăng ký |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header tối giản chứa logo và liên kết đăng nhập.
- Vùng B: stepper tiến trình đăng ký 4 bước.
- Vùng C: card form gồm MST, email, mật khẩu, xác nhận mật khẩu.
- Vùng D: vùng thông tin pháp lý và chính sách bảo mật.
- Vùng E: cụm nút Quay lại và Tiếp theo.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint   | Grid   | Vị trí thành phần chính             | Khoảng cách chính                                  |
| ------------ | ------ | ----------------------------------- | -------------------------------------------------- |
| >=1024px     | 12 cột | Form card giữa màn hình, span 6 cột | Max-width 560px, field gap 16px, card padding 32px |
| 768px-1023px | 8 cột  | Form span 6 cột, stepper rút gọn    | Card padding 24px, section gap 20px                |
| <768px       | 4 cột  | Form full width, stepper cuộn ngang | Padding ngang 16px, field gap 12px                 |

## 3. Đặc tả component

| Component              | Vị trí | Variant/State              | Dữ liệu đầu vào           | Ràng buộc hiển thị                                              |
| ---------------------- | ------ | -------------------------- | ------------------------- | --------------------------------------------------------------- |
| stepper-register       | Vùng B | active, done, upcoming     | currentStep, totalSteps   | Chỉ cho phép đi tiếp, không cho nhảy bước trực tiếp             |
| text-input-tax-code    | Vùng C | default, error, disabled   | taxCode                   | Chỉ nhận 10 hoặc 13 chữ số, chặn ký tự không phải số            |
| text-input-email       | Vùng C | default, error, disabled   | email                     | Validate RFC cơ bản, trim khoảng trắng đầu/cuối                 |
| password-input         | Vùng C | default, error, show/hide  | password                  | Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt |
| confirm-password-input | Vùng C | default, error             | confirmPassword, password | Phải khớp password trước khi enable nút Tiếp theo               |
| btn-next               | Vùng E | disabled, loading, enabled | formValidity              | Chỉ enable khi toàn bộ field hợp lệ                             |

## 4. Hành động và phản hồi UI

| Trigger            | Xử lý                                          | Phản hồi UI                                                            |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Nhập MST           | Validate client-side theo độ dài và kiểu ký tự | Hiển thị lỗi inline ngay dưới trường nếu sai                           |
| Blur trường Email  | Kiểm tra định dạng và trùng cơ bản             | Báo lỗi định dạng hoặc thông điệp đã tồn tại (nếu có)                  |
| Nhấn Tiếp theo     | Gọi API tạo yêu cầu xác minh MST               | Nút chuyển loading, khóa form, thành công điều hướng sang SCR-AUTH-003 |
| API trả rate limit | Nhận messageKey và metadata thời gian chờ      | Banner cảnh báo + đếm ngược trước khi cho gửi lại                      |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Focus input có hiệu ứng viền trạng thái 120ms.
- Chuyển trạng thái stepper dùng transition màu 180ms.
- Lỗi validate rung nhẹ trường lỗi 1 lần (horizontal shake 180ms).
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: nhập hợp lệ -> Tiếp theo -> SCR-AUTH-003.
- Validation error: MST sai định dạng, email sai định dạng, mật khẩu yếu, xác nhận mật khẩu không khớp.
- Expired: không áp dụng ở bước này.
- Locked: nếu email bị khóa đăng ký tạm thời, hiển thị thông báo chờ theo metadata.
- Permission: không áp dụng cho người dùng chưa đăng nhập.
- Offline: không gọi API được thì hiện banner mất kết nối, giữ dữ liệu form local.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: taxCode, email, password, confirmPassword.
- Thông báo backend bắt buộc map qua messageKey + metadata để FE i18n.
- Email hiển thị dạng lowercase khi submit; MST giữ nguyên chuỗi số gốc.
