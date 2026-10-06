# [BUG-123] Menu trái/phải chưa có nhiều cấp (menu phẳng)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-123 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "các kiểu menu trái phải đang chưa có nhiều level" |
| depends_on / blocks / parent | TASK-374 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

Menu settings đã có cây (nhóm Tổ chức / Dữ liệu / Hệ thống) nhưng `settings-layout` chỉ truyền cây cho bố cục `top`; các bố cục rail (`side`, `right`, `narrow`, `compact`, `drawer`) nhận **danh sách đã làm phẳng** (`flatMenuItems`) nên không có cấp nào.

## 2. Cách sửa

- `app-section-nav` render nhóm bằng `<details>` cho cả rail/compact/icons: chevron xoay, mục con thụt lề (`ps-6`/`ps-4`, dùng thuộc tính logic để không vỡ RTL).
- Nhóm chứa trang đang mở **tự mở sẵn** (`groupActive()` so khớp URL hiện tại với path con); mở nhóm khác thì nhóm cũ tự đóng.
- Bỏ `flatMenuItems`; mọi biến thể nhận cùng một cây menu.

## 3. Kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` web + mobile | **PASS** | 0 error |
| QA trình duyệt: rail có 3 nhóm, nhóm chứa trang đang mở tự mở | **PASS** | vào `/settings/organization` ⇒ mở sẵn "Tổ chức"; bấm "Hệ thống" ⇒ chỉ "Hệ thống" mở |
| QA: bấm ra ngoài không làm sập nhóm rail | **PASS** | vẫn mở "Tổ chức" sau khi click nền |

Ảnh: `%TEMP%/opencode/fix3/rail-side-levels.png`. Commit `0add952`.
