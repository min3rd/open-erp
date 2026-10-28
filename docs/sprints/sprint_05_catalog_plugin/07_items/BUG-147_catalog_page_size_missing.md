# [BUG-147] Thiếu lựa chọn số bản ghi mỗi trang

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-147 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev+QA) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | `CatalogAdminComponent`, `PaginationComponent`, route-state `/:pageSize/`, [BUG-145](BUG-145_catalog_pagination_page2_repeats.md) |

## 1. Mô tả

Danh sách bản ghi chỉ dùng cố định 20 dòng/trang; không có dropdown chọn 10/20/50/100. Người dùng không thể tăng số dòng để làm việc hoặc giảm để xem nhanh.

## 2. Hiện trạng / nguyên nhân

- `pageSize` nằm trong URL (`/20/...`) và `CatalogAdminComponent.size`, nhưng UI không có control đổi giá trị.
- `PaginationComponent` chỉ có nút trước/sau và số trang; không có size selector.
- Chưa có giới hạn/allowlist size ở API; cần chốt tối đa (ví dụ 100) để tránh tải lớn.

## 3. Hướng sửa đề xuất

- Thêm select cạnh footer phân trang: `10 / 20 / 50 / 100` (mặc định 20).
- Đổi size → reset page = 0 (URL page 1), cập nhật route-state và gọi lại API.
- API/gateway: validate size trong allowlist và max; descriptor `page.maxSize` tương ứng.
- Hiển thị tổng số bản ghi + khoảng đang xem (`1–20 / 34`).

## 4. Tiêu chí nghiệm thu

- [ ] Chọn 50 → bảng hiển thị tối đa 50 dòng; footer hiển thị đúng tổng/trang.
- [ ] Đổi size khi đang ở trang 2 → quay về trang 1, không mất filter/sort.
- [ ] URL giữ `pageSize`; reload/bookmark đúng.
- [ ] Size ngoài allowlist bị API từ chối (400) hoặc clamp theo spec.
- [ ] Mobile 390×844: select dễ chạm (≥ 40px), không tràn ngang.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug từ yêu cầu chủ dự án | Chủ dự án |
| 0.2 | 2026-10-28 | Thêm select 10/20/50/100 vào `PaginationComponent`; QA 50 → 34 dòng, URL `/50/1/` | Developer/QA |
