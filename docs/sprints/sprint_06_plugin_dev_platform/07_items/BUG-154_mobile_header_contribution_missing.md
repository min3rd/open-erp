# [BUG-154] Mobile Ionic không render plugin contribution ở `core.layout.header.actions`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-154 / Bug chức năng / Sprint 06 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-19](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-419](TASK-419_in_app_notification_web.md), `plugins/in-app-notification/plugin.json`, `src/frontend/mobile` |

## 1. Mô tả

Plugin `in-app-notification` khai báo header contribution với `platforms: ["desktop", "mobile"]`, nhưng trên Ionic 390×844 header chỉ có bell Core; không có `op-in-app-notification-bell` do plugin render.

- Desktop 1440px: `op-in-app-notification-bell` = 1, `app-notification-bell` (Core) = 1 → PASS.
- Mobile Ionic 390×844: `op-in-app-notification-bell` = 0, `app-notification-bell` (Core) = 1 → FAIL.

## 2. Nguyên nhân

Mobile app không host `PluginSlotComponent`/`core.layout.header.actions`. `dashboard.page.html` chỉ render bell Core tĩnh (`openPlugins()`), không có `app-plugin-slot`; toàn bộ `src/frontend/mobile/src` không tham chiếu slot runtime.

## 3. Ảnh hưởng

AC-19 không đạt: contribution khai báo `platforms: [mobile]` không xuất hiện trên mobile. Người dùng mobile không thấy notification plugin dù plugin ACTIVE và có quyền.

## 4. Các bước tái hiện

1. Cài/bật `in-app-notification` 1.0.2 cho tenant `e2e-plugin-demo`.
2. Đăng nhập Ionic `http://localhost:8100` bằng `e2e-tenant@example.com`, viewport 390×844.
3. Mở dashboard; kiểm tra header.
4. So sánh với Web `http://localhost:4200` cùng tài khoản.

**Mong muốn:** plugin bell xuất hiện cạnh bell Core theo `platforms`.
**Thực tế:** chỉ có bell Core.

## 5. Bằng chứng

- [Ảnh mobile dashboard 390×844](../08_testing/evidence/sprint_06/12_mobile_dashboard_390.png)
- [Ảnh desktop header](../08_testing/evidence/sprint_06/01_desktop_dashboard_header_bell.png)
- Đo DOM: mobile `pluginBell=0, coreBell=1`; desktop `pluginBell=1, coreBell=1`.

## 6. Hướng sửa đề xuất

- Thêm `PluginSlotComponent slot="core.layout.header.actions"` vào header Ionic (hoặc shared mobile topbar) với `pluginContext` tương đương Web.
- Truyền `platform=mobile` và lọc contribution theo `platforms`, giữ bell Core hiện tại.
- Bổ sung QA mobile cho AC-19 vào regression.

## 7. Cách sửa & kiểm chứng

- Thêm `app-plugin-slot` vào header Ionic dashboard, bind `[slot]="'core.layout.header.actions'"` để không tạo native `slot` attribute (Ionic shadow DOM ẩn component).
- `PluginHostService` dùng `API_BASE_URL` cho manifest/session/entry; mobile cung cấp `environment.apiBaseUrl`.
- Thêm `PluginContextService` mobile và route `/settings/apps/:pluginKey` để mở notification screen.
- Plugin bell nhận `apiBaseUrl` và tăng touch target lên 40px.

**Kiểm chứng:** mobile 390×844 có `op-in-app-notification-bell` = 1, bell Core = 1, click mở notification screen (2 bản ghi), 0 console error; ảnh `evidence/sprint_06_retest/12_mobile_header_fixed.png`, `13_mobile_notification_fixed.png`.

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA browser 390×844 | TR-S06-001 / TASK-423 |
| 0.2 | 2026-10-29 | Fixed: mobile slot + absolute plugin base + notification screen; QA re-test PASS | Developer/QA |
