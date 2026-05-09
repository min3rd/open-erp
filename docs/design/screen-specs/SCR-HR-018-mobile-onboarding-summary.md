# SCR-HR-018 — Mobile Onboarding Summary

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-018 |
| Route | /m/hr/onboarding |
| Luồng liên quan | FLOW-HR-S03-MOB-001 |
| Mục tiêu | Hiển thị checklist onboarding init của nhân viên mới và tiến độ hoàn thành |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: progress header onboarding.
- Vùng B: checklist item theo nhóm (Hồ sơ, Thiết bị, Tài khoản).
- Vùng C: support block liên hệ HR phụ trách.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| Mobile <=767px | 4 cột | Header + checklist dọc | Padding 16px, item gap 10px |
| Tablet 768-1023px | 8 cột | Checklist 2 cột | Padding 20px, gap 14px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| onboarding-progress-ring | Vùng A | loading, ready | progressPercent | Giá trị 0-100 |
| onboarding-checklist | Vùng B | list, empty | checklistItems[] | Chỉ dữ liệu của employee hiện tại |
| checklist-item-card | Vùng B | pending, in-progress, done | itemStatus, dueDate | Item do HR cập nhật trạng thái |
| hr-support-card | Vùng C | visible | hrContact | Luôn hiển thị khi có dữ liệu |
| empty-onboarding-state | Vùng B | visible | noDataReason | Hiện khi chưa khởi tạo onboarding |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Mở màn hình | Gọi API onboarding init summary | Hiển thị checklist và progress |
| Kéo để refresh | Reload trạng thái checklist | Cập nhật item mới nhất |
| Chạm item checklist | Mở detail readonly | Hiển thị mô tả và deadline |
| Không có onboarding | Render empty state | CTA liên hệ HR hỗ trợ |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Progress ring animate từ 0 đến giá trị hiện tại khi mở màn.
- Checklist item done đổi trạng thái bằng tick animation.
- Skeleton list trong lúc loading.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: nhân viên xem đầy đủ checklist onboarding và tiến độ.
- Permission: chỉ truy cập onboarding của chính user.
- No-data: chưa có onboarding init do offer chưa ACCEPTED.
- Offline: hiển thị dữ liệu cache + trạng thái chưa đồng bộ.
- Locked: onboarding đã hoàn tất, màn hình chỉ còn đọc.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: onboardingInitId, checklistItems[{title,status,dueDate,owner}], progressPercent, hrContact.
- Due date format dd/MM/yyyy.
- status dùng nhãn PENDING/IN_PROGRESS/DONE.
