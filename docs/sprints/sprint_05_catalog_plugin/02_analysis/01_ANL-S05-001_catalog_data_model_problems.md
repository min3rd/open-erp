# [ANL-S05-001] Phân tích bài toán dữ liệu danh mục (đa cấp, đa cha, version, hiệu lực thời gian)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S05-001 / Phân tích / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) (R1–R4) |
| Đọc trước / đọc tiếp | RAW-S05-001 / [ANL-S05-002](02_ANL-S05-002_admin_features_permissions_dynamic_forms.md), [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) |

## 1. Mục đích

Chốt **mô hình dữ liệu** cho danh mục trước khi thiết kế CSDL: 4 bài toán R1–R4 có nhiều cách làm (cây, nested set, closure, DAG, bitemporal…) với chi phí khác nhau. Tài liệu này nêu phương án, đánh đổi và **khuyến nghị** để kiến trúc sư chốt ở `05_solutions/`.

## 2. Bài toán 1 — Phân cấp nhiều cấp + nhảy cấp (R1, R2)

| Phương án | Ưu | Nhược | Kết luận |
| :--- | :--- | :--- | :--- |
| **Adjacency list** (mỗi item có `parent_id`) | Đơn giản nhất, sửa/di chuyển dễ | **Không** hỗ trợ nhiều cha (R3); truy vấn cây phải đệ quy | Không đủ cho R3 |
| **Nested set / materialized path** | Đọc cây rất nhanh | Ghi (chèn/di chuyển) đắt; path vỡ khi đa cha | Không phù hợp |
| **Bảng cạnh tường minh** (`parent_id`, `child_id`) | Hỗ trợ đa cha, nhảy cấp tự nhiên (cạnh tỉnh→xã là một dòng), có thể gắn thuộc tính cho **quan hệ** (loại quan hệ, thứ tự, hiệu lực) | Truy vấn tổ tiên/con cháu phải đệ quy (CTE) | **Khuyến nghị** |

**Khuyến nghị**: bảng **cạnh** (edge) là nguồn sự thật cho quan hệ; `catalog_items` **không** có `parent_id`. Nhảy cấp (R2) là hệ quả tự nhiên: `tỉnh → xã` chỉ là một cạnh, không cần "bỏ qua" cấp nào.

## 3. Bài toán 2 — Đa cha / DAG (R3)

Yêu cầu nêu hai tình huống khác nhau về bản chất:

| Ví dụ | Loại quan hệ | Ghi chú |
| :--- | :--- | :--- |
| Công việc ⊂ **Ngành**, Công việc ⊂ **Phân bổ** | Hai quan hệ **khác loại** cùng trỏ về một con | Cần phân biệt bằng `relation_type` (CLASSIFICATION vs ALLOCATION) |
| Lập trình viên ⊂ **CNTT**, Lập trình viên ⊂ **KHDL** | Hai quan hệ **cùng loại**, khác cha | Đa cha thật sự trong cùng một hệ phân loại |

⇒ Một dòng `(parent, child)` đơn thuần **không đủ**: phải có `relation_type`. Bảng cạnh với khóa duy nhất `(parent_id, child_id, relation_type, valid_from)` giải quyết cả hai.

**Hệ quả bắt buộc**:

1. **Chống chu trình**: DAG cấm `A ⊂ B` và `B ⊂ A`. Khi thêm cạnh phải kiểm tra `parent` có nằm trong tập tổ tiên của `child` không (truy vấn đệ quy) → từ chối với mã lỗi riêng (`CATALOG_EDGE_CYCLE`).
2. **Không suy diễn quan hệ bắc cầu**: `tỉnh→huyện`, `huyện→xã` **không** tự sinh `tỉnh→xã`. Nếu nghiệp vụ cần "xã thuộc tỉnh", đó là một cạnh tường minh (đúng như R2 yêu cầu) — tránh hai nguồn sự thật.
3. **Một mục có nhiều cha ⇒ "đường dẫn" không duy nhất**: breadcrumb phải hiển thị theo **một đường đã chọn** (ví dụ đường ngắn nhất hoặc đường của ngữ cảnh đang xem), không được giả định 1 cha.
4. **Di chuyển/gỡ quan hệ**: gỡ cạnh phải kiểm tra không mồ côi (tuỳ chọn: `min_parents` theo loại danh mục).

**Hiệu năng**: truy vấn con cháu dùng `WITH RECURSIVE` + index trên `(parent_item_id)` và `(child_item_id)`. Nếu đo thấy chậm với danh mục lớn (chục nghìn mục), nâng cấp bằng **bảng closure** (`ancestor_id, descendant_id, depth`) bảo trì khi thêm/gỡ cạnh — ghi ở `05_solutions/` như phương án dự phòng, **không** làm ngay (YAGNI).

## 4. Bài toán 3 — Version + hiệu lực theo thời gian (R4)

Hai trục thời gian khác nhau, cần tách bạch:

