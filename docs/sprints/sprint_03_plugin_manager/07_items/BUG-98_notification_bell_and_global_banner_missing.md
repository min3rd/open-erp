# BUG-98: Thiếu Notification Bell trên TopBar, banner toàn cục và banner Dashboard Mobile

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-98 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Deferred → Sprint 04 (Medium được phép hoãn theo DoD) |
| **Liên quan** | DES-03-UI mục 4.4 và mục 6, TASK-311, TASK-316, TASK-319 |

## Mô tả

- DES-03-UI mục 4.4: **Bell trên TopBar** (shared `TopBar`) + danh sách thông báo dạng Drawer; **Banner toàn cục** trên mọi màn khi tenant bị ảnh hưởng bởi plugin bị khóa (amber/red + nút "Xem chi tiết").
- DES-03-UI mục 6: Mobile hiển thị **banner plugin bị khóa/cập nhật trên Dashboard**.

Implementation hiện tại: danh sách thông báo + banner nằm **trong** trang `/settings/plugins` (Web) và banner trong `/settings/plugins` (Mobile); **chưa có bell trên TopBar**, chưa có banner toàn cục, chưa có banner trên Dashboard Mobile.

## Workaround

Người dùng vào `/settings/plugins` để xem thông báo và trạng thái khóa — không mất dữ liệu, không chặn nghiệp vụ cài/gỡ.

## Hướng xử lý đề xuất (Sprint 04)

1. Tạo shared `notification-bell` component (đọc T12/T13) + slot trên `TopBar` và platform topbar.
2. Banner toàn cục trong layout (tenant) khi `notifications` unread có severity ≥ WARNING hoặc plugin bị khóa.
3. Mobile: banner trên `dashboard.page` tái dùng service hiện có.

## Lý do hoãn

Chỉ ảnh hưởng mức hiển thị/nhắc nhở (không chặn luồng nghiệp vụ), thuộc nhóm Medium và cần thay đổi shared TopBar dùng chung 2 nền tảng — nên gom vào Sprint 04 cùng đợt chỉnh TopBar.
