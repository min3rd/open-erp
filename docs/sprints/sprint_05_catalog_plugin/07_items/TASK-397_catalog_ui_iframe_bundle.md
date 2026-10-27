# [TASK-397] UI plugin iframe bundle + shared picker qua gateway

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-397 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do** — chặn bởi TASK-396 |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-396 / TASK-398 |
| Write scope | `plugins/catalog/web/**`, `src/frontend/shared/services/catalog.service.ts`, `src/frontend/web/src/app/app.routes.ts`, `src/frontend/mobile/src/app/app.routes.ts`, menu/settings |

## 1. Mục tiêu

Đưa UI quản trị/tra cứu catalog ra khỏi core; plugin tự serve UI qua iframe; `catalog-picker` gọi gateway.

## 2. Việc phải làm

- [ ] Tạo Angular 22 standalone app `plugins/catalog/web` (i18n 13 locale, theme token, shell tối giản) render màn admin hiện có + màn **quản trị system catalog** cho system tenant; build vào `dist/web` và copy vào plugin container `src/main/resources/META-INF/resources/ui`.
- [ ] `plugin.json` `ui_manifest.screens`: `/apps/catalog` desktop + mobile (tenant), `/platform/apps/catalog` (system tenant, platform token), `render_mode: IFRAME`.
- [ ] Xoá route/menu catalog native khỏi `web` + `mobile`; thêm menu động từ UI Manifest/plugin host (nếu chưa có).
- [ ] `catalog-picker` + `CatalogAdminService` dùng base URL gateway; không hardcode `/api/v1/catalog`.
- [ ] iframe loader truyền `plugin_token`; plugin UI dùng token cho API; 401/403 xử lý.
- [ ] QA dual-mode: desktop ≥1280, mobile 390×844, 0 console error, touch target ≥40px.

## 3. Tiêu chí nghiệm thu

- Web/Mobile không còn `features/settings/catalog` native; route catalog chỉ xuất hiện khi plugin ACTIVE.
- UI tải trong iframe, CRUD + lookup + import/export hoạt động.
- Platform admin mở `/platform/apps/catalog` quản trị system catalog; publish → fan-out tới tenant.
- Gỡ/tắt plugin ⇒ menu/route biến mất; bật lại ⇒ trở lại.
- 0 lỗi console; ảnh evidence mới.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task; chốt A10/A11 | Agent; ADR-S05-001 |
