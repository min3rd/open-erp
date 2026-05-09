# SCR-HR-015 — Mobile My HR Home

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-015 |
| Route | /m/hr/home |
| Luồng liên quan | FLOW-HR-S03-MOB-001 |
| Mục tiêu | Cung cấp điểm vào self-service HR trên mobile với các thẻ chức năng cốt lõi |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: header My HR + avatar.
- Vùng B: 3 card điều hướng Profile, Contracts, Onboarding.
- Vùng C: snapshot trạng thái nhanh (contract status, onboarding progress).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| Mobile <=767px | 4 cột | Card stack dọc toàn chiều ngang | Padding 16px, gap 12px |
| Tablet 768-1023px | 8 cột | Card 2 cột + snapshot bên dưới | Padding 20px, gap 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| my-hr-header | Vùng A | default | userProfile | Chỉ dữ liệu user hiện tại |
| feature-nav-cards | Vùng B | enabled, disabled | modules[] | Module unavailable hiển thị disabled |
| quick-summary-card | Vùng C | loading, ready, empty | summaryData | Chỉ tóm tắt non-sensitive |
| pull-to-refresh | Toàn trang | idle, refreshing | refreshState | Trigger reload toàn bộ |
| offline-banner | Top | hidden, visible | networkState | Hiện khi mất mạng |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Chạm card Profile | Điều hướng SCR-HR-016 | Mở màn profile basic |
| Chạm card Contracts | Điều hướng SCR-HR-017 | Mở contract summary |
| Chạm card Onboarding | Điều hướng SCR-HR-018 | Mở onboarding summary |
| Kéo để refresh | Gọi API summary | Cập nhật dữ liệu và timestamp |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Card xuất hiện staggered khi vào màn hình.
- Pull-to-refresh có progress indicator native.
- Card nhấn có feedback scale nhẹ.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: điều hướng nhanh đến 3 màn chính và xem snapshot.
- Permission: nếu thiếu quyền module thì card disabled.
- No-data: chưa có hợp đồng/onboarding hiển thị trạng thái trống.
- Offline: hiển thị snapshot cache và banner offline.
- Locked: tài khoản bị vô hiệu hóa sẽ điều hướng logout.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: employeeName, employeeCode, contractStatus, onboardingProgress.
- Progress hiển thị phần trăm 0-100.
- Thời điểm đồng bộ cuối hiển thị HH:mm dd/MM.
