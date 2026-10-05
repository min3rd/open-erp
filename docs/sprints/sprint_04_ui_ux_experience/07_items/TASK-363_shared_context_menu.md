# [TASK-363] Context menu dùng chung (service + component + directive)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-363 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **In Review** (code + build PASS, chờ QA browser) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-361 (icon) / TASK-364 / [FEAT-27](../07_items/FEAT-27_list_context_menu.md) |
| Write scope / baseline | `shared/components/context-menu`, `shared/directives/context-menu-trigger.directive.ts`, `shared/models/context-menu.model.ts`, exports, `web/src/app/app.ts|html` |

## 1. Mục tiêu và scope

Một context menu dùng chung, mở bằng chuột phải / `Shift+F10`, render ở lớp overlay, có bàn phím + a11y. Truy vết AC-08, AC-09.

- In-scope: `ContextMenuService` (signal), `ContextMenuComponent` (host mount 1 lần ở web root), `appContextMenuTrigger` directive; item `{ id, labelKey, icon?, disabled?, disabledReasonKey?, danger?, action }`; icon + nhãn; disable kèm lý do; flip/clamp 8px; đóng khi click ngoài/Escape/scroll/resize/blur; trả focus về hàng.
- Out-of-scope: Mobile (không dùng — Q7); hành động mới (menu chỉ là lối tắt tới handler sẵn có).

## 2. Các thao tác

- [x] Service + component + directive + model + export.
- [x] Mount `<app-context-menu />` ở web root.
- [x] i18n: `COMMON_CONTEXT_MENU`, `COMMON_MORE_ACTIONS`, `COMMON_PERMISSION_REQUIRED`, `COMMON_ACTION_IN_PROGRESS`, `COMMON_ACTION_BLOCKED` (4 từ điển).

## 3. Tiêu chí và kiểm chứng

- [x] AC-08/AC-09; icon + nhãn; disable kèm lý do; bàn phím.
- [ ] QA browser thật (mở bằng chuột phải + Shift+F10, flip gần biên, focus trả về).
- [x] Build web + mobile PASS; parity i18n.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |

## 4. Bàn giao và lịch sử

Bước tiếp: TASK-364 (gắn vào các màn) + QA browser.
