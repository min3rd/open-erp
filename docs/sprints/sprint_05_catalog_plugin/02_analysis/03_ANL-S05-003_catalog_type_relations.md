# [ANL-S05-003] Phân tích quan hệ cha/con giữa loại danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S05-003 / Analysis / Sprint 05 (change request) |
| Trạng thái | **Approved scope** — Q1–Q8 đã chốt 2026-10-28; chưa code |
| Đầu vào | [RAW-S05-002](../01_raw_notes/02_RAW-S05-002_catalog_type_relations.md) |
| Owner / reviewer | BA Agent / Architect + khách hàng |
| Liên quan | [DES-API-S05-001](../06_designs/api/01_DES-API-S05-001_catalog_api.md), [DES-UI-S05-001](../06_designs/ui/01_DES-UI-S05-001_catalog_admin_ui.md), [FEAT-30](../07_items/FEAT-30_catalog_core_plugin.md) |

## 1. Hiện trạng kỹ thuật

| Hạng mục | Hiện tại | Khoảng trống so với yêu cầu |
| :--- | :--- | :--- |
| Quan hệ loại | `catalog_types.allowed_parent_types VARCHAR(64)[]` lưu **mã loại cha** cho từng loại con; validate khi tạo edge: `parent_type == child_type` hoặc parent code nằm trong `child.allowed_parent_types` (`CatalogEdgeService`) | Chỉ có chiều “con khai báo cha”; không có danh sách con tường minh, không có thứ tự/loại quan hệ ở cấp loại |
| Quan hệ bản ghi | `catalog_item_edges(parent_item_id, child_item_id, relation_type, valid_from/valid_to)`; UI thêm cha **từng bản ghi** trong drawer chi tiết | Chưa có vùng chọn nhiều con theo từng quan hệ của loại |
| UI loại | Drawer thêm/sửa loại nhập `allowed_parent_types` bằng **ô text phân tách dấu phẩy** | Không phải picker; không hiển thị/không chọn được loại con |
| UI bản ghi | Drawer chi tiết có “Thêm cha” (picker một bản ghi cha) | Không có section “con” theo từng loại con/quan hệ |
| Quyền | Tenant không được sửa system type; item system chỉ đọc | Cần xác định phạm vi system catalog cho tính năng mới |

## 2. Phương án

### Phương án A — Dẫn xuất từ `allowed_parent_types` (không đổi schema)

- Loại con khai báo loại cha (giữ nguyên dữ liệu hiện có).
- Màn hình loại hiển thị:
  - Picker nhiều **loại cha** (thay ô text).
  - Danh sách **loại con** suy ra (các loại có `allowed_parent_types` chứa loại đang sửa).
- Màn hình **bản ghi** (ví dụ tỉnh A) thêm section cho từng loại con suy ra; picker chọn nhiều bản ghi con và tạo edges hàng loạt.
- Ưu: không migration, tận dụng dữ liệu/quan hệ sẵn có; ít rủi ro.
- Nhược: không có loại quan hệ/thứ tự ở cấp loại; quan hệ con là suy diễn, không lưu riêng.

### Phương án B — Bảng quan hệ loại tường minh

- Thêm `catalog_type_relations(id, tenant_id, parent_type_id, child_type_id, relation_type, sort_order, status)`.
- Loại cha cấu hình trực tiếp danh sách con + loại quan hệ; `allowed_parent_types` giữ làm cache/validate hoặc bỏ dần.
- Màn hình loại có section theo từng quan hệ (HIERARCHY/CLASSIFICATION/...), chọn nhiều loại con.
- Màn hình bản ghi có picker con theo từng relation.
- Ưu: đúng mô hình “quan hệ của loại”, hỗ trợ nhiều quan hệ/thứ tự.
- Nhược: migration + backfill từ `allowed_parent_types`; nhiều tầng validate; ảnh hưởng API/edge hiện tại.

### Phương án C — A + bảng quan hệ (hybrid)

- Giai đoạn 1: A (picker loại cha/con + bulk child picker) để đáp ứng nhu cầu ngay.
- Giai đoạn 2: bổ sung bảng quan hệ nếu cần nhiều loại quan hệ/thứ tự.

## 3. Quyết định đã chốt (2026-10-28)

Khách hàng chọn **Phương án B** với các điều chỉnh:

- Quan hệ tường minh giữa **loại** và **bản ghi** (cả hai cấp).
- Bảng `catalog_type_relations` là nguồn chính; backfill từ `allowed_parent_types`.
- Mỗi cặp loại cha–con có thể có **nhiều loại quan hệ**; một loại con có thể có nhiều loại cha.
- Type editor chọn **loại con** theo từng quan hệ; item editor chọn **bản ghi con** theo từng quan hệ.
- **Lưu riêng từng quan hệ** (mỗi lần lưu một relation), không gom nhiều relation vào một transaction.
- Áp dụng cho cả system catalog (platform) và tenant.

Chi tiết quyết định: [CONF-S05-002](../04_confirmation/02_CONF-S05-002_catalog_type_relations.md).

## 4. Thiết kế sơ bộ theo phương án B

Theo quyết định đã chốt:

1. API mới/bổ sung:
   - `GET /api/v1/catalog/types/{code}/relations` → quan hệ cha/con + relation.
   - `PUT /api/v1/catalog/types/{code}/relations/{relationType}` nhận `child_type_codes[]` (hoặc `parent_type_codes[]`), lưu riêng từng relation.
   - `GET /api/v1/catalog/items/{id}/children?relation_type=...` → nhóm con theo loại.
   - `PUT /api/v1/catalog/items/{id}/children/{relationType}` nhận `groups: [{child_type_code, child_item_ids}]`; lưu một relation, idempotent, bỏ qua edge đã có.
2. UI:
   - Type drawer: chọn loại con/cha theo từng relation; nút lưu riêng mỗi relation.
   - Item drawer: section theo từng relation + loại con, picker nhiều bản ghi (search + phân trang), lưu riêng từng relation.
3. Validate:
   - Chỉ cho chọn child type nằm trong quan hệ của loại cha.
   - Không tạo cycle; tôn trọng `min_parents`, `allowed_relations`, `max_depth`.
   - System catalog chỉ platform; tenant chỉ sửa loại/relation thuộc tenant.
4. Test:
   - Tạo quan hệ PROVINCE → COMMUNE; chọn 3 xã cho Hà Nội; lưu; reload; xoá 1 xã.
   - Quan hệ nhiều cha (COMMUNE thuộc PROVINCE và DISTRICT) không phá `min_parents`.
   - Import CSV vẫn tạo edge theo `parent_code`.

## 5. Câu hỏi đã chốt

Q1–Q8 đã được khách hàng trả lời và ghi tại [CONF-S05-002](../04_confirmation/02_CONF-S05-002_catalog_type_relations.md). Không còn câu hỏi chặn thiết kế.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Phân tích hiện trạng + 3 phương án; chờ xác nhận | BA Agent |
| 0.2 | 2026-10-28 | Chốt phương án B; thiết kế API/UI sơ bộ; hết câu hỏi chặn | BA Agent |
