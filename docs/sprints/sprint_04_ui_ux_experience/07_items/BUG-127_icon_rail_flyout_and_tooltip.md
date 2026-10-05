# [BUG-127] Menu dọc dạng icon: chỉ hiện icon cấp 1, cấp con mở bằng popover + tooltip

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-127 / Bug / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đo trình duyệt PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "menu dọc ở dạng narrow thì nên hiển thị icon level 1, các level tiếp theo thì cần hover hoặc click để thành popover… dạng icon phải có tooltip chứ" |
| depends_on / blocks / parent | BUG-126 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

Rail thu gọn vẫn đổ hết các cấp ra dưới dạng icon (icon nhóm + icon con thụt lề) nên rối, không biết đâu là cấp 1; không có tooltip tức thời (chỉ có `title` của trình duyệt, hiện chậm); và **flyout không vẽ được** dù computed style báo `display:block` — Chrome mới ẩn nội dung `<details>` bằng `content-visibility` (pseudo `::details-content`) chứ không chỉ `display`, nên ghi đè `display` là không đủ.

## 2. Cách sửa

- Rail thu gọn chỉ render **icon cấp 1** (mục thường + nhóm); mục con **không** hiện trong rail.
- Nhóm: bấm/hover icon ⇒ **popover** chứa tiêu đề nhóm + các mục con (icon + nhãn). Bỏ `<details>` (tránh `content-visibility`), thay bằng wrapper `[data-flyout]` + `<button aria-haspopup aria-expanded>` và CSS hiện popover khi `:hover`, `:focus-within` hoặc `[data-open="true"]` (click ghim mở; bấm ra ngoài/Escape đóng).
- Mục thường: **tooltip tức thời** (`.op-tip`, hiện ngay khi hover/focus, không phải chờ như `title`).
- Rail bên phải: popover + tooltip lật sang trái (`flyoutAlign="end"` ⇒ `end-full`).

## 3. Kiểm chứng (trình duyệt, 1440px)

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Rail thu gọn | **PASS** | aside 48px, **4 dòng cấp 1**, mục con ẩn |
| Hover icon nhóm | **PASS** | popover 228×129 tại x=41, 3 mục con + tiêu đề nhóm |
| Rời chuột | **PASS** | popover ẩn |
| Click icon nhóm | **PASS** | popover ghim mở dù chuột đã rời |
| Hover icon mục thường | **PASS** | tooltip `opacity: 1` (167×24) cạnh icon |
| Rail bên phải | **PASS** | aside left=1392, popover x=**1171** (`insetInlineStart: -228px`) — mở sang trái, không tràn màn hình |

Ảnh: `%TEMP%/opencode/menu-flyout/hover-group-flyout.png`, `hover-leaf-tooltip.png`, `right-rail-flyout.png`. Build web + mobile PASS.
