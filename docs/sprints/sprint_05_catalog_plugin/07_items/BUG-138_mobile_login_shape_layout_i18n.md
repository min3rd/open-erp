# [BUG-138] Mobile login hiển thị khóa i18n Shape/Layout

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-138 / Bug i18n / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án (ảnh `/login` mobile) / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | `src/frontend/mobile/src/app/pages/login/login.page.html`, `src/frontend/mobile/public/i18n/*.json` |

## 1. Mô tả

Màn đăng nhập mobile hiển thị raw key `SHAPE_LABEL`, `LAYOUT_LABEL`; sau khi bổ sung label, các option tiếp tục hiện `SHAPE_SHARP/SOFT/ROUNDED`, `LAYOUT_SIDE/RIGHT/TOP/DRAWER`. Đồng thời form dồn lên đầu trang, nhiều khoảng trống khi mở ở viewport desktop.

## 2. Nguyên nhân

- Mobile i18n thiếu các key của `ThemeSwitcherComponent` (shape/layout labels + option names). Web i18n có đủ, mobile chỉ có theme/mode.
- Login content dùng `max-w-md mx-auto` nhưng không căn giữa theo chiều dọc.

## 3. Hướng sửa

- Copy 11 key shape/layout từ web dictionaries sang đủ 13 locale mobile; `i18n:check` 100%.
- Bọc nội dung login trong `flex min-h-full items-center justify-center`, giữ `max-w-md`.
- Mobile build PASS.

## 4. Tiêu chí kiểm tra sau sửa

- [x] Không còn raw key `SHAPE_*`/`LAYOUT_*` trong login.
- [x] 13 locale mobile parity 100%.
- [x] Form căn giữa dọc, không còn dồn sát header.
- [ ] QA 390×844 + bàn phím ảo xác nhận không che form.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo bug; bổ sung i18n + căn giữa login; mobile build PASS | Chủ dự án báo lỗi |
