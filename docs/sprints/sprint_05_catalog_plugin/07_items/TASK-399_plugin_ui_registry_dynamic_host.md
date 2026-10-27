# [TASK-399] Plugin UI Registry + dynamic screen host

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-399 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev)** — menu lấy từ `/api/v1/plugins/ui-manifest`; host cố định `/apps/:pluginKey`; core không import UI plugin |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-396, TASK-397 / TASK-398 |
| Write scope | `src/frontend/web/src/app/features/settings/settings-layout.component.ts`, `src/frontend/web/src/app/features/apps/**`, `src/frontend/shared/plugin-host/**`, `src/frontend/web/src/app/app.routes.ts`, `tsconfig.json` |

## 1. Mục tiêu

Plugin tự đăng ký menu/screen qua UI Manifest; core chỉ giữ một host cố định, không hardcode menu catalog và không import source UI plugin khi build.

## 2. Việc phải làm

- [x] `PluginHostService` gọi `/api/v1/plugins/ui-manifest`, expose `screens` signal.
- [x] `SettingsLayoutComponent` map mỗi screen thành `SettingsMenuNode` (path, title_key, icon mặc định, permission), chỉ hiện screen `/apps/*` và plugin đang ACTIVE.
- [x] Bỏ menu/route native `/settings/catalog`, `/platform/catalog` và path alias `@catalog-plugin/*`.
- [x] Thay `PluginAppComponent` bằng `PluginScreenHostComponent`: nhận `pluginKey`, resolve screen theo `route`, mount IFRAME/MF/WEB_COMPONENT.
- [x] Host full viewport, giữ header mỏng + quay lại plugin marketplace.
- [x] Invalid cache manifest khi marketplace install/enable/disable/uninstall hoàn tất.
- [x] Đổi plugin sang INACTIVE ⇒ manifest không trả screen ⇒ menu mất; bật lại ⇒ menu trở lại.

## 3. Tiêu chí nghiệm thu

- Menu catalog chỉ xuất hiện khi tenant cài và bật plugin; không có khai báo catalog trong core menu tree.
- `/apps/catalog` render UI plugin qua host; API gateway trả 200; chiều cao full viewport.
- Tắt plugin: `/api/v1/plugins/ui-manifest` trả 0 screen, menu biến mất. Bật lại: screen trở lại.
- `npm run web:build` PASS; không còn import `@catalog-plugin/*` trong core web.
- Platform system screen `/platform/apps/catalog` vẫn là việc của TASK-392 (platform manifest chưa mở).

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task; chuyển sang UI Manifest + host động; xoá native catalog route; browser xác nhận menu/host; disable⇒0 screen, enable⇒2 screen | Chủ dự án chỉ đạo trực tiếp |
