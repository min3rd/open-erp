# [TASK-373] Tách giao diện thành 4 trục độc lập: màu / kiểu dáng / bố cục menu / chế độ sáng tối

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-373 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đã đo trình duyệt đủ 4 trục, build PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved + chỉ đạo trực tiếp chủ dự án ("nhiều chế độ layout, tách cho người dùng chọn layout/kiểu dáng/màu sắc") |
| depends_on / blocks / parent | TASK-355, TASK-356, TASK-372 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | `shared/enums/theme.enum.ts`, `shared/theme/*`, `shared/components/theme-switcher`, `web|mobile/src/styles.css`, `web|mobile/src/index.html`, `settings-layout.component.*`, `web/public/i18n/*.json` |

## 1. Mục tiêu và scope

Trước task này, "theme" là **một gói duy nhất**: chọn theme là chọn luôn màu + bo góc + bề mặt + vị trí menu (TASK-372 bổ sung 1 & 2). Chủ dự án yêu cầu tách ra cho người dùng tự chọn từng trục.

Bốn trục sau task này:

| Trục | Giá trị | Phạm vi | Lưu ở đâu |
| :--- | :--- | :--- | :--- |
| Màu (theme) | industrial · slate-blue · emerald · amber | **tenant** (chủ tenant, quyền `core:tenant:settings-manage`) | API `tenant/ui-preferences` (TASK-357) |
| Kiểu dáng (shape) | auto · sharp · soft · rounded | **người dùng** | localStorage `openerp_shape` |
| Bố cục menu (layout) | auto · side · top · right · **drawer** | **người dùng** | localStorage `openerp_layout` |
| Chế độ (mode) | system · light · dark | **người dùng** | localStorage `openerp_theme` (đã có) |

`auto` = giữ nguyên bộ mặt mà theme đã thiết kế (industrial sharp/side · slate-blue soft/top · emerald soft/right · amber rounded/top), nên mặc định không đổi gì so với trước.

- [x] Enum `ShapeId`, `LayoutId` (kèm `AUTO`) trong `shared/enums`.
- [x] Registry: `ThemeDefinition.defaultShape/defaultLayout` + `SHAPE_REGISTRY` + `LAYOUT_REGISTRY` + `resolveShape()/resolveLayout()`.
- [x] `ThemeService`: signal `shapePreference/layoutPreference` (localStorage), computed `shape/navLayout`, setter xoá override khi chọn AUTO, gắn `data-shape`/`data-layout` lên `<html>`.
- [x] `styles.css` (web + mobile): chuyển thang bo góc + bóng khỏi block `[data-theme]` sang **shape layer** `[data-shape]`; theme default giữ bằng `[data-theme]:not([data-shape])` để lần vẽ đầu (trước khi Angular boot) khớp registry.
- [x] Switcher: thêm 2 select per-user (shape, layout) cạnh theme + mode.
- [x] Layout **drawer**: nút Menu + `app-drawer` chứa `app-section-nav` trong `settings-layout`.
- [x] Script FOUC đọc override đã lưu cho shape/layout.
- [x] 11 key i18n mới × 13 locale web (parity 100%, 910 key).

**Ngoài scope**: lưu shape/layout vào hồ sơ người dùng ở backend (hiện localStorage như mode); theme vẫn cấp tenant theo CONF-S04-001 (nếu muốn mỗi người tự chọn màu thì phải mở rộng API — xem TASK-369).

## 2. Tiêu chí và kiểm chứng

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` web | **PASS**, 0 error | `%TEMP%/opencode/build-appearance-web.log` |
| `npm run build` mobile | **PASS**, 0 error | `%TEMP%/opencode/build-appearance-mobile.log` |
| `npm run i18n:check` | **PASS** 13/13 locale 100% (web 910 key) | parity script |
| QA browser: trục shape | **PASS** | sharp nút 0px/popup 0px không bóng · soft 6px/10px có bóng · rounded 12px/16px có bóng |
| QA browser: trục layout | **PASS** | side aside left=0 · top nav 1424×32 · right aside left=1216 · drawer mở 448px chứa nav |
| QA browser: 4 trục độc lập | **PASS** | amber + sharp + side ⇒ theme amber, bo góc 0px, aside left=0 cùng lúc |
| QA browser: AUTO giữ mặc định theme | **PASS** | industrial 0px/side · slate-blue 6px/top · emerald 6px/right · amber 12px/top — **giống nhau trước và sau hard reload** (fallback CSS khớp registry) |
| QA 390×844 (mobile web) | Not Run | thuộc đợt QA TP-S04-001 |

Ảnh: `%TEMP%/opencode/appearance/<case>.png` (kèm `-menu` cho panel switcher, `-drawer` cho layout drawer) và `%TEMP%/opencode/appearance-defaults/`.

## 3. Bàn giao và lịch sử

Commit `8048b15`. Script QA: `%TEMP%/opencode/qa-appearance-axes.mjs`, `qa-appearance-defaults.mjs`.

Ghi chú kỹ thuật: bóng panel gắn theo **shape** (sharp = phẳng, soft/rounded = có bóng) chứ không theo màu, vì đây là thuộc tính bề mặt; màu giữ phần nhận diện qua topbar/sidebar (TASK-372 bổ sung 1).

Rủi ro/điểm mở: shape/layout chưa lưu server-side nên đổi máy/trình duyệt là mất lựa chọn — xử lý ở TASK-369 khi làm hồ sơ người dùng.
