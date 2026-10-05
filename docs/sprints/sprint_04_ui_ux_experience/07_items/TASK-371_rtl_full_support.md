# [TASK-371] RTL đầy đủ cho tiếng Ả Rập (`ar`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-371 / Task / Sprint 04 |
| Severity / trạng thái | High / To Do |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved (Q4: bật RTL đầy đủ ngay) |
| depends_on / blocks / parent | TASK-368, TASK-370 / — / [FEAT-29](../07_items/FEAT-29_multilanguage_i18n_expansion.md) |
| Write scope / baseline | template shared + web/mobile; `language-registry` (dir) |

## 1. Mục tiêu và scope

`ar` phải hiển thị **gương đầy đủ** (Web + Mobile), không tràn ngang 390px, icon hướng lật hợp lý. Truy vết AC-16.

- Khung đã có: `I18nService` đặt `dir="rtl"` trên `<html>` theo registry.
- Còn lại: rà soát template dùng thuộc tính **logic** (`ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`, `text-start`/`text-end`) thay cho `pl/pr`, `ml/mr`, `left/right`, `text-left/right`; lật icon định hướng (`rtlMirror`); kiểm Drawer trượt từ phải, bảng, progress bar, canvas tổ chức.
- Điều kiện bật: chỉ QA `ar` khi từ điển đủ 100% (TASK-370) — nếu chưa, `released: false`.

## 2. Các thao tác

- [ ] Rà template shared + web + mobile: thay thuộc tính vật lý bằng logic.
- [ ] Icon định hướng: bật `rtlMirror` cho chevron/back/next.
- [ ] Drawer/canvas/progress bar: kiểm gương, không tràn ngang.

## 3. Tiêu chí và kiểm chứng

- [ ] AC-16: `ar` gương đúng, overflow 0 tại 390×844, 0 console error.
- [ ] Build web + mobile PASS.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | Not Run | — |
| QA browser `ar` (1280×900 + 390×844) | Not Run | — |

## 4. Bàn giao và lịch sử

Chưa triển khai. Phụ thuộc từ điển `ar` (TASK-370 batch 3).
