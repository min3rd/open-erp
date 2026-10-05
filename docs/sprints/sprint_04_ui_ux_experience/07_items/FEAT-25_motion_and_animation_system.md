# [FEAT-25] Motion & Animation System

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-25 / Sprint 04 / Medium / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) |

## 1. Nhu cầu và phạm vi

Là người dùng, tôi muốn các thành phần có chuyển động mượt khi mở/đóng/xuất hiện để giao diện bớt khô cứng — nhưng **nhanh** và **không ảnh hưởng hiệu năng**.

- In-scope: token duration/easing; chuyển động cho popup/drawer/list/route/skeleton/feedback; tôn trọng `prefers-reduced-motion`.
- Out-scope: animation hào nhoáng; thư viện animation JS; chuyển động cho mọi route nặng.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-04 | Popup/drawer/list có vào/ra nhanh, không nhảy layout | [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) §1 | Not Run |
| CONF/AC-05 | `prefers-reduced-motion` tắt chuyển động không thiết yếu | DES-UI-002 §1.3 | Not Run |

## 3. Task con đề xuất (Reserved)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-359 motion tokens + lớp chuyển động popup | Developer | FEAT-24 | `shared/theme`, `shared/components/{user-menu,notification-bell,section-nav}` | Reserved |
| TASK-360 animation danh sách/route + reduced-motion | Developer | TASK-359 | shared + web layouts | Reserved |

## 4. Bàn giao

Chưa có code. Ràng buộc: chỉ animate `transform`/`opacity`; chặn stagger danh sách lớn.
