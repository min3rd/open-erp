# [TASK-355] Token 3 tầng + tích hợp Tailwind v4

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-355 / Task / Sprint 04 |
| Severity / trạng thái | High / To Do |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-356 / [FEAT-24](../07_items/FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | `src/frontend/web/src/styles.css`, `src/frontend/mobile/src/styles.css`, `src/frontend/shared/theme` / working tree |

## 1. Mục tiêu và scope

Định nghĩa tầng token (primitive → semantic → theme) và map vào Tailwind v4 `@theme` để component dùng utility semantic (`bg-surface`, `text-muted`, `border-default`, `bg-accent`). Truy vết AC-02, AC-03, DES-UI-S04-001 §2.

## 2. Các thao tác

- [ ] Khai báo token semantic + giá trị cho 4 theme × 2 mode (`industrial`/`slate-blue`/`emerald`/`amber`, light/dark) trong `styles.css` (Web + Mobile), gắn theo `[data-theme][data-mode]`.
- [ ] Token shape (`--op-radius-control`, `--op-radius-container`) — mặc định sharp cho industrial, soft cho 3 theme còn lại.
- [ ] Map vào `@theme` để sinh utility; giữ bất biến mật độ (cỡ chữ, spacing, chiều cao dòng).

## 3. Tiêu chí và kiểm chứng

- [ ] Đáp ứng AC-02/AC-03; tương phản AA cho text mọi theme × mode.
- [ ] Frontend build PASS; QA browser.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | Not Run | — |

## 4. Bàn giao và lịch sử

Chưa triển khai. Bước tiếp: TASK-356.
