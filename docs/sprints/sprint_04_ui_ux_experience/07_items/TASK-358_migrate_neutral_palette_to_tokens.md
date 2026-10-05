# [TASK-358] Chuyển `neutral-*` còn lại sang token semantic

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-358 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Progress** (đang migrate) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-355 / — / [FEAT-24](../07_items/FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | template Web/Mobile còn dùng palette thô (auth, settings, platform, dashboard, shared inputs/drawer/pagination) |

## 1. Mục tiêu và scope

Đưa các màn còn lại sang token semantic để **mọi màn theo theme tenant** (AC-01, AC-03).

- Bảng ánh xạ: `bg-white dark:bg-neutral-900`→`bg-surface`; `bg-neutral-50/100 dark:bg-neutral-800/950`→`bg-surface-muted`; `border-neutral-*`→`border-default`; `text-neutral-900/700/600`→`text-ink`; `text-neutral-500/400/300`→`text-muted`; toggle active `bg-neutral-900 text-white`→`bg-accent text-accent-contrast`.
- **Không đổi**: màu trạng thái (red/rose/emerald/amber/sky); overlay `bg-neutral-950/40`; layout/spacing/mật độ.

## 2. Các thao tác

- [ ] Auth pages, settings pages, platform portal, dashboard.
- [ ] Shared: pagination, sharp-input/select/textarea/toggle, drawer, pin-input, plugin-card, credential-form, version-timeline, operation-progress, section-nav, mobile-nav-drawer.
- [ ] Mobile templates.

## 3. Tiêu chí và kiểm chứng

- [ ] AC-01/AC-03: mọi màn đổi theo theme; mật độ không đổi.
- [ ] Build web + mobile PASS; QA browser 4 theme × light/dark.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | Not Run | — |
| QA browser theme × mode | Not Run | — |

## 4. Bàn giao và lịch sử

Chưa xong. Bước tiếp: QA đổi theme trên các màn vừa migrate.
