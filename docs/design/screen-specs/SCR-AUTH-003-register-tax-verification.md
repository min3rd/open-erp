# SCR-AUTH-003 — Đăng ký DN: Xác nhận thông tin MST

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-003 |
| Route | /register/tax-verification |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Cho người dùng xác nhận dữ liệu doanh nghiệp lấy từ hệ thống thuế trước khi gửi email kích hoạt |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: stepper đăng ký giữ ngữ cảnh bước 2/4.
- Vùng B: card thông tin pháp lý (tên pháp nhân, MST, địa chỉ, trạng thái thuế).
- Vùng C: khu vực bổ sung thông tin hiển thị nội bộ (tùy chọn).
- Vùng D: cảnh báo nếu dữ liệu thuế không đồng bộ.
- Vùng E: nút Quay lại và Xác nhận tiếp tục.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | Card pháp lý 8 cột, panel cảnh báo 4 cột | Section gap 24px, card padding 24px |
| 768px-1023px | 8 cột | Card pháp lý full width, cảnh báo dưới card | Section gap 20px |
| <768px | 4 cột | Các card xếp dọc, action cố định cuối màn hình | Padding ngang 16px, action gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| legal-data-card | Vùng B | loading, loaded, error | legalName, taxCode, address, taxStatus | Chỉ cho phép chỉnh trường bổ sung, không cho sửa dữ liệu thuế gốc |
| tax-status-badge | Vùng B | active, suspended, unknown | taxStatus | Màu badge map token semantic theo trạng thái thuế |
| optional-info-form | Vùng C | collapsed, expanded | displayName, contactPhone | Trường tùy chọn; không chặn luồng nếu bỏ trống |
| alert-sync | Vùng D | info, warning, error | sourceTimestamp | Hiện khi dữ liệu thuế cũ quá ngưỡng TTL cấu hình |
| btn-confirm-tax | Vùng E | enabled, loading, disabled | isDataAccepted | Chỉ enable sau khi người dùng tick xác nhận |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhấn Làm mới dữ liệu MST | Gọi API tra cứu lại thông tin thuế | Hiển thị loading skeleton cho legal-data-card |
| Tick xác nhận dữ liệu đúng | Cập nhật trạng thái xác nhận client-side | Enable nút Xác nhận tiếp tục |
| Nhấn Xác nhận tiếp tục | Gọi API khởi tạo activation link | Thành công điều hướng SCR-AUTH-004 |
| API trả MST không hợp lệ | Nhận messageKey lỗi nghiệp vụ | Hiển thị banner lỗi và CTA Quay lại bước trước |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Skeleton shimmer cho card pháp lý khi tải dữ liệu.
- Transition mở/đóng form tùy chọn 160ms.
- Hiệu ứng đổi màu badge trạng thái thuế không nhấp nháy.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: dữ liệu thuế hợp lệ -> xác nhận -> sang SCR-AUTH-004.
- Validation error: thiếu tick xác nhận dữ liệu trước khi gửi yêu cầu.
- Expired: dữ liệu thuế quá cũ -> cảnh báo yêu cầu làm mới.
- Locked: MST ở trạng thái ngừng hoạt động -> chặn tiếp tục, hiển thị hướng dẫn hỗ trợ.
- Permission: không áp dụng.
- No-data: không tìm thấy MST -> hiển thị trạng thái không có dữ liệu và CTA nhập lại.
- Offline: không kết nối được dịch vụ thuế -> fallback dữ liệu gần nhất + cảnh báo.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu cốt lõi: legalName, taxCode, address, taxStatus, sourceTimestamp.
- Ngày giờ đồng bộ hiển thị theo timezone tenant.
- Mọi lỗi nghiệp vụ phải render từ messageKey + metadata để đồng nhất i18n.
