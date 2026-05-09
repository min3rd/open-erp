# SCR-AUTH-007 — Đăng nhập

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-007 |
| Route | /login |
| Luồng liên quan | Xác thực tài khoản |
| Mục tiêu | Xác thực email/mật khẩu trước khi vào hệ thống |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: logo + thông điệp ngắn về bảo mật.
- Vùng B: auth-card chứa form email, mật khẩu, remember me, quên mật khẩu.
- Vùng C: nhóm nút OAuth (nếu cấu hình bật).
- Vùng D: liên kết sang đăng ký doanh nghiệp.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Auth-card căn giữa, span 4-5 cột | Max-width 420px, card padding 28px, field gap 16px |
| <768px | 4 cột | Form full-screen, action full width | Padding ngang 16px, field gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| text-input-email | Vùng B | default, error, disabled | email | Email bắt buộc, trim và lowercase trước submit |
| password-input | Vùng B | hidden, visible, error | password | Không hiển thị plain text mặc định |
| remember-me-checkbox | Vùng B | checked, unchecked | rememberMe | Chỉ ghi nhớ thiết bị khi người dùng tự chọn |
| btn-login | Vùng B | disabled, loading, enabled | formValidity | Disable khi thiếu email hoặc mật khẩu |
| oauth-button-group | Vùng C | enabled, disabled | providers[] | Ẩn toàn bộ nếu tenant không bật social login |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhấn Đăng nhập | Gọi API authenticate | Nút loading, khóa form, thành công điều hướng dashboard/MFA |
| Sai thông tin đăng nhập | API trả lỗi nghiệp vụ | Hiển thị thông báo lỗi ở đầu form và đánh dấu trường liên quan |
| Nhấn Quên mật khẩu | Điều hướng /forgot-password | Chuyển trang giữ email đã nhập (nếu có) |
| Nhấn OAuth provider | Redirect sang provider | Hiển thị trạng thái chuyển hướng và khóa submit local |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Auth-card fade-in nhẹ 180ms khi vào trang.
- Trường lỗi có shake 160ms để tăng nhận biết.
- Nút loading dùng spinner chuẩn, không làm đổi kích thước nút.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: đăng nhập đúng -> nếu bật MFA chuyển SCR-AUTH-008, nếu không vào hệ thống.
- Validation error: email sai định dạng, thiếu mật khẩu.
- Expired: phiên xác thực cũ hết hạn thì yêu cầu đăng nhập lại với thông báo rõ nguyên nhân.
- Locked: tài khoản hoặc tenant bị khóa -> hiển thị thông báo và chặn submit tiếp.
- Permission: user không có quyền vào tenant hiện tại -> chuyển màn thông báo từ chối truy cập.
- Offline: không kết nối API -> banner mất mạng và cho thử lại.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: email, password, rememberMe, availableProviders.
- Toàn bộ lỗi hiển thị từ messageKey + metadata để hỗ trợ i18n.
- Không log hoặc hiển thị mật khẩu ở bất kỳ trạng thái nào.
