# [RAW-S05-002] Quan hệ cha/con giữa các loại danh mục và vùng chọn dữ liệu con

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S05-002 / Raw requirement / Sprint 05 (change request) |
| Trạng thái | **Approved scope 2026-10-28** — đã trả lời Q1–Q8; chưa code |
| Nguồn | Chủ dự án yêu cầu trực tiếp |
| Liên quan | [ANL-S05-003](../02_analysis/03_ANL-S05-003_catalog_type_relations.md), [CONF-S05-002](../04_confirmation/02_CONF-S05-002_catalog_type_relations.md), [FEAT-30](../07_items/FEAT-30_catalog_core_plugin.md) |

## 1. Yêu cầu nguyên văn

1. “Ngay ở các loại danh mục cũng cần có quan hệ cha con. Ví dụ các dữ liệu của loại xã phường là con của loại tỉnh thành phố.”
2. “Khi chỉnh sửa, thêm mới loại tỉnh thành phố thì theo mỗi quan hệ cha/con của loại thì sẽ có thêm vùng thông tin để pick các dữ liệu con. Có thể chọn con cho 1 hoặc nhiều quan hệ cha/con của loại.”

## 2. Cách hiểu ban đầu

- **Cấp loại (type-level)**: `PROVINCE` là loại cha của `COMMUNE`/`DISTRICT`; quan hệ này phải hiển thị và quản lý được ngay trong màn hình loại danh mục, không chỉ nằm trong dữ liệu `allowed_parent_types` dạng chuỗi.
- **Cấp dữ liệu (item-level)**: khi thêm/sửa một bản ghi (ví dụ một tỉnh), với mỗi quan hệ con của loại (ví dụ `COMMUNE`, `DISTRICT`) có một vùng chọn các bản ghi con; có thể chọn con cho nhiều quan hệ trong cùng màn hình.

## 3. Điểm chưa rõ (cần khách hàng xác nhận)

| # | Câu hỏi | Vì sao quan trọng |
| :--- | :--- | :--- |
| Q1 | “Quan hệ cha/con của loại” là quan hệ **giữa các loại** (PROVINCE → COMMUNE) hay chỉ là quan hệ **giữa các bản ghi** (tỉnh A → xã B)? | Quyết định có thêm bảng `catalog_type_relations` hay chỉ mở rộng UI từ `allowed_parent_types` |
| Q2 | Vùng pick ở màn hình thêm/sửa **loại** chọn **loại con** (COMMUNE, DISTRICT) hay chọn **bản ghi con** (các xã cụ thể)? | Nếu chọn bản ghi con thì cần một bản ghi cha đang được chọn — màn hình loại không có ngữ cảnh đó |
| Q3 | Nếu là bản ghi: vùng pick xuất hiện ở màn hình thêm/sửa **bản ghi tỉnh** hay vẫn ở màn hình **loại tỉnh**? | Xác định component/drawer nào thay đổi |
| Q4 | Một cặp loại cha–con có thể có **nhiều loại quan hệ** (HIERARCHY, CLASSIFICATION, ALLOCATION, CUSTOM) hay chỉ một quan hệ cha/con? | Quyết định khóa duy nhất và UI chọn quan hệ |
| Q5 | Một loại con có thể thuộc **nhiều loại cha** không (ví dụ COMMUNE thuộc cả PROVINCE và DISTRICT)? | Ảnh hưởng validate `min_parents`, picker và dữ liệu địa giới hiện có |
| Q6 | Có cần chọn con cho **nhiều quan hệ trong một lần lưu** (multi-relation) và hiển thị theo tab/section không? | Xác định mô hình UI và transaction |
| Q7 | Áp dụng cho cả **system catalog** (platform) và tenant type, hay chỉ tenant? | Phân quyền và phạm vi dữ liệu |
| Q8 | Dữ liệu địa giới hiện có (34 tỉnh, 3.321 xã) có phải backfill sang mô hình mới không? | Kế hoạch migration và kiểm thử |

## 4. Trả lời xác nhận (2026-10-28)

| # | Kết quả |
| :--- | :--- |
| Q1 | **Cả hai cấp**: quan hệ giữa loại (PROVINCE → COMMUNE) và quan hệ giữa bản ghi (tỉnh A → xã B) |
| Q2 | **Loại con + bản ghi con**: màn hình loại chọn loại con; màn hình bản ghi có picker bản ghi con |
| Q3 | Picker bản ghi con đặt ở **màn hình thêm/sửa bản ghi** (ví dụ tỉnh A) |
| Q4 | **Nhiều loại quan hệ** cho một cặp loại (HIERARCHY/CLASSIFICATION/ALLOCATION/CUSTOM) |
| Q5 | **Một loại con có thể thuộc nhiều loại cha** |
| Q6 | **Lưu riêng từng quan hệ** (không gom nhiều quan hệ vào một lần lưu) |
| Q7 | Áp dụng **cả system catalog và tenant** |
| Q8 | **Backfill** `allowed_parent_types` hiện có sang bảng quan hệ loại |

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Ghi nhận yêu cầu; tách câu hỏi xác nhận | Chủ dự án |
| 0.2 | 2026-10-28 | Chốt Q1–Q8; chuyển sang [CONF-S05-002](../04_confirmation/02_CONF-S05-002_catalog_type_relations.md) Approved | Chủ dự án trả lời |