| Trục | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| **Hiệu lực (valid time)** | Danh mục có hiệu lực từ–đến khi nào | Xã X sáp nhập, hiệu lực đến 2025-06-30 |
| **Phiên bản (version)** | Nội dung thay đổi qua các lần sửa | Đổi tên "Phòng CNTT" → "Phòng Công nghệ thông tin" |

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Chỉ valid_from/valid_to trên bản ghi hiện tại** | Sửa là ghi đè, mất lịch sử | Không đủ R4 |
| **B. Bản ghi versioned + valid time** (khuyến nghị) | Mỗi lần sửa tạo **phiên bản mới** (`version`, `valid_from`, `valid_to`), cùng một `version_group_id`; bản ghi cũ đóng `valid_to` | Đủ R4; truy vấn "as-of" đơn giản; **không** cần bitemporal đầy đủ |
| **C. Bitemporal đầy đủ** (valid time + transaction time) | Lưu cả thời điểm hệ thống biết thông tin | Quá nặng cho ERP giai đoạn này; chỉ cần khi có yêu cầu kiểm toán đặc biệt |

**Khuyến nghị B**, kèm quy tắc:

1. **Không chồng lấn**: hai phiên bản cùng `(tenant, type, code)` không được trùng khoảng hiệu lực → ràng buộc `EXCLUDE USING gist (… , tstzrange(valid_from, valid_to) WITH &&)` của PostgreSQL (cần `btree_gist`). Đây là điểm mạnh của PostgreSQL, tận dụng thay vì tự kiểm tra bằng code.
2. **As-of**: mọi API đọc nhận `as_of` (mặc định `now()`); UI có thể bỏ qua nhưng API phải có để tra cứu lịch sử.
3. **Quan hệ cũng có hiệu lực**: cạnh `tỉnh→xã` có `valid_from/valid_to` riêng (quan hệ bắt đầu/kết thúc độc lập với bản ghi).
4. **Xoá = đóng hiệu lực** (`valid_to = now()`), không xoá vật lý — giữ được lịch sử và không phá tham chiếu từ dữ liệu nghiệp vụ khác.
5. **Sửa tên/mã**: mã (`code`) là định danh nghiệp vụ, **không đổi** giữa các phiên bản; đổi mã = tạo mục mới (tránh phá tham chiếu).

## 5. Bài toán 4 — Danh mục hệ thống vs danh mục tenant

| Loại | `tenant_id` | Ai ghi | Hiển thị |
| :--- | :--- | :--- | :--- |
| **Hệ thống** (tỉnh/huyện/xã, ngành, chuyên ngành) | `NULL` | Platform admin | Mọi tenant đọc |
| **Tenant** (chức danh, phòng ban, danh mục riêng) | tenant | Tenant có quyền | Chỉ tenant đó |

Quy tắc hợp nhất khi trả options cho form: **tenant thắng** theo `code` (tenant có thể ghi đè tên/ẩn mục hệ thống bằng cách tạo bản ghi cùng `code`); danh mục hệ thống bị ẩn cục bộ ghi bằng `status = INACTIVE` ở bản ghi tenant. Cần khách chốt: có cho phép ghi đè/ẩn không (xem `04_confirmation/` Q2).

## 6. Trường hợp biên phải xử lý

| # | Tình huống | Xử lý đề xuất |
| :--- | :--- | :--- |
| E1 | Thêm cạnh tạo chu trình | Từ chối `CATALOG_EDGE_CYCLE` (kiểm tra đệ quy) |
| E2 | Hai phiên bản chồng thời gian | Ràng buộc EXCLUDE ở DB |
| E3 | Cạnh trùng (cùng cha–con–loại, chồng hiệu lực) | Unique + EXCLUDE trên cạnh |
| E4 | Gỡ cạnh làm mục mồ côi | Cảnh báo/Chặn tuỳ `min_parents` của loại |
| E5 | Xoá mục đang được dữ liệu nghiệp vụ tham chiếu | Không xoá cứng; đóng hiệu lực; kiểm tra tham chiếu nếu cần |
| E6 | Tenant tạo mục trùng `code` với hệ thống | Cho phép (ghi đè) hoặc từ chối — **cần khách chốt** |
| E7 | Danh mục rất lớn (chục nghìn mục) cho autocomplete | Phân trang + tìm kiếm theo `code`/`name`; index trigram cho tìm gần đúng |
| E8 | Đổi cấp bậc (di chuyển nhánh) | Gỡ cạnh cũ + thêm cạnh mới, có hiệu lực; kiểm tra chu trình |
| E9 | Đa ngôn ngữ tên danh mục | `name` + bảng dịch theo locale (khách chốt có cần không) |

## 7. Kết luận cho bước thiết kế

1. **Bảng cạnh tường minh** (không `parent_id`), có `relation_type` + hiệu lực ⇒ thoả R1–R3.
2. **Bản ghi versioned + valid time** + ràng buộc EXCLUDE ⇒ thoả R4, không cần bitemporal.
3. **As-of** ở mọi API đọc; xoá là đóng hiệu lực.
4. **Recursive CTE** cho truy vấn cây ở v1; closure table là phương án dự phòng khi có số đo.
5. Bốn điểm cần khách chốt: ghi đè danh mục hệ thống (E6/Q2), phạm vi version hiển thị (Q3), nhập tự do (Q4), đa ngôn ngữ tên danh mục (E9).

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp phân tích R1–R4 | BA Agent; chưa review |
