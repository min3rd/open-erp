# [BUG-140] Catalog iframe không có context menu host

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-140 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | `catalog-plugin-shell.component.*`, `ContextMenuService`, `ContextMenuComponent` |

## 1. Mô tả

Trong iframe catalog, bấm nút `⋮` hoặc chuột phải vào loại/bản ghi không mở context menu. Trước đây khi catalog còn native trong core thì menu hoạt động.

## 2. Nguyên nhân

`ContextMenuService` chỉ cập nhật signal; panel được render bởi `<app-context-menu />` mount **một lần trong app shell**. Core web có host này (`app.html`), nhưng plugin shell không mount, nên state đổi mà không có panel nào hiển thị.

## 3. Hướng sửa

- Import `ContextMenuComponent` vào `CatalogPluginShellComponent` và thêm `<app-context-menu />` sau `<router-outlet />`.
- Đổi nhãn menu tạo bản ghi từ key thiếu `CATALOG_ITEM_CREATE_ACTION` sang `CATALOG_ITEM_ADD`.

## 4. Kiểm chứng

- Click `⋮` loại `Xã/Phường` → menu `Sửa / Quyền theo loại / Bản ghi / Thêm bản ghi`.
- Chuột phải vào row loại → menu mở.
- Không còn raw i18n key trong menu.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Mount context menu host trong plugin shell; browser click + right-click PASS | Chủ dự án báo lỗi |
