# SCR-HR-008 — Offer Tracking & Onboarding Init

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-008                                                                                      |
| Route           | /hr/recruitment/offers/:id                                                                      |
| Luồng liên quan | FLOW-HR-S03-REC-001                                                                             |
| Mục tiêu        | Theo dõi phản hồi offer và hiển thị kết quả khởi tạo onboarding init sau khi candidate ACCEPTED |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: trạng thái offer timeline (SENT/ACCEPTED/REJECTED/EXPIRED).
- Vùng B: chi tiết offer đã gửi.
- Vùng C: onboarding init summary panel (chỉ hiện khi ACCEPTED).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính      | Khoảng cách chính |
| ---------- | ------ | ---------------------------- | ----------------- |
| >=1024px   | 12 cột | B:7 cột, C:5 cột             | Gap 16px          |
| <1024px    | 4 cột  | C hiển thị dưới B theo block | Gap 12px          |

## 3. Đặc tả component

| Component               | Vị trí | Variant/State                     | Dữ liệu đầu vào   | Ràng buộc hiển thị             |
| ----------------------- | ------ | --------------------------------- | ----------------- | ------------------------------ |
| offer-status-timeline   | Vùng A | sent, accepted, rejected, expired | statusEvents[]    | Sắp xếp theo thời gian         |
| offer-detail-card       | Vùng B | readonly                          | offerDetail       | Không chỉnh sửa khi đã gửi     |
| onboarding-init-panel   | Vùng C | hidden, loading, ready, error     | onboardingSummary | Chỉ hiện khi status = ACCEPTED |
| retry-onboarding-button | Vùng C | enabled, loading                  | idempotencyState  | Chỉ role có quyền mới thấy     |
| expiration-countdown    | Vùng A | active, expired                   | expiresAt         | Đếm ngược theo realtime        |

## 4. Hành động và phản hồi UI

| Trigger                     | Xử lý                                           | Phản hồi UI                       |
| --------------------------- | ----------------------------------------------- | --------------------------------- |
| Candidate phản hồi offer    | Polling hoặc websocket cập nhật trạng thái      | Timeline cập nhật tức thì         |
| Trạng thái ACCEPTED         | Gọi quy trình tạo employee/user/onboarding init | Hiển thị panel onboarding summary |
| Quy trình init lỗi tạm thời | Cho phép retry với idempotency key              | Toast kết quả retry               |
| Offer quá hạn               | Tự động chuyển EXPIRED                          | Khóa action liên quan accept      |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Timeline event mới xuất hiện bằng slide-fade 120ms.
- Countdown đổi màu khi còn dưới 24 giờ.
- Panel onboarding mở bằng expand animation 180ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: candidate ACCEPTED, tạo employee/user/onboarding init thành công.
- Validation error: callback phản hồi thiếu idempotency key.
- Expired: offer hết hạn sau 7 ngày, không cho accept.
- Locked: callback accept trùng bị chặn theo rule một lần hợp lệ.
- Permission: người dùng không thuộc HR chỉ xem read-only.
- No-data: offer không tồn tại hoặc không thuộc tenant.
- Offline: hiển thị trạng thái cuối cùng đã đồng bộ, tự retry nền khi online.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: offerId, status, sentAt, expiresAt, decisionAt, employeeId, onboardingInitId.
- Countdown hiển thị theo giờ/phút.
- Event timeline dùng timezone tenant.
