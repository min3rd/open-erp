# [FEAT-26] Feather Icon System

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-26 / Sprint 04 / Medium / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) |

## 1. Nhu cầu và phạm vi

Là người dùng, tôi muốn các chức năng dễ hiểu/độc lập hiển thị bằng icon trực quan (Feather) để quét giao diện nhanh hơn.

- In-scope: component `app-icon` chung; registry Feather vendored; enum `IconName`; thay thế SVG vẽ tay ở các màn trọng yếu; a11y (label/decorative); hỗ trợ RTL cho icon hướng.
- Out-scope: thêm npm icon library; icon cho hành động đã có nhãn rõ và không cần thiết.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-06 | Hành động phổ biến có icon Feather; icon-only có aria-label/tooltip | [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) §2 | Not Run |
| CONF/AC-07 | Icon mới thêm vào registry chung, không vẽ rải rác | DES-UI-002 §2.2 | Not Run |

## 3. Task con đề xuất (Reserved)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-361 `app-icon` + registry Feather + `IconName` | Developer | — | `shared/components/icon`, `shared/enums` | Reserved |
| TASK-362 thay SVG vẽ tay ở topbar/user-menu/bell/drawer/list + a11y | Developer | TASK-361 | shared + web + mobile templates | Reserved |

## 4. Bàn giao

Chưa có code. Lưu ý: Feather vendored (MIT) — ghi nguồn/giấy phép trong header file registry.
