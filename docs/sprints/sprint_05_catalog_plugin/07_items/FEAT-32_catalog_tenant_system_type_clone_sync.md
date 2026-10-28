# [FEAT-32] Tenant clone & chỉnh sửa loại danh mục hệ thống + sync

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-32 / Feature / Sprint 05 (change request; dự kiến Sprint 06) |
| Severity / trạng thái | **High** / **Approved scope** 2026-10-28 — chờ design/implementation |
| Owner / reviewer | BA → Architect → Developer / QA + PM |
| Liên quan | [TASK-391](TASK-391_catalog_tenant_override_system_items.md), [TASK-402](TASK-402_plugin_data_gateway_grpc.md), [FEAT-31](FEAT-31_catalog_type_relations_child_picker.md) |

## 1. Mục tiêu

Tenant được **sửa loại danh mục hệ thống** bằng cách tạo bản clone thuộc tenant, hoạt động độc lập nhưng có tham chiếu tới loại gốc của system; cho phép **sync** thay đổi từ system vào tenant khi cần.

Hiện tại system type (`tenant_id IS NULL`) bị chặn sửa ở tenant:
- UI `canMutateType` trả false cho system type.
- Backend `CatalogPermissionGuard.requireTypeAccess` trả 403 `CATALOG_TYPE_FORBIDDEN` khi write.
- Tenant chỉ có thể tạo item override cùng mã, chưa có type override.

## 2. Phạm vi đề xuất

### 2.1. Clone khi tenant sửa system type

- Tenant bấm sửa system type → tạo `catalog_types` row mới `tenant_id = tenant`, cùng `code`, có `system_type_id` trỏ loại gốc.
- Clone độc lập: sửa `name_key`, `description_key`, `hierarchy_mode`, `allowed_relations`, `allowed_parent_types`/relations, `max_depth`, `min_parents`, `allow_free_text`, `versioned`, `effective_dated`, `attributes_schema`, `status` không ảnh hưởng system.
- System row giữ nguyên; platform vẫn quản trị system type.
- Lookup/type list hiển thị bản tenant (ưu tiên) + badge `GHI ĐÈ`/`CLONE`; system type vẫn đọc được nếu tenant xoá clone (fallback).

### 2.2. Dữ liệu hệ thống tham chiếu

- Item system thuộc system type vẫn là read-only; tenant có thể tạo item override như hiện tại.
- Clone cần tham chiếu `system_type_id` để:
  - Merge item system + tenant override khi tra cứu.
  - Biết loại gốc khi sync.
- Cần chốt: item/edge system có tự động hiển thị dưới clone không (đề xuất: có, qua `system_type_id`), hay clone bắt đầu rỗng.

### 2.3. Sync từ system → tenant

- API/UI nút `Sync từ hệ thống` trên type clone.
- Đồng bộ metadata loại từ system row (các field cấu hình), giữ `system_type_id`.
- Chính sách xung đột (đề xuất): preview diff; tenant chọn field ghi đè hoặc giữ; không tự overwrite khi system thay đổi (tránh mất cấu hình tenant).
- Có thể sync item/edge system đã fan-out? Fan-out hiện có đã cập nhật system rows trong schema tenant; sync type chỉ metadata.

### 2.4. Xoá / fallback

- Xoá clone → tenant quay lại dùng system type (read-only) hoặc giữ item override.
- Không xoá được system type từ tenant.

## 3. Quyết định đã chốt (2026-10-28)

1. **Clone khi lưu**: tenant mở sửa system type, bấm **Lưu** → tự tạo clone tenant (không cần nút “Tạo bản tenant” riêng). Nếu clone đã tồn tại thì lần lưu sau cập nhật clone.
2. **Clone cả dữ liệu**: clone metadata type **và** toàn bộ item/edge thuộc type (không chỉ metadata). Dữ liệu clone độc lập; system row không đổi.
3. **Sync tất cả**: preview các xung đột (type field, item field/version, edge) và cho chọn cách xử lý từng xung đột: `OVERRIDE` (system thắng), `SKIP` (giữ tenant), `MERGE` (gộp field/giá trị).
4. **Sync item/edge mới ngoài fan-out**: có; sync lấy cả item/edge system mới chưa có trong tenant clone.
5. **Platform sync hộ tenant**: có; platform có thể chạy preview/apply cho một tenant để hỗ trợ kỹ thuật, có audit và không cần quyền tenant.

### 3.1. Quy tắc clone dữ liệu

- Type: tạo row `tenant_id = tenant`, cùng `code`, `system_type_id` trỏ type gốc; copy toàn bộ field cấu hình.
- Item: copy **tất cả version** (kể cả `valid_to` đã đóng) của type system sang item tenant với UUID mới; giữ `version_group_id` mới theo nhóm, `code`, `version`, `valid_from/valid_to`, `attributes`, trạng thái. Thêm `system_item_id` để map sync.
- Edge: copy các edge mà **cả cha và con đều thuộc type được clone**; edge bắc cầu sang type khác giữ nguyên phía system (không clone), tránh tạo edge trỏ chéo sang dữ liệu system không thuộc clone.
- Type relations (FEAT-31): clone các relation của type; `system_relation_id` để sync.
- Idempotent: chạy lại clone/sync không tạo trùng (unique theo `system_type_id`/`system_item_id`/cặp code-version).
- Dữ liệu lớn (COMMUNE 3.321 item): batch 500 qua gateway, có thể resume; trạng thái `clone_state = CLONING|READY`, `synced_at`.

### 3.2. Quy tắc sync & xung đột

- Preview trả danh sách conflict theo `scope = TYPE|ITEM|EDGE|RELATION`, khóa (`field`/`code`/`version`/cặp cha-con), giá trị system, giá trị tenant, hành động mặc định `SKIP`.
- `OVERRIDE`: ghi đè tenant bằng system (với item tạo version mới nếu cần).
- `SKIP`: giữ nguyên tenant.
- `MERGE`: gộp field (JSON/array: union/merge key; text: chọn system hoặc tenant theo preview) — UI cho xem kết quả trước khi apply.
- Sync không tự đổi grant tenant; grant là chính sách tenant.
- Platform sync: endpoint riêng nhận `tenant_id`, kiểm tra platform role, ghi audit operation log.

## 4. Tiêu chí nghiệm thu (draft)

- [ ] Tenant sửa system type → bấm Lưu tạo clone `tenant_id` + `system_type_id`; copy metadata + item + edge; system row không đổi.
- [ ] Clone độc lập: sửa/xoá item clone không ảnh hưởng system/tenant khác; reload giữ dữ liệu.
- [ ] Lookup/options dùng clone; item system + override hiển thị đúng; không lẫn tenant khác.
- [ ] Sync preview hiển thị đủ xung đột type/item/edge/relation; chọn `OVERRIDE/SKIP/MERGE` cho từng mục; apply đúng, không silent overwrite.
- [ ] Sync lấy item/edge mới từ system ngoài fan-out.
- [ ] Platform sync hộ tenant có audit + quyền platform; tenant không thấy dữ liệu tenant khác.
- [ ] Clone/sync dữ liệu lớn (COMMUNE 3.321) hoàn tất idempotent, có thể resume khi lỗi.
- [ ] Test tenant isolation, permission, migration, web/mobile 0 console error; docs API/DB/UI + user guide cập nhật.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo feature từ yêu cầu chủ dự án; chưa chốt chi tiết sync | Chủ dự án |
| 0.2 | 2026-10-28 | Chốt: clone khi Lưu, clone cả item/edge, sync tất cả + preview conflict (override/skip/merge), sync item mới, platform sync hộ tenant | Chủ dự án trả lời |
