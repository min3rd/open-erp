# [TASK-356] Registry theme + switcher + áp theme theo tenant

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-356 / Task / Sprint 04 |
| Severity / trạng thái | High / To Do |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-355, TASK-357 / — / [FEAT-24](../07_items/FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | `src/frontend/shared/enums` (`ThemeId`), `src/frontend/shared/theme`, `shared/components/theme-switcher`, `web/src/app/core/services`, layouts / working tree |

## 1. Mục tiêu và scope

`ThemeId` + registry theme; `ThemeService` áp `data-theme`/`data-mode` lên `<html>`; tải theme tenant từ API (TASK-357) sau đăng nhập, cache localStorage để tránh FOUC; theme switcher cho người có quyền. Truy vết AC-01, AC-17, DES-UI-S04-001 §3/§4.

## 2. Các thao tác

- [ ] `ThemeId` enum (industrial/slate-blue/emerald/amber) + registry (nameKey, shape, có đủ light/dark).
- [ ] `ThemeService`: `theme` + `mode`; set `data-theme`/`data-mode`/`.dark`; lưu localStorage; đọc/ghi API tenant.
- [ ] Service API frontend: `getUiPreferences`/`updateUiPreferences`.
- [ ] Theme switcher: chọn theme (chỉ khi có `core:tenant:settings-manage`) + chọn mode (mọi người dùng).
- [ ] Áp token semantic cho shell (topbar, section-nav, layout, bảng/thẻ, nút chính, badge) để đổi theme thấy rõ.
- [ ] Inline script chống FOUC trong `index.html` (Web + Mobile).
- [ ] i18n: `THEME_LABEL`, `THEME_INDUSTRIAL`, `THEME_SLATE_BLUE`, `THEME_EMERALD`, `THEME_AMBER` (4 từ điển).

## 3. Tiêu chí và kiểm chứng

- [ ] AC-01/AC-17: đổi theme tenant áp cho mọi người dùng, không FOUC.
- [ ] Frontend build PASS; QA browser 1280×900 + 390×844, 0 console error.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | Not Run | — |
| QA browser đổi theme + F5 | Not Run | — |

## 4. Bàn giao và lịch sử

Chưa triển khai. Phụ thuộc TASK-355 (token) + TASK-357 (API). Bước tiếp: QA dual-mode.
