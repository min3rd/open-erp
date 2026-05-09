# SCR-AUTH-005 — Đăng ký DN: Kích hoạt thành công

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-005 |
| Route | /register/activation-success |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Xác nhận activation link hợp lệ và thông báo tiến trình khởi tạo tenant |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: thông điệp kích hoạt thành công.
- Vùng B: progress trạng thái khởi tạo tenant theo từng bước.
- Vùng C: thông tin mã tenant (nếu đã sẵn sàng).
- Vùng D: CTA vào Onboarding hoặc thử lại khi lỗi provisioning.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=768px | 12 cột | Card trung tâm span 6 cột, progress ngang | Max-width 640px, gap 16px |
| <768px | 4 cột | Card full width, progress dọc | Padding 16px, gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| activation-success-banner | Vùng A | success | activatedAt | Chỉ hiển thị khi token hợp lệ và chưa bị dùng lại |
| provisioning-stepper | Vùng B | processing, success, failed | tenantProvisioningSteps | Bước hoàn thành khóa trạng thái, không cho chỉnh |
| tenant-code-chip | Vùng C | visible, hidden | tenantCode | Chỉ hiện khi bước tạo tenant thành công |
| btn-go-onboarding | Vùng D | disabled, enabled | provisioningStatus | Enable khi provisioningStatus = SUCCESS |
| btn-retry-provision | Vùng D | text/secondary | retryAllowed | Chỉ hiện khi lỗi có thể thử lại |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Vào màn hình bằng token hợp lệ | Gọi API kiểm tra trạng thái provisioning | Hiển thị progress và polling nhẹ |
| Polling trả thành công | Dừng polling | Enable nút Vào Onboarding |
| Polling trả lỗi có thể recover | Cho phép retry provisioning | Hiển thị thông báo lỗi + nút Thử lại |
| Nhấn Vào Onboarding | Điều hướng /onboarding | Chuyển trang và giữ session onboarding |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Progress step chuyển trạng thái bằng fill animation 220ms.
- Banner thành công fade-in 180ms khi token hợp lệ.
- Khi lỗi provisioning, card lỗi xuất hiện từ dưới lên 160ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: token hợp lệ -> provisioning thành công -> sang SCR-AUTH-006.
- Validation error: token không hợp lệ không hiển thị màn này, điều hướng sang màn lỗi link.
- Expired: token hết hạn không vào được màn, hiển thị luồng yêu cầu gửi lại email kích hoạt.
- Locked: token đã dùng -> chặn truy cập lại, gợi ý đăng nhập hoặc resend.
- Permission: không áp dụng.
- Offline: polling gián đoạn -> hiển thị trạng thái chờ kết nối và tự thử lại theo backoff.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: registrationStatus, tenantProvisioningSteps, tenantCode.
- Mốc thời gian hiển thị theo timezone tenant/user.
- Nội dung lỗi phải dựa trên messageKey + metadata.
