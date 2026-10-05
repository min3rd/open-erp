# BUG-98: Thiếu Notification Bell trên TopBar, banner toàn cục và banner Dashboard Mobile

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-98 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Done (2026-10-05 — code + build PASS; chờ QA browser xác nhận) |
| **Liên quan** | DES-03-UI mục 4.4 và mục 6, TASK-311, TASK-316, TASK-319 |

## Kết quả triển khai (2026-10-05)

Rút khỏi danh sách hoãn; làm luôn trong Sprint 03.

1. **Shared `notification-bell`** (`src/frontend/shared/components/notification-bell/`) — chuông + badge số chưa đọc, popup danh sách (đóng bằng click ngoài/Escape theo mẫu `user-menu`), output `markRead`/`markAllRead`/`openDetail`; **presentational, không inject HTTP** nên dùng chung Web + Mobile.
2. **Shared `notification-banner`** (`.../notification-banner/`) — chỉ hiện khi có item chưa đọc `WARNING`/`CRITICAL`; màu amber cho WARNING, đỏ cho CRITICAL; có `dismissible`.
3. **Enum dùng chung** `NotificationSeverity` (`shared/enums/notification.enum.ts`) thay cho string literal (theo rule 15).
4. **Web**: `TopbarComponent` (shared) nhận notifications + phát sự kiện mark-read; `dashboard` + `settings-layout` tải qua `PluginService.notifications()`, gắn bell cạnh user-menu, render banner phía trên nội dung.
5. **Mobile**: `dashboard.page` tải `notifications(true)` khi init, render banner + nút chuông trên header điều hướng tới `/settings/plugins`.
6. **i18n**: thêm 7 key `NOTIFICATION_*` vào **cả 4** từ điển (web/mobile × vi/en); parity **884/884 (web) · 475/475 (mobile)**, 0 lệch.

**Kiểm chứng**: `ng build` Web **PASS**, Mobile **PASS** (0 error). QA browser dual-mode cho bell/banner nên chạy lại trong đợt nghiệm thu cuối.

**Ghi nhận**: mobile dùng nút chuông điều hướng (không dùng popup) để tránh phình layout mobile; endpoint thông báo chỉ yêu cầu đăng nhập nên bell hiện cho mọi user đã đăng nhập.

## Mô tả

- DES-03-UI mục 4.4: **Bell trên TopBar** (shared `TopBar`) + danh sách thông báo dạng Drawer; **Banner toàn cục** trên mọi màn khi tenant bị ảnh hưởng bởi plugin bị khóa (amber/red + nút "Xem chi tiết").
- DES-03-UI mục 6: Mobile hiển thị **banner plugin bị khóa/cập nhật trên Dashboard**.

Implementation hiện tại: danh sách thông báo + banner nằm **trong** trang `/settings/plugins` (Web) và banner trong `/settings/plugins` (Mobile); **chưa có bell trên TopBar**, chưa có banner toàn cục, chưa có banner trên Dashboard Mobile.

## Workaround

Người dùng vào `/settings/plugins` để xem thông báo và trạng thái khóa — không mất dữ liệu, không chặn nghiệp vụ cài/gỡ.

## Hướng xử lý đã thực hiện

1. Đã tạo shared `notification-bell` (đọc T12/T13) + slot trên shared `TopBar`.
2. Đã tạo shared `notification-banner` toàn cục trong layout tenant khi có unread severity ≥ WARNING.
3. Mobile: đã gắn banner + nút chuông trên `dashboard.page` tái dùng service hiện có.

## Lý do từng hoãn (đã huỷ — đã làm trong Sprint 03)

Trước đây ghi nhận chỉ ảnh hưởng hiển thị (Medium) và cần chỉnh shared TopBar dùng chung 2 nền tảng nên gom Sprint 04. Ngày 2026-10-05 chủ dự án yêu cầu làm luôn; đã triển khai, build PASS (xem mục kết quả ở trên).
