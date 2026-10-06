# [TASK-366] Component skeleton dùng chung

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-366 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-367 / [FEAT-28](../07_items/FEAT-28_loading_bar_and_skeletons.md) |
| Write scope / baseline | `shared/components/skeleton`, `shared/components/index.ts`, i18n / working tree @ `92dbc2b` |

## 1. Mục tiêu và scope

`app-skeleton` + `app-skeleton-table` (+ biến thể card) để thay text "Đang tải…" bằng khung giữ đúng layout (AC-13). Truy vết DES-UI-S04-002 §4.2.

- In-scope: component shared, kích thước khớp nội dung thật (không nhảy layout), shimmer tắt khi `prefers-reduced-motion`, `aria-hidden` (không đọc nội dung trang trí).
- Out-of-scope: logic tải theo vùng (TASK-367).

## 2. Các thao tác

- [x] `app-skeleton` (variant `line|block|circle`, `width`, `height`).
- [x] `app-skeleton-table` (`rows`, `columns`) khớp chiều cao dòng bảng 28–34px.
- [x] Biến thể card cho thẻ plugin/số liệu.
- [x] Export shared; shimmer theo token motion + `prefers-reduced-motion`.

## 3. Tiêu chí và kiểm chứng

- [x] AC-13: không nhảy layout; skeleton đúng kích thước.
- [x] Frontend build PASS.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |

## 4. Bàn giao và lịch sử

Đã làm: `app-skeleton` (`variant line|block|circle`, `width`, `height`), `app-skeleton-table` (`rows`, `columns`, ô `h-8` khớp bảng thật), `app-skeleton-card` (thẻ plugin/số liệu). Tất cả `aria-hidden`; shimmer CSS `::after` (không lặp CSS), tắt khi `prefers-reduced-motion`; dùng token semantic (`bg-surface-muted`) nên theo theme.

API cho TASK-367 dùng lại. Bước tiếp: TASK-367 áp vào các màn.
