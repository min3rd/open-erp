# [BUG-149] Danh sách hiển thị trùng bản ghi system và bản ghi ghi đè tenant

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-149 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-391](TASK-391_catalog_tenant_override_system_items.md), [BUG-146](BUG-146_catalog_column_sort_missing.md), `catalog.items.admin` |

## 1. Mô tả

Danh sách bản ghi hiển thị **2 dòng cùng mã**: một bản system và một bản tenant override (badge `GHI ĐÈ`). Khi đã có bản ghi tenant ghi đè, chỉ nên hiển thị bản tenant; bản system không còn xuất hiện trong danh sách.

## 2. Nguyên nhân

- `catalog.items.admin` là `LIST` trên `TENANT_OR_SYSTEM`, trả cả row `tenant_id IS NULL` và row tenant cùng `code`.
- Chỉ options/lookup dùng `MERGED_LIST` (merge theo code, tenant thắng); admin list chưa merge.

## 3. Hướng sửa

- Đổi `catalog.items.admin` sang `MERGED_LIST` với `merge_key: "code"` (tenant thắng cả khi INACTIVE), giữ filter/search/sort/page hiện có.
- Migration `V5.3.1` cập nhật manifest descriptor.
- Giữ `catalog.items.merged.options` cho lookup; admin và options cùng quy tắc.

## 4. Kiểm chứng

- [x] Có item system `10003` + tenant override `10003` → danh sách chỉ còn 1 dòng `10003` (tenant, badge `GHI ĐÈ`).
- [x] Xoá/không có override → dòng system hiển thị lại.
- [x] Tổng số bản ghi/pagination khớp số dòng sau merge.
- [x] Sort/filter/page vẫn hoạt động (tenant); system scope giữ nguyên vì không có tenant row cùng code để merge.
- [x] Full backend test + browser PASS.

**Kết quả dev (2026-10-28):** API `q=10003` → 1 item `Xã Tây Phương (tenant)` (`overridden=true`); browser COMMUNE → 1 dòng `10003`, badge `Ghi đè`, không còn dòng system; backend `mvn clean test` 268 PASS / 0 fail / 1 skip.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Chuyển admin list sang MERGED_LIST; migration V5.3.1 | Chủ dự án báo lỗi |
