# [FEAT-31] Quan hệ cha/con giữa loại danh mục + chọn dữ liệu con

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-31 / Feature / Sprint 05 (change request; ưu tiên sau khi chốt) |
| Trạng thái | **To Do** — Approved scope, chưa code (2026-10-28) |
| Owner / reviewer | BA → Architect → Developer / QA + PM |
| Đầu vào | [RAW-S05-002](../01_raw_notes/02_RAW-S05-002_catalog_type_relations.md), [ANL-S05-003](../02_analysis/03_ANL-S05-003_catalog_type_relations.md), [CONF-S05-002](../04_confirmation/02_CONF-S05-002_catalog_type_relations.md) |
| Liên quan | [TASK-402](../07_items/TASK-402_plugin_data_gateway_grpc.md), [FEAT-30](../07_items/FEAT-30_catalog_core_plugin.md) |

## 1. Mục tiêu

Cho phép định nghĩa quan hệ cha/con **giữa các loại danh mục** (PROVINCE → COMMUNE/DISTRICT) với nhiều loại quan hệ; đồng thời khi thêm/sửa **bản ghi** có thể chọn nhiều bản ghi con theo từng quan hệ.

## 2. Phạm vi đã chốt

- Cả cấp loại và cấp bản ghi.
- Type editor: chọn **loại con** (và loại cha) theo từng quan hệ; lưu riêng từng quan hệ.
- Item editor: section theo từng quan hệ + loại con; picker nhiều bản ghi con; lưu riêng từng quan hệ.
- Nhiều loại quan hệ: HIERARCHY, CLASSIFICATION, ALLOCATION, CUSTOM.
- Một loại con có thể thuộc nhiều loại cha.
- Áp dụng system catalog (platform) + tenant; backfill `allowed_parent_types` hiện có.

## 3. Tiêu chí nghiệm thu

- [ ] Bảng `catalog_type_relations` (tenant_id, parent_type_id, child_type_id, relation_type, sort_order, status) + migration/backfill từ `allowed_parent_types` cho mọi schema.
- [ ] API loại: đọc/ghi quan hệ theo từng relation; validate loại, quyền, cycle; system chỉ platform.
- [ ] API bản ghi: đọc nhóm con theo relation; ghi chọn/bỏ con idempotent, một transaction cho mỗi relation.
- [ ] Type drawer: thay ô `allowed_parent_types` bằng picker; có vùng loại con theo từng quan hệ; nút lưu riêng.
- [ ] Item drawer: vùng chọn con cho từng quan hệ của loại (ví dụ tỉnh Hà Nội chọn xã/phường); lưu riêng từng quan hệ.
- [ ] Không phá import/export CSV (`parent_code` vẫn tạo edge), versioning, `min_parents`, descendants.
- [ ] Web + mobile: 0 console error, không tràn ngang 390×844; mobile read-only không thấy vùng sửa.
- [ ] Test backend PostgreSQL thật: nhiều cha, nhiều relation, backfill, cycle, tenant isolation.
- [ ] Docs: API/UI/DB design, user guide, TR cập nhật.

## 4. Ghi chú

- Chưa code cho đến khi Architect cập nhật DES-DB/API/UI tương ứng.
- Nếu triển khai sau Sprint 05, chuyển item sang Sprint 06 và cập nhật reading guide.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo feature từ RAW/ANL/CONF đã chốt | BA Agent |
