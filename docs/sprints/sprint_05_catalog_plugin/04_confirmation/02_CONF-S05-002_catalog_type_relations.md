# [CONF-S05-002] Xác nhận yêu cầu quan hệ cha/con loại danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S05-002 / Confirmation / Sprint 05 (change request) |
| Trạng thái | **Approved 2026-10-28** — đã chốt Q1–Q8; chưa triển khai code |
| Đầu vào | [RAW-S05-002](../01_raw_notes/02_RAW-S05-002_catalog_type_relations.md), [ANL-S05-003](../02_analysis/03_ANL-S05-003_catalog_type_relations.md) |
| Người xác nhận | Chủ dự án / khách hàng |
| Ảnh hưởng DoD | Nếu được duyệt, Sprint 05 mở lại phạm vi hoặc chuyển sang Sprint 06 |

## 1. Bảng quyết định

| # | Câu hỏi | Lựa chọn | Quyết định |
| :--- | :--- | :--- | :--- |
| Q1 | “Quan hệ cha/con của loại” là gì? | (a) Quan hệ giữa **loại** (PROVINCE → COMMUNE); (b) chỉ là quan hệ **bản ghi** hiện có; (c) cả hai | **(c) Cả hai cấp** |
| Q2 | Vùng pick ở màn hình thêm/sửa **loại** chọn gì? | (a) **Loại con**; (b) **bản ghi con**; (c) cả hai | **(a)+(b)**: loại chọn loại con; bản ghi có picker bản ghi con |
| Q3 | Nếu chọn bản ghi con, đặt ở đâu? | (a) Màn hình **bản ghi** (tỉnh A); (b) vẫn màn hình **loại**; (c) cả hai | **(a) Màn hình bản ghi** |
| Q4 | Quan hệ loại có nhiều loại quan hệ? | (a) Chỉ HIERARCHY; (b) hỗ trợ HIERARCHY/CLASSIFICATION/ALLOCATION/CUSTOM | **(b) Nhiều loại quan hệ** |
| Q5 | Một loại con thuộc nhiều loại cha? | (a) Có (COMMUNE thuộc PROVINCE + DISTRICT); (b) Không | **(a) Có, nhiều cha** |
| Q6 | Chọn con cho nhiều quan hệ trong một lần lưu? | (a) Có, theo section/tab; (b) Mỗi lần một quan hệ | **(b) Lưu riêng từng quan hệ** |
| Q7 | Phạm vi system catalog? | (a) Tenant + platform (quyền riêng); (b) Chỉ tenant | **(a) Cả system + tenant** |
| Q8 | Backfill dữ liệu địa giới hiện có? | (a) Tự suy ra, không đổi dữ liệu; (b) Migration sang bảng quan hệ mới | **(b) Backfill `allowed_parent_types` sang bảng quan hệ** |

## 2. Đề xuất mặc định (nếu khách hàng không có yêu cầu khác)

- Q1 = (c), ưu tiên hiển thị quan hệ loại dẫn xuất từ `allowed_parent_types`.
- Q2 = (a) + (b): type editor chọn **loại con**; item editor có picker **bản ghi con**.
- Q3 = (a).
- Q4 = (a) HIERARCHY trước, mở rộng sau.
- Q5 = (a) giữ tương thích dữ liệu hiện tại.
- Q6 = (a).
- Q7 = (a).
- Q8 = (a) trước, migration nếu chuyển sang bảng quan hệ.

## 3. Điều kiện triển khai

- Chỉ bắt đầu code sau khi bảng quyết định trên được chốt và cập nhật trạng thái **Approved**.
- Nếu Approved: tạo FEAT/TASK mới, cập nhật TP/TR, chạy QA web + mobile; không tự động đóng Sprint 05 nếu phát sinh High.
- Nếu Q1/Q2 khác đề xuất: Architect cập nhật ANL/design trước khi code.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bảng xác nhận Q1–Q8; chưa triển khai | BA Agent |
| 0.2 | 2026-10-28 | Khách hàng chốt Q1–Q8; chuyển **Approved**; chưa code | Chủ dự án trả lời |
