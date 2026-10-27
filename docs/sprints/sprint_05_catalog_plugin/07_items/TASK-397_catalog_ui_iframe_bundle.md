# [TASK-397] UI plugin iframe bundle + shared picker qua gateway

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-397 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev)** — UI source trong `plugins/catalog/web`; mount native `/settings/catalog`; context menu + URL route-state; iframe bundle giữ fallback |
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
| 0.2 | 2026-10-27 | **Gateway path**: `catalog.service` + `catalog-admin.service` + API drawer dùng `/api/v1/plugins/runtime/catalog/api/v1/catalog/**`; `npm run web:build` PASS. Iframe bundle/route động còn P4. | Developer Agent; web build |
| 0.3 | 2026-10-27 | **Iframe UI done (dev)**: Angular project `catalog-plugin` build vào plugin `META-INF/resources`; `/settings/catalog` redirect `/apps/catalog`; gateway nhận token qua query/header/referer/cookie cho asset; iframe auto-height; UI render bảng danh mục + API 200. | Developer Agent; Docker dev + browser |
| 0.4 | 2026-10-27 | **Chuyển native**: move toàn bộ UI source sang `plugins/catalog/web/src`; core route `/settings/catalog` mount trực tiếp (không iframe); thêm context menu type/item + URL path-state; web/plugin build PASS; browser click type + menu PASS | Chủ dự án chỉ đạo trực tiếp |
