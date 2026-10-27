# [BUG-137] Catalog plugin UI mất layout 2 cột trên desktop

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-137 / Bug giao diện / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án (ảnh `/apps/catalog` 1920px) / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-397](TASK-397_catalog_ui_iframe_bundle.md), [TASK-399](TASK-399_plugin_ui_registry_dynamic_host.md), `src/frontend/web/src/styles.css` |

## 1. Mô tả

Màn catalog trong iframe tại `/apps/catalog` hiển thị **một cột dọc**: danh sách loại chiếm toàn bộ chiều rộng, bảng bản ghi nằm bên dưới thay vì split 2 cột `loại | bản ghi` như thiết kế desktop.

## 2. Cách tái hiện

1. Đăng nhập tenant đã bật catalog.
2. Mở `/apps/catalog` ở viewport desktop ≥1280px.
3. Quan sát class `lg:grid-cols-[13rem_minmax(0,1fr)]` không có hiệu lực; `aside` và `section` xếp dọc.

## 3. Nguyên nhân

Sau khi UI source chuyển sang `plugins/catalog/web/src`, plugin build dùng chung `src/frontend/web/src/styles.css`. Tailwind v4 chỉ scan các source mặc định + `@source '../../shared'`, **không scan `plugins/catalog/web/src`**. Vì vậy các utility chỉ xuất hiện trong plugin source — đặc biệt `lg:grid-cols-[13rem_minmax(0,1fr)]` — không được sinh vào CSS bundle.

## 4. Hướng sửa

- Thêm `@source '../../../../plugins/catalog/web/src';` vào Tailwind entry dùng chung.
- Rebuild web + plugin image; plugin bundle CSS tăng từ 62.28 kB lên 63.28 kB và có class grid.
- Kiểm chứng computed style: `gridTemplateColumns = 240px 1048px`, `aside` trái 240px, `section` phải 1048px tại viewport 1296px.

## 5. Tiêu chí kiểm tra sau sửa

- [x] Desktop ≥1280px: loại bên trái, bản ghi bên phải, không xếp dọc.
- [x] Plugin CSS bundle chứa utility `lg:grid-cols-[13rem_minmax(0,1fr)]`.
- [x] `/apps/catalog` API types/items 200, 0 console.error.
- [ ] QA dual-mode xác nhận lại.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo bug từ ảnh chụp desktop; fix Tailwind `@source`; browser computed grid PASS | Chủ dự án báo lỗi |
| 0.2 | 2026-10-27 | Bổ sung cache-buster iframe + `Cache-Control: no-store` cho HTML để tránh HTML/CSS cũ sau rebuild; browser grid PASS | Developer Agent |
