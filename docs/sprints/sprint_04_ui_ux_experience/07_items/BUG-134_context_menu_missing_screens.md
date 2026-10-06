# [BUG-134] Context menu thiếu ở danh sách credential và phiên (Q20)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-134 / Bug / Sprint 04 |
| Severity / trạng thái | High (phần đã làm) + Medium (phần còn lại) / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Nguồn | QA tự động TC-09 (grep `appContextMenuTrigger`/`contextMenuItems`) + đối chiếu DES-UI-S04-002 §Q20 |
| depends_on / blocks / parent | TASK-364 / — / [FEAT-27](FEAT-27_list_context_menu.md) |

## 1. Hiện tượng
DES-UI-S04-002 dòng 92 chốt: *"Tất cả màn danh sách (Q20): role-matrix, members, plugin-marketplace, sample-record-list, **danh sách phiên/credential**, và các bảng dùng `shared/components/table`."* Thực tế chỉ có 4 màn đầu có menu (role-matrix + plugin-marketplace qua directive; members + sample-records qua resolver của `app-table`). **Danh sách credential (`plugin-credentials`) và danh sách phiên (account sessions) chưa có.**

## 2. Đã sửa (2026-10-05)
- `plugin-credentials`: thêm `credentialContextMenu(item)` (Sửa / Kiểm tra / Xóa, có `supportsEdit()` và trạng thái `testing()`) + gắn directive lên `<tr>`.
- Account sessions: thêm `sessionContextMenu(session)` (Thu hồi phiên, ẩn với phiên hiện tại) + gắn directive lên thẻ phiên.

## 3. Còn lại (đã làm xong 2026-10-05)
Các **bảng platform** (danh sách tenant, người dùng toàn cục, audit log, admin) đã được gắn `[contextMenuItems]`:
- tenant: Cấp phát/quota, Đóng vai (impersonate), Khóa/Mở khóa (chỉ super admin)
- người dùng: Khóa/Mở khóa, Break-glass
- audit log: Xem chi tiết
- admin: Kích hoạt, Vô hiệu hóa (kèm lý do bảo vệ), Thu hồi, Đặt lại mật khẩu, Tắt 2FA

Không còn phần tồn đọng.

## 4. Kiểm chứng
| Kiểm tra | Kết quả |
| :--- | :--- |
| Build web | **PASS** |
| Wiring | role-matrix, plugin-marketplace (directive) · members, sample-records, **tenant, user, audit, admin** (`app-table` resolver) · **plugin-credentials, account sessions** (directive) |
| Menu thật + nhánh disabled | PASS (TR-S04-001 TC-09) |
