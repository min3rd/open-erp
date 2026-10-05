# [TASK-372] Áp token hình dạng/bề mặt vào component (theme khác phong cách thật)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-372 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đã áp 79 file, build PASS, đo trình duyệt PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved + phản hồi chủ dự án ("theme mới chỉ đổi màu") |
| depends_on / blocks / parent | TASK-355, TASK-358 / — / [FEAT-24](../07_items/FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | template shared + feature; class string trong `drawer.component.ts`, `sharp-button.component.ts`, mobile `role-detail.page.ts` |

## 1. Mục tiêu và scope

Token hình dạng đã có (`--op-radius-control/container`: industrial 0px, 3 theme kia 4/6px) và bề mặt (`--op-panel-shadow`: industrial none, theme kia có bóng) nhưng component còn hardcode `rounded-none` nên **theme chỉ khác màu**.

- Thay `rounded-none`/`rounded-sm` → `rounded-control` (nút, input, select, textarea, toggle, badge, pagination, menu item) hoặc `rounded-container` (panel, drawer, popup, card, bảng, khung cảnh báo).
- Gắn `shadow-panel` cho panel nổi (context menu, popup user-menu/notification-bell, plugin-card, panel `bg-surface-raised`).
- Migrate nốt `neutral-*` còn lại ở `organization.component.html` (43 chỗ, bị loại khỏi TASK-358) và 6 class string trong `.ts`.
- **Giữ nguyên**: panel thương hiệu ở login (nền tối cố định), chrome platform + banner impersonation, backdrop `bg-neutral-950/*`, màu trạng thái.

## 2. Các thao tác

- [ ] Thay radius token toàn bộ component shared + feature.
- [ ] Gắn `shadow-panel` cho panel nổi.
- [ ] Migrate `organization.component.html` + class `.ts` còn lại.

## 3. Tiêu chí và kiểm chứng

- [ ] AC-01/AC-03: đổi theme ⇒ khác cả **màu + hình dạng + bề mặt**; theme industrial **không đổi** gì (radius 0, shadow none).
- [ ] Build web + mobile PASS.
- [ ] QA browser: chụp 4 theme × light/dark.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | **PASS**, 0 error | CSS sinh ra có `.rounded-control`, `.rounded-container`, `.shadow-panel`, `.rounded-t-container` |
| Đo trình duyệt (computed style) | **PASS** | xem bảng dưới |
| QA browser 4 theme × 2 mode | Not Run | chờ đợt QA (đã đo 2 theme) |

| Phần tử | industrial (mặc định) | slate-blue |
| :--- | :--- | :--- |
| Nút primary | radius **0px** | **4px** |
| Select ngôn ngữ | radius **0px** | **4px** |
| Popup user-menu | radius **0px**, shadow **none** | **6px**, **có bóng** |

Ảnh: `%TEMP%/opencode/themeqa/theme-{industrial,slate-blue}.png`.

## 4. Bàn giao và lịch sử

Đã làm: 66 `rounded-none`→`rounded-control`; 226 `rounded-container`; 8 `rounded-t-container`; `shadow-panel` cho context-menu/user-menu/notification-bell/plugin-card; migrate nốt 95 token ở `organization` + các chỗ sót (`plugin-app`, `iframe-loader`) + class `.ts`.

Giữ vuông có lý do: sidebar `<aside>` (sát mép viewport), backdrop, chrome platform, panel thương hiệu login.

Trả lời trực tiếp phản hồi "theme mới chỉ đổi màu thôi chưa hợp lý": giờ đổi theme khác **màu + bo góc + bề mặt**, industrial giữ nguyên bản mặc định.
