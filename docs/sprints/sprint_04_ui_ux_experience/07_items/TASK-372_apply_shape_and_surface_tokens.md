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

### Bổ sung: bộ mặt riêng cho từng theme (2026-10-05, theo phản hồi "vẫn quá giống nhau")

Sau phản hồi thứ hai của chủ dự án, mỗi theme được cấp **bộ mặt riêng** (không chỉ bo góc):

| Theme | Bo góc | Bề mặt | Topbar | Sidebar |
| :--- | :--- | :--- | :--- | :--- |
| industrial (mặc định) | 0/0 | phẳng | trắng | trắng |
| slate-blue | 6/10px | bóng mềm | **xanh đậm** | xám xanh |
| emerald | 2/4px | phẳng | trắng, **viền accent xanh lá** | **xanh lá nhạt** |
| amber | 10/12px | bóng mạnh | **kem ấm** | **hổ phách** |

Token mới: `--op-topbar-{bg,text,border}`, `--op-sidebar-{bg,text,active-bg,active-text}` → utility `bg-topbar`/`text-topbar-text`/`border-topbar-border`/`bg-sidebar`/`text-sidebar-text`/`bg-sidebar-active`/`text-sidebar-active-text`. Áp cho shared topbar (kể cả bell/user-menu — dùng `text-topbar-text` để đọc được trên nền tối), section-nav và sidebar settings.

Đo computed style (light): industrial `#ffffff/#ffffff/0px` · slate-blue `#0f172a/#f8fafc/6px` · emerald `#ffffff/#ecfdf5/2px` · amber `#fffbeb/#fef3c7/10px`. Ảnh: `%TEMP%/opencode/themeqa2/<theme>-light.png`. Commit `cbf10f2`.

### Bổ sung 2: layout menu riêng cho từng theme (2026-10-05, phản hồi "layout vẫn giống nhau")

| Theme | Kiểu menu | Đo được (1440px) |
| :--- | :--- | :--- |
| industrial | sidebar **trái** (mặc định) | aside left=0, nav 211×263 dọc |
| slate-blue | **menu ngang dưới topbar** | không aside, nav 1424×32 |
| emerald | sidebar **phải** | aside left=**1216** |
| amber | **menu ngang dưới topbar** | nav 1424×32 |

`ThemeDefinition.navLayout` (`side|top|right`) + `ThemeService.navLayout`; `app-section-nav` thêm input `orientation` (dọc/ngang, active gạch chân accent); `settings-layout` render thanh ngang cho `top` và lật hàng cho `right`. Ảnh: `%TEMP%/opencode/navlayout/<theme>.png`. Commit `23e6bbe`.

> **Cập nhật 2026-10-05 (TASK-373)**: bổ sung 1 & 2 ở trên là bước trung gian. Chủ dự án sau đó yêu cầu tách thành trục độc lập cho người dùng chọn, nên bo góc/bóng và bố cục menu đã được **rút khỏi theme** và chuyển sang shape layer (`[data-shape]`) + `LayoutId` per-user; theme chỉ giữ màu + topbar/sidebar và cung cấp giá trị mặc định (`defaultShape`/`defaultLayout`) khi người dùng để AUTO. Chi tiết: [TASK-373](TASK-373_split_appearance_axes.md).

Giữ vuông có lý do: sidebar `<aside>` (sát mép viewport), backdrop, chrome platform, panel thương hiệu login.
