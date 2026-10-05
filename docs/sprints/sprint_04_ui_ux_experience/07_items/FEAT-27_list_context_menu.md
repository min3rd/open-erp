# [FEAT-27] Context Menu Cho Danh Sách

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-27 / Sprint 04 / Medium / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) |

## 1. Nhu cầu và phạm vi

Là người dùng Desktop, tôi muốn chuột phải vào một dòng danh sách để mở menu hành động nhanh — trải nghiệm như phần mềm desktop.

- In-scope: `ContextMenuService` + `ContextMenuComponent` + `appContextMenuTrigger` (shared); áp cho các bảng trọng yếu; phân quyền; bàn phím/a11y; **Desktop only**.
- Out-scope: context menu trên Mobile (khách chốt **không cần**); thay thế Drawer/route.
- Không chặn menu chuột phải mặc định ngoài vùng danh sách.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-08 | Chuột phải dòng ⇒ menu tại con trỏ, hành động theo quyền | [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) §3 | Not Run |
| CONF/AC-09 | `Escape`/`Shift+F10`/mũi tên điều hướng đúng `role="menu"` | DES-UI-002 §3.1 | Not Run |
| CONF/AC-10 | Mobile không có context menu | DES-UI-002 §3.3 | Not Run |

## 3. Task con đề xuất (Reserved)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-363 service + component + directive context menu (a11y, flip) | Developer | FEAT-26 | `shared/components/context-menu`, `shared/directives` | Reserved |
| TASK-364 tích hợp vào role-matrix/members/marketplace/sample-record/table | Developer | TASK-363 | web feature templates + `shared/components/table` | Reserved |

## 4. Bàn giao

Chưa có code. Danh sách hành động mỗi màn phải trùng hành động inline/route hiện có.
