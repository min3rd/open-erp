# [BUG-142] Mobile nav drawer không theo layout trái/phải

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-142 / Bug giao diện / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | `MobileNavDrawerComponent`, `DrawerComponent`, `ThemeService` |

## 1. Mô tả

Mobile đang chọn `Bố cục = Menu trái` nhưng drawer luôn mở từ cạnh phải.

## 2. Nguyên nhân

`DrawerComponent` hardcode panel ở `end-0` (phải). `MobileNavDrawer` không truyền side từ `ThemeService.navLayout()`.

## 3. Hướng sửa

- Thêm input `side: 'start' | 'end'` cho `DrawerComponent`; đổi `start-0/end-0`, `justify-start/end`, border và hướng shift khi xếp chồng.
- `MobileNavDrawer` map `LayoutId.SIDE → start`, còn lại `end`.

## 4. Kiểm chứng

- Với `Menu trái`, panel drawer có `left=0`, rộng 300px trên viewport mobile.
- Drawer mặc định (end) của các màn khác không đổi.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Thêm side cho Drawer; mobile map SIDE→start | Chủ dự án báo lỗi |
