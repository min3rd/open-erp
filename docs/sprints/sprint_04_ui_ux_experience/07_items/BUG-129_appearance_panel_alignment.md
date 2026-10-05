# [BUG-129] Panel cài đặt giao diện căn lề lệch cột

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-129 / Bug / Sprint 04 |
| Severity / trạng thái | Medium / **In Review** (đã sửa, đo trình duyệt PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "bạn nhìn xem cách căn lề các cài đặt có hợp lý không" (kèm ảnh) |
| depends_on / blocks / parent | TASK-373, TASK-374 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

Các hàng trong panel giao diện dùng `inline-flex` + nhãn độ rộng tự nhiên, nên nhãn dài/ngắn khác nhau làm **control không thẳng cột**: select chủ đề bắt đầu lệch so với select kiểu dáng/bố cục; nút "Đặt" của hàng mặc định tenant dính sát mép phải popover; mỗi control một độ rộng khác nhau; popover `w-64` chật cho nhãn dài.

## 2. Cách sửa

- Bọc các hàng bằng **grid 2 cột cố định**: `grid-cols-[7rem_minmax(0,1fr)]`, `gap-x-2 gap-y-1.5`; nhãn `truncate`, control `w-full min-w-0`.
- Hàng "mặc định tenant": nhãn ở cột 1, cột 2 là `flex` chứa tên theme + nút "Đặt" (`ms-auto`) ⇒ mép phải trùng với các select.
- Segment sáng/tối `justify-self-start` (giữ độ rộng tự nhiên, không kéo giãn).
- `language-switcher` dùng cùng grid 7rem để thẳng cột với các hàng còn lại.
- Popover user-menu `w-64` → `w-80`.
- ≤639px (web) / ≤400px (mobile): nhãn bị ẩn sẵn nên grid tự thu về 1 cột.

## 3. Kiểm chứng (trình duyệt, 1440px)

| Đo | Kết quả |
| :--- | :--- |
| Cột nhãn | tất cả **112px**, left=1113 |
| Cột control | tất cả bắt đầu **x=1233**, select rộng **182px**, mép phải 1415 |
| Hàng mặc định tenant | tên theme + nút "Đặt" kết thúc đúng **1415** |
| Popover | 302px |

Ảnh: `%TEMP%/opencode/align-lang-motion/panel-open.png`, `panel-en.png`.
