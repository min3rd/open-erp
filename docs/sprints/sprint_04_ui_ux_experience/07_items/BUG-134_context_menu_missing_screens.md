# [BUG-134] Context menu thiếu ở danh sách credential và phiên (Q20)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-134 / Bug / Sprint 04 |
| Severity / trạng thái | High (phần đã làm) + Medium (phần còn lại) / **In Review** |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Nguồn | QA tự động TC-09 (grep `appContextMenuTrigger`/`contextMenuItems`) + đối chiếu DES-UI-S04-002 §Q20 |
| depends_on / blocks / parent | TASK-364 / — / [FEAT-27](FEAT-27_list_context_menu.md) |

## 1. Hiện tượng
DES-UI-S04-002 dòng 92 chốt: *"Tất cả màn danh sách (Q20): role-matrix, members, plugin-marketplace, sample-record-list, **danh sách phiên/credential**, và các bảng dùng `shared/components/table`."* Thực tế chỉ có 4 màn đầu có menu (role-matrix + plugin-marketplace qua directive; members + sample-records qua resolver của `app-table`). **Danh sách credential (`plugin-credentials`) và danh sách phiên (account sessions) chưa có.**

## 2. Đã sửa (2026-10-05)
- `plugin-credentials`: thêm `credentialContextMenu(item)` (Sửa / Kiểm tra / Xóa, có `supportsEdit()` và trạng thái `testing()`) + gắn directive lên `<tr>`.
- Account sessions: thêm `sessionContextMenu(session)` (Thu hồi phiên, ẩn với phiên hiện tại) + gắn directive lên thẻ phiên.

## 3. Còn lại (Medium — cần khách chốt phạm vi)
Các **bảng platform** (danh sách tenant, người dùng toàn cục, audit log, admin, plugin platform) dùng `app-table` nhưng chưa truyền `[contextMenuItems]`. Đề xuất: bổ sung khi có yêu cầu rõ (hành động trên các bảng này nhạy cảm: impersonate, khóa user, export audit) — không tự thêm để tránh mở rộng quyền ngoài thiết kế.

## 4. Kiểm chứng
| Kiểm tra | Kết quả |
| :--- | :--- |
| Build web | **PASS** (`5c2e0ca`) |
| Grep wiring | role-matrix, plugin-marketplace (directive) · members, sample-records (`app-table` resolver) · **plugin-credentials, account sessions (mới)** |
| QA chuột phải trên từng màn | Chờ QA người (TC-09 dùng role-matrix; các màn mới cần QA lại) |
