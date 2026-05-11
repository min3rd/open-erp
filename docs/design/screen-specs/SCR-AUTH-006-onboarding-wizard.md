# SCR-AUTH-006 — Onboarding Wizard

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                |
| --------------- | ------------------------------------------------------ |
| Mã màn hình     | SCR-AUTH-006                                           |
| Route           | /onboarding                                            |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001                              |
| Mục tiêu        | Thiết lập tenant lần đầu sau khi activation thành công |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header onboarding hiển thị tên doanh nghiệp và tiến độ.
- Vùng B: stepper nội bộ 5 bước (gói dịch vụ, phòng ban, người dùng, thiết lập cơ bản, hoàn tất).
- Vùng C: nội dung từng bước dưới dạng form hoặc bảng.
- Vùng D: cụm action Lưu nháp, Bỏ qua bước (nếu cho phép), Tiếp tục/Hoàn tất.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint   | Grid   | Vị trí thành phần chính                               | Khoảng cách chính                    |
| ------------ | ------ | ----------------------------------------------------- | ------------------------------------ |
| >=1200px     | 12 cột | Stepper ngang toàn chiều rộng, nội dung form 8 cột    | Section gap 24px, panel padding 24px |
| 768px-1199px | 8 cột  | Stepper cuộn ngang, nội dung full width               | Section gap 20px                     |
| <768px       | 4 cột  | Stepper rút gọn + nội dung 1 cột, action cố định cuối | Padding 16px, action gap 8px         |

## 3. Đặc tả component

| Component          | Vị trí        | Variant/State              | Dữ liệu đầu vào       | Ràng buộc hiển thị                                     |
| ------------------ | ------------- | -------------------------- | --------------------- | ------------------------------------------------------ |
| onboarding-stepper | Vùng B        | active, done, skipped      | steps, currentStep    | Không cho quay về bước đã khóa bởi nghiệp vụ           |
| dynamic-list-input | Vùng C        | default, error             | items[]               | Mỗi item phải thỏa validate riêng (ví dụ email hợp lệ) |
| plan-selector      | Vùng C bước 1 | selected, recommended      | planList, currentPlan | Gói bị khóa theo subscription không cho chọn           |
| btn-save-draft     | Vùng D        | enabled, saving            | draftPayload          | Luôn hiển thị để giảm rủi ro mất dữ liệu               |
| btn-next-finish    | Vùng D        | disabled, loading, enabled | stepValidity          | Chỉ enable khi dữ liệu bước hiện tại hợp lệ            |

## 4. Hành động và phản hồi UI

| Trigger             | Xử lý                                    | Phản hồi UI                                    |
| ------------------- | ---------------------------------------- | ---------------------------------------------- |
| Nhấn Tiếp tục       | Validate bước hiện tại + lưu dữ liệu     | Chuyển bước kế tiếp, cập nhật tiến độ          |
| Nhấn Lưu nháp       | Gọi API lưu progress onboarding          | Toast thành công, giữ nguyên màn hình          |
| Nhấn Bỏ qua bước    | Kiểm tra bước có cho skip                | Đánh dấu skipped và chuyển bước                |
| Mất phiên đăng nhập | Refresh token hoặc yêu cầu đăng nhập lại | Modal phiên hết hạn, bảo toàn dữ liệu chưa gửi |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Chuyển bước có hiệu ứng slide ngang 200ms để giữ ngữ cảnh.
- Thêm/xóa item trong dynamic-list có animate chiều cao 140ms.
- Progress completion dùng ring animation một lần khi hoàn tất.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: hoàn thành đủ bước -> vào dashboard.
- Validation error: lỗi theo từng bước (thiếu dữ liệu bắt buộc, email sai, trùng phòng ban).
- Expired: phiên onboarding hết hạn -> yêu cầu đăng nhập lại và khôi phục nháp.
- Locked: tenant bị tạm khóa provisioning -> chỉ cho xem read-only.
- Permission: user không phải admin tenant không được chỉnh onboarding.
- No-data: chưa có dữ liệu khởi tạo -> hiển thị mẫu mặc định.
- Offline: cho phép chỉnh cục bộ, cảnh báo chưa đồng bộ và khóa hành động hoàn tất.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu dùng xuyên bước: tenantName, tenantCode, onboardingProgress, draftVersion.
- Quy tắc định dạng email, số điện thoại và mã phòng ban theo chuẩn SRS.
- Trạng thái lỗi/khuyến nghị nhận từ backend qua messageKey + metadata.
