# [BUG-124] Menu top mở cấp 2 rồi không tự đóng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-124 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "menu top mở level ra thì k đóng lại" |
| depends_on / blocks / parent | TASK-374 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

Dropdown cấp 2 của bố cục `top` dùng `<details>` nên chỉ đóng khi người dùng bấm lại chính nó: mở nhóm thứ hai thì nhóm thứ nhất vẫn mở (che nội dung), bấm ra ngoài hoặc nhấn Escape cũng không đóng.

## 2. Cách sửa

- `(toggle)` trên `<details>`: khi một nhóm mở, **đóng tất cả nhóm còn lại** (một dropdown mở tại một thời điểm).
- `@HostListener('document:click')` đóng khi bấm ra ngoài; `keydown.escape` đóng bằng bàn phím.
- **Chỉ áp dụng cho biến thể `bar`**: nhóm trên rail là menu dọc (accordion) nên vẫn giữ trạng thái mở khi người dùng bấm sang vùng nội dung — tránh sửa lỗi này thành lỗi khác.

## 3. Kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Mở nhóm 1 rồi mở nhóm 2 | **PASS** | chỉ nhóm 2 mở (`open: ["Dữ liệu"]`) |
| Bấm ra ngoài | **PASS** | `open: []` |
| Nhóm rail vẫn mở sau khi bấm ra ngoài | **PASS** | `open: ["Tổ chức"]` |

Commit `0add952`.
