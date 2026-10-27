# [BUG-141] Catalog host mất layout core + form/filter lệch

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-141 / Bug giao diện / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-27 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | `app.routes.ts`, `PluginScreenHostComponent`, `catalog-admin.component.html`, `catalog-type-drawer.component.html` |

## 1. Mô tả

- `/apps/catalog` render full-screen, mất topbar/sidebar core.
- Trong layout core, iframe còn ~986px nên breakpoint `lg` (1024px) không bật; catalog vẫn 1 cột.
- Filter row có ô search không label nên cao/thấp lệch; input 30px, select 32px.
- Drawer thêm/sửa loại chỉ `max-w-lg` (512px) trên desktop rộng, form 2 cột bị chật.

## 2. Hướng sửa

- Chuyển host vào settings layout: `/settings/apps/:pluginKey` (giữ topbar + menu core); menu manifest trỏ `/settings/apps/{plugin_key}`.
- Redirect URL cũ `/apps/**` → `/settings/apps/**` để bookmark cũ vẫn mở đúng layout.
- Đổi grid plugin từ `lg:` → `md:` để 2 cột ở vùng nội dung ~986px.
- Thêm label `COMMON_SEARCH` cho ô tìm; chuẩn hóa `h-8` cho shared input/select (mobile vẫn min-height 40px).
- Mở rộng drawer: type `max-w-3xl`, item/grants/detail `max-w-2xl`.

## 3. Kiểm chứng

- `/settings/apps/catalog` giữ topbar 48px + sidebar 256px.
- Grid plugin `208px 935px`; filter controls cùng top `89`, cao `32px`.
- Drawer type rộng `768px`, các cột field rộng `364px`, top thẳng hàng.
- `/apps/catalog/...` redirect sang `/settings/apps/catalog/...`.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Host vào settings layout; breakpoint md; chuẩn hóa input/select + drawer widths | Chủ dự án báo lỗi |
