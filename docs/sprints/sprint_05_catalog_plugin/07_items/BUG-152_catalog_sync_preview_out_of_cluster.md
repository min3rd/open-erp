# [BUG-152] Sync preview liệt kê relation ngoài cụm clone

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-152 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev+QA retest) 2026-10-28 |
| Phát hiện bởi / ngày | QA / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [FEAT-32](FEAT-32_catalog_tenant_system_type_clone_sync.md) |

## 1. Mô tả

Drawer `Sync từ hệ thống` của loại clone `COMMUNE` hiển thị thêm xung đột `RELATION` của cặp `INDUSTRY → JOB` (ngoài cụm `PROVINCE/COMMUNE/DISTRICT`).

## 2. Nguyên nhân

`CatalogSyncService.load` lấy **tất cả** relation system của tenant schema, không lọc theo connected component của loại clone; preview duyệt toàn bộ nên báo thiếu relation ngoài cụm.

## 3. Sửa

- Lọc `systemRelations` theo component trước khi đưa vào `Cluster`; chỉ relation có cả hai đầu trong cụm mới được so sánh/apply.

## 4. Kiểm chứng

- [x] Preview `COMMUNE` chỉ còn conflict thuộc `PROVINCE/COMMUNE/DISTRICT`; không còn `INDUSTRY/JOB`.
- [x] Sync vẫn áp dụng relation trong cụm bình thường.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug + fix filter component | QA test FEAT-32 |
