# [BUG-139] Plugin host không lưu route-state ra URL core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-139 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-399](TASK-399_plugin_ui_registry_dynamic_host.md), `PluginScreenHostComponent`, `PluginIframeLoaderComponent`, `plugin-main.ts` |

## 1. Mô tả

Sau khi chuyển catalog sang host động, địa chỉ core luôn là `/apps/catalog`; chọn loại/bản ghi/trang trong iframe chỉ đổi hash bên trong iframe. Người dùng không thể copy URL để mở lại đúng trạng thái, không có dấu vết route trên thanh địa chỉ.

## 2. Nguyên nhân

- Plugin app chỉ có route `''` + `**`; `CatalogAdminComponent` dùng `PathListStateService` với `basePath = '/settings/catalog'` nên route-state nằm sai chỗ và không khớp route của plugin.
- Host không có cầu hai chiều giữa router core và router iframe.

## 3. Hướng sửa

- Plugin app khai báo route list-state `:filter/:sort/:pageSize/:page/:id/:mode` + redirect mặc định `all/-/20/1/-/list`; component dùng `basePath = ''`.
- `CatalogPluginShellComponent` post `{source:'open-erp-plugin', type:'route', path}` mỗi `NavigationEnd`; nhận `navigate` từ core để xử lý back/forward.
- `PluginIframeLoaderComponent` nhận route ban đầu, nối vào hash iframe, phát `routeChange`; host mirror sang `/apps/:pluginKey/...` bằng `router.navigateByUrl` và gửi lại route khi URL core đổi.
- Gateway set `Cache-Control: no-store` cho HTML plugin; iframe thêm cache-buster để tránh bundle cũ.

## 4. Kiểm chứng

- Click `Quận/Huyện` → core URL `/apps/catalog/DISTRICT/-/20/1/-/list?view=list`; iframe hash tương ứng.
- Reload URL trên → chọn đúng `DISTRICT`, iframe giữ `#/DISTRICT/-/20/1/-/list?view=list`.
- Grid desktop vẫn `240px 1048px`; API 200; 0 console.error.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo bug; nối route-state hai chiều core ↔ plugin; reload/bookmark PASS | Chủ dự án báo lỗi |
