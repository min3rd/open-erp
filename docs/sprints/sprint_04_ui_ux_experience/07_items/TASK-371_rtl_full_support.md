# [TASK-371] RTL đầy đủ cho `ar` (Web + Mobile)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-371 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 AC-16 ("RTL đầy đủ ngay") |
| depends_on / blocks / parent | TASK-368, TASK-370 / — / [FEAT-29](FEAT-29_multilanguage_i18n_expansion.md) |
| Write scope / baseline | template + class `.ts` trong `shared`, `web/src`, `mobile/src` (không đụng i18n JSON) |

## 1. Mục tiêu và scope

`ar` đã set `<html dir="rtl" lang="ar">` nhưng layout vẫn dựng bằng thuộc tính **vật lý** nên lệch. Chuyển sang **thuộc tính logic** để đúng cả LTR và RTL.

- [x] `pl/pr/ml/mr-N` → `ps/pe/ms/me-N`; `left/right-N` → `start/end-N`; `border-l/r` → `border-s/e`; `rounded-l/r` → `rounded-s/e`; `text-left/right` → `text-start/end`; `space-x-*` → `gap-*`/`rtl:space-x-reverse`.
- [x] Drawer trượt từ cạnh inline-start (peek xếp chồng lật đúng chiều), popover `right-0` → `end-0`, dropdown menu ngang `left-0` → `start-0`.
- [x] `top-progress-bar` mọc từ inline-start (`:host-context([dir='rtl'])` đảo chiều animation).
- [x] Toggle: knob dùng `ms-*` (LTR/RTL đều chạy).
- [x] `<app-icon>` **tự lật** icon có hướng (chevron/chevrons/arrow/external-link/log-out) khi RTL; `rtlMirror` tường minh vẫn ưu tiên.
- [x] Cố định LTR có chủ đích: canvas sơ đồ tổ chức (`dir="ltr"` để chữ không lật), toạ độ con trỏ của context menu.

## 2. Kiểm chứng (trình duyệt, baseline `5c2e0ca`)

| Kiểm tra | Kết quả |
| :--- | :--- |
| `dir=rtl`, `lang=ar` | PASS |
| Overflow ngang tại 1440×900 và 390×844 | **0** (doc + body scrollWidth = innerWidth); cũng 0 với `vi` |
| Sidebar/rail | gương (RTL left=1184/right=1440 so với LTR 0/256) |
| Bảng | `th=text-start`, cột số `td=text-end` |
| Context menu | mở tại con trỏ, **clamp trong viewport** (1273–1433 của 1440) |
| Drawer | mở từ inline-start (trái), viền `border-s` |
| Toggle | knob lật đúng (bật sang trái / tắt sang phải trong RTL) |
| Console error | 0 |
| Scan vật lý | 90 chỗ / 39 file → **3 chỗ / 1 file** (cặp `-translate-x-[30px] rtl:translate-x-[30px]` cố ý) |

Ảnh: `%TEMP%/opencode/rtl/` (+ bản sao trong `docs/06_user_guides/assets/sprint_04/rtl-ar-*.png`).

## 3. Bàn giao và lịch sử

Commit `5c2e0ca` (cùng đợt với BUG-131…134). Ghi chú kỹ thuật phát hiện thêm: Angular cắt class binding có dấu chấm (`[class.translate-x-3.5]` thành `translate-x-3`) — đã đổi sang binding chuỗi `[class]`, nhờ đó toggle mới thực sự di chuyển.

Còn lại cho QA người: chạy TC-17 trên **Mobile Ionic thật** (đợt này xác nhận qua build + web 390).
