# SCR-SA-007 — Tenant Settings

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-007 |
| Route | /settings/tenant |
| Luồng liên quan | Cấu hình tenant |
| Mục tiêu | Quản lý thông tin doanh nghiệp, bảo mật, gói dịch vụ |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: tab điều hướng cài đặt (Thông tin DN, Bảo mật, Thông báo, Gói dịch vụ).
- Vùng B: form cấu hình theo tab đang chọn.
- Vùng C: thông tin trạng thái gói và giới hạn.
- Vùng D: thanh hành động lưu thay đổi.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | Tab ngang, form 2 cột | Section gap 20px, field gap 16px |
| <1024px | 8/4 cột | Tab dọc/accordion, form 1 cột | Padding 16px, action sticky |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| settings-tab-group | Vùng A | active, disabled | tabs[], currentTab | Tab bị khóa theo plan hiển thị disabled |
| tenant-profile-form | Vùng B | default, error, readonly | companyProfile | Một số trường pháp lý chỉ đọc |
| security-policy-form | Vùng B | editable, readonly | securityPolicy | Chỉ role đủ quyền mới chỉnh được |
| subscription-panel | Vùng C | normal, warning | planInfo, usage | Hiển thị cảnh báo khi gần chạm quota |
| save-settings-button | Vùng D | disabled, loading, enabled | hasChanges, formValidity | Chỉ enable khi có thay đổi hợp lệ |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Chuyển tab khi có thay đổi chưa lưu | Kiểm tra dirty state | Hiển thị modal xác nhận |
| Nhấn Lưu | Gọi API cập nhật theo tab | Toast kết quả và đồng bộ dữ liệu mới |
| Upload logo mới | Validate định dạng/kích thước | Preview ảnh ngay; lỗi nếu vượt giới hạn |
| API trả quota exceeded | Nhận metadata quota | Hiển thị cảnh báo tại subscription-panel |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Chuyển tab có fade 120ms.
- Preview logo cập nhật tức thời với skeleton ngắn.
- Save button loading không đổi kích thước.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: chỉnh cấu hình hợp lệ và lưu thành công.
- Validation error: dữ liệu không hợp lệ theo từng tab.
- Expired: phiên hết hạn lúc lưu.
- Locked: tenant ở trạng thái khóa thanh toán -> khóa một số cấu hình.
- Permission: role không đủ quyền -> tab/field readonly.
- No-data: tenant thiếu dữ liệu hồ sơ -> hiển thị gợi ý bổ sung.
- Offline: lưu thất bại do mất mạng, giữ thay đổi local.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: companyProfile, securityPolicy, notificationPolicy, subscription.
- Locale/timezone mặc định phải hiển thị theo chuẩn i18n đã cấu hình.
- Lỗi map theo messageKey + metadata.field.
