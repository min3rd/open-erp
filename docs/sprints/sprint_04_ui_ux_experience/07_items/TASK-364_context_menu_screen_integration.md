# [TASK-364] Gắn context menu vào các màn danh sách

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-364 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-363 / — / [FEAT-27](../07_items/FEAT-27_list_context_menu.md) |
| Write scope / baseline | `shared/components/table`, web features role-matrix/members/plugin-marketplace/sample-records |

## 1. Mục tiêu và scope

Gắn menu vào các màn danh sách; hành động gọi **đúng handler** mà nút inline đang gọi. Truy vết AC-08, AC-10 (Desktop-only), Q20.

- Đã gắn: role-matrix (directive trên hàng), members + sample-records (qua `app-table [contextMenuItems]`), plugin-marketplace (directive trên thẻ).
- Giữ nguyên nút inline (menu là lối tắt bổ sung); phân quyền giống hệt nút inline.
- Mobile: không gắn (Q7).

## 2. Các thao tác

- [x] `app-table` nhận `[contextMenuItems]="(row, index) => ContextMenuItem[]"`.
- [x] role-matrix: sửa/gán/xoá (disable + lý do khi thiếu `core:role:manage`; vai trò hệ thống ẩn xoá).
- [x] members: sửa/gán chi nhánh/xoá.
- [x] sample-records: sửa/xoá (gate theo quyền update/delete).
- [x] plugin-marketplace: chi tiết/cài/bật/tắt/nâng cấp/gỡ (disable khi bận/bị khoá).

## 3. Tiêu chí và kiểm chứng

- [ ] QA browser: mở menu mỗi màn, hành động trùng nút inline, disable đúng khi thiếu quyền.
- [x] Build web + mobile PASS.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |
| QA browser từng màn | Not Run | chờ đợt QA |

## 4. Bàn giao và lịch sử

Chưa gắn: plugin-credentials, các màn platform (ngoài danh sách task). Bổ sung cùng cách nếu "tất cả danh sách" bao gồm chúng.
