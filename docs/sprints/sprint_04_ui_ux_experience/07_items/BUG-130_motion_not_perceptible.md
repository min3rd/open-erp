# [BUG-130] Animation gần như không cảm nhận được

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-130 / Bug / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đã làm đậm, đo trình duyệt PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "còn chưa thấy tý animation nào luôn ý" |
| depends_on / blocks / parent | TASK-359, TASK-360 / — / [FEAT-25](FEAT-25_motion_and_animation_system.md) |

## 1. Hiện tượng và nguyên nhân

Lớp motion có tồn tại nhưng **quá nhẹ để nhận ra**: popup chỉ `translateY(-2px)` + fade 160ms; route `translateY(2px)` 220ms; stagger **không có delay** (mọi hàng fade cùng lúc) nên trông như không có animation; menu group/flyout không có animation; đổi theme thì màu "giật" tức thì.

## 2. Cách sửa (vẫn CSS-only, ≤260ms, tôn trọng `prefers-reduced-motion`)

| Hạng mục | Trước | Giờ |
| :--- | :--- | :--- |
| Popup (`op-pop`) | −2px, 160ms | **−6px + scale 0.97**, 180ms |
| Route (`op-route-in`) | +2px, 220ms | **+10px**, 260ms |
| Danh sách (`op-stagger`) | fade 120ms, không delay | **rise 6px + delay 18ms/hàng** (8 hàng đầu, cắt từ hàng 21) |
| Menu group mở | không | rise 180ms khi `<details>` mở |
| Flyout menu icon | không | pop 180ms |
| Đổi theme/kiểu dáng/sáng tối | giật tức thì | **cross-fade màu 260ms** (`op-theme-switching` do `ThemeService` bật ~300ms) |
| Banner thông báo, card plugin | không | `op-pop` / `op-stagger` |

## 3. Kiểm chứng (trình duyệt — `document.getAnimations()`)

| Thời điểm | Kết quả |
| :--- | :--- |
| Mở panel tài khoản | **7 animation đang chạy**: `op-pop-in` 180ms, `op-row-in` ×3 180ms, `op-route-in` 260ms |
| Đổi route | `op-route-in` 260ms + stagger hàng bảng |
| Đổi theme | `html.op-theme-switching = true` trong lúc đổi, tự gỡ sau ~300ms |

Ghi chú: chỉ transform/opacity (và màu khi cross-fade) được animate; không thêm thư viện animation; `prefers-reduced-motion: reduce` tắt toàn bộ.
