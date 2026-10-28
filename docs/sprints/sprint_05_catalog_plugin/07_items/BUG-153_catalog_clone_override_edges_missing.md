# [BUG-153] Clone bỏ sót edge của item override đã chuyển sang loại clone

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-153 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev+QA retest) 2026-10-28 |
| Phát hiện bởi / ngày | QA / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [FEAT-32](FEAT-32_catalog_tenant_system_type_clone_sync.md), [BUG-152](BUG-152_catalog_sync_preview_out_of_cluster.md) |

## 1. Mô tả

Sau khi clone `COMMUNE`, preview sync báo thiếu vài edge cha–con (ví dụ `PROVINCE/1 → COMMUNE/10003`) dù item đích đã tồn tại dưới dạng override chuyển sang loại clone.

## 2. Nguyên nhân

Edge clone map theo `system_item_id`; item override cũ (tạo trước FEAT-32) không có `system_item_id`, nên không được map → edge tới item đó bị bỏ qua.

## 3. Sửa

- Sau khi chuyển override sang loại clone, map bổ sung theo `code` giữa item tenant và item system trong cùng loại; edge clone dùng map này.

## 4. Kiểm chứng

- [x] Clone lại `COMMUNE`: edge tạo đủ cho item override `10003`; preview sync không còn edge thiếu.
- [x] Item override giữ nguyên tên tenant.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug + fix map override theo code | QA test FEAT-32 |
