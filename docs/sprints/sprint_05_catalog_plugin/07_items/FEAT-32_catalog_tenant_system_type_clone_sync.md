# [FEAT-32] Tenant clone & chỉnh sửa loại danh mục hệ thống + sync

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-32 / Feature / Sprint 05 (change request; dự kiến Sprint 06) |
| Severity / trạng thái | **High** / To Do (2026-10-28) — cần design + xác nhận chi tiết |
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

## 3. Câu hỏi cần chốt trước khi code

1. Clone tự động khi bấm sửa, hay có nút `Tạo bản tenant` riêng?
2. Clone có copy item/edge hiện có hay chỉ metadata type?
3. Sync metadata overwrite field nào; có preview/confirm không?
4. Có sync được item/edge system mới (ngoài fan-out) không, hay chỉ type?
5. Quyền: `catalog:type:manage` đủ chưa; platform có được sync hộ tenant không?
6. Hiển thị trong danh sách: badge `CLONE`/`GHI ĐÈ`, filter system/clone?
7. Ảnh hưởng `allowed_parent_types` / quan hệ loại FEAT-31 (clone tham chiếu relation system thế nào)?

## 4. Tiêu chí nghiệm thu (draft)

- [ ] Tenant sửa system type → tạo clone `tenant_id` + `system_type_id`; system row không đổi.
- [ ] Clone sửa độc lập; reload giữ cấu hình tenant; tenant khác không thấy.
- [ ] Lookup/options dùng clone; item system + override hiển thị đúng.
- [ ] Sync metadata từ system có preview/confirm; không mất cấu hình tenant ngoài field chọn.
- [ ] Xoá clone fallback system type; không lỗi item/edge.
- [ ] Platform vẫn quản trị system type; tenant không sửa trực tiếp system row.
- [ ] Test tenant isolation, permission, migration (`system_type_id`), web/mobile 0 console error.
- [ ] Docs API/DB/UI + user guide cập nhật.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo feature từ yêu cầu chủ dự án; chưa chốt chi tiết sync | Chủ dự án |
