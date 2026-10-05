# [BUG-132] Context menu mở khi long-press trên thiết bị cảm ứng (vi phạm AC-10)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-132 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Resolved** (2026-10-05) — chờ QA xác nhận |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Nguồn | QA tự động TC-11 (dispatch `contextmenu` với `pointerType='touch'`) |
| depends_on / blocks / parent | TASK-363, TASK-364 / — / [FEAT-27](FEAT-27_list_context_menu.md) |

## 1. Hiện tượng
`ContextMenuTriggerDirective` bắt mọi sự kiện `contextmenu`. Trên Android/iOS Chrome, **long-press** cũng phát `contextmenu` ⇒ menu nổi lên trên mobile, trong khi AC-10 yêu cầu **không có context menu trên Mobile** (chỉ Desktop, không long-press).

## 2. Cách sửa
Trong `onContextMenu`: bỏ qua sự kiện có `(event as PointerEvent).pointerType === 'touch'`. Chuột và bút vẫn mở bình thường; bàn phím (`Shift+F10`) không đổi.

## 3. Kiểm chứng (trình duyệt, 390×844 + touch emulation)
| Kiểm tra | Kết quả |
| :--- | :--- |
| `contextmenu` với `pointerType='touch'` trên hàng bảng | **không mở menu** (`menuOpen: false`) |
| Chuột phải (desktop 1440) | vẫn mở menu (TC-09 PASS) |
| Touch target mobile Ionic | 0 phần tử < 40px |

Commit `5c2e0ca`. Phần còn lại của BUG-134 (bảng platform) là mức Medium, xem file đó.
