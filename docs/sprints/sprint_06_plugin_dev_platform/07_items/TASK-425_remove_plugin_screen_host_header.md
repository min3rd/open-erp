# [TASK-425] Bỏ header host khỏi màn hình plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-425 / Task (post-closure) / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — bỏ header host, plugin screen render trực tiếp / 1.0 / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Đầu vào | Chỉ đạo trực tiếp chủ dự án 2026-10-29: “bỏ cái đoạn này đi, sao plugin nào cũng thêm cái đấy vào vậy?” |
| Đọc trước / đọc tiếp | [REV-S06-001](../09_review/01_REV-S06-001_sprint_06_dod_review.md) |

## 1. Vấn đề

`PluginScreenHostComponent` render một header Core phía trên **mọi** màn hình plugin:
- tiêu đề screen + `pluginKey` dạng mono;
- link “Về danh sách plugin” (`PLUGIN_APP_BACK_TO_MARKETPLACE`).

Header này chiếm 40px, lặp lại thông tin đã có trong menu/nav và gây nhiễu cho màn hình plugin.

## 2. Cách xử lý

- Xoá `<header>` khỏi `plugin-screen-host.component.html`; plugin screen render trực tiếp trong host.
- Bỏ `RouterLink` khỏi component (không còn link host).
- Xoá key i18n `PLUGIN_APP_BACK_TO_MARKETPLACE` khỏi 13 locale Web + Mobile.
- Giữ nguyên route, manifest, slot và error boundary.

## 3. Kiểm chứng

- `npm run web:build` PASS; `npm run i18n:check` 13/13 locale 100%.
- Browser tenant `e2e-tenant` tại `/settings/apps/in-app-notification`: không còn text “Về danh sách plugin”/`pluginKey`; plugin screen render đầy đủ; **0 console error**.
- Ảnh: [`01_plugin_screen_no_host_header.png`](../08_testing/evidence/sprint_06_post_closure/01_plugin_screen_no_host_header.png).

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo task post-closure từ phản hồi trực tiếp chủ dự án | Chủ dự án |
| 1.0 | 2026-10-29 | Bỏ header host + key i18n; build/browser PASS; Done (QA) | QA/Developer; TR-S06-001 1.6 |
