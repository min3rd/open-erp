# [TASK-405] Bỏ cụm nút Sửa / Quyền theo loại inline dưới loại đang chọn

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-405 / Task UI / Sprint 06 (change request) |
| Mức độ / trạng thái | **Low** / **Done (QA)** 2026-10-28 — kiểm chứng DOM: chỉ còn nút `⋮`, menu có Sửa/Quyền/Sync |
| Owner / reviewer | Developer / QA + chủ dự án |
| Liên quan | [TASK-385](TASK-385_catalog_admin_ui.md), [TASK-404](TASK-404_catalog_item_relation_workspace_ux.md) |

## 1. Mục tiêu

Giảm rối danh sách loại: khi chọn một loại, **không hiển thị cụm nút inline** `Sửa`, `Quyền theo loại` (và `Sync từ hệ thống` của bản clone) bên dưới loại nữa. Các thao tác đã có trong **menu ba chấm (⋮)** và **context menu chuột phải**.

## 2. Phạm vi

- Xoá block action inline trong type list (`selectedType()?.id === type.id && canEditType(type)`).
- Giữ nguyên `typeContextMenu`: Sửa, Quyền theo loại, DS bản ghi, Thêm bản ghi.
- Bổ sung `Sync từ hệ thống` vào `typeContextMenu` cho loại clone (`is_clone`), để không mất lối vào sync sau khi bỏ inline.
- Không đổi API/backend.

## 3. Tiêu chí nghiệm thu

- [x] Chọn loại bất kỳ: không còn nút Sửa/Quyền/Sync inline dưới loại; vùng danh sách gọn hơn.
- [x] Menu ⋮ và chuột phải vẫn mở Sửa, Quyền theo loại, DS bản ghi, Thêm bản ghi.
- [x] Loại clone có thêm mục `Sync từ hệ thống` trong menu, mở đúng drawer sync.
- [x] Keyboard (Enter/Space trên loại) vẫn chọn loại; mobile read-only không hiện menu hành động.
- [x] 0 console error; build catalog plugin PASS.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo task theo yêu cầu bỏ cụm nút inline, dùng menu ⋮/context menu | Chủ dự án |
| 0.2 | 2026-10-28 | Implement: bỏ block inline; thêm `Sync từ hệ thống` vào `typeContextMenu` cho clone; build UI PASS | Developer |
| 0.3 | 2026-10-28 | QA: selected type chỉ còn `⋮`; menu có Sửa/Quyền/Sync/Thêm bản ghi; build PASS | QA/QC |
