# [BUG-151] Host plugin lặp tiêu đề và thiếu khoảng đệm đầu trang

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-151 / Bug giao diện / Sprint 05 |
| Mức độ / trạng thái | **Low** / Resolved (dev) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [BUG-148](BUG-148_catalog_fixed_header_footer.md), `PluginScreenHostComponent`, `catalog-admin.component.html` |

## 1. Mô tả

- Màn plugin iframe (catalog) có 2 thanh tiêu đề liên tiếp: host hiển thị `Danh mục` + `Về danh sách plugin`, ngay dưới plugin tự hiển thị `DANH MỤC` kèm các nút thao tác → lặp thông tin, mất chiều cao.
- Tiêu đề `DANH MỤC` của plugin dính sát mép trên/trái/phải khung iframe.

## 2. Hướng sửa

- Host: ẩn `<header>` khi `render_mode = IFRAME` (plugin tự có header); giữ header cho web-component/module-federation. Điều chỉnh `frameOffsetPx` 112 → 72 để iframe lấp đúng vùng nội dung.
- Catalog plugin: thêm `mx-2 mt-2` cho hàng tiêu đề để tách khỏi mép khung.
- Điều hướng về danh sách plugin vẫn còn ở sidebar core (`Quản lý plugin` → `/settings/plugins`).

## 3. Kiểm chứng

- [x] Iframe catalog chỉ còn 1 tiêu đề `DANH MỤC`; không còn thanh host phía trên.
- [x] Tiêu đề và các nút có khoảng đệm trên/trái/phải; iframe lấp đúng chiều cao, không lộ khoảng trắng đáy.
- [x] Web-component/module-federation vẫn giữ header host; 0 lỗi console.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Ẩn header host cho iframe; thêm margin tiêu đề plugin | Chủ dự án yêu cầu |
