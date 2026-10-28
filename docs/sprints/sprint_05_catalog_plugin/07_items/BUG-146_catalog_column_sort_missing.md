# [BUG-146] Bảng danh mục thiếu sort khi bấm tên cột

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-146 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **Medium** / Resolved (dev+QA) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | `TableComponent`, `CatalogAdminComponent`, `catalog.items.admin`, [DES-API-S05-001](../06_designs/api/01_DES-API-S05-001_catalog_api.md) |

## 1. Mô tả

Bảng bản ghi danh mục không có sort: bấm vào tiêu đề cột (`Mã`, `Tên`, `Trạng thái`, `Hiệu lực`, `Phiên bản`...) không đổi thứ tự; không có chỉ báo mũi tên asc/desc. Danh sách luôn theo sort cố định trong descriptor (`code ASC`, `version DESC`).

## 2. Hiện trạng / nguyên nhân

- `TableComponent` chỉ render header, không có input/output sort.
- `CatalogItemService.list` không nhận `sort`/`direction`.
- Descriptor `catalog.items.admin` khai báo `sort` cố định; compiler chưa hỗ trợ sort động từ param.
- Danh sách loại (`side panel`) cũng chỉ sort cố định theo code.

## 3. Hướng sửa đề xuất

- UI: header cột có thể sort hiển thị mũi tên; click đổi asc → desc → bỏ sort; lưu `sort`/`direction` vào route-state (URL) như filter/page hiện tại.
- API: `GET /api/v1/catalog/types/{code}/items?sort=name&direction=asc` (allowlist: `code`, `name`, `sort_order`, `status`, `valid_from`, `version`, `created_at`); `GET /types?sort=...` nếu áp dụng.
- Gateway: bổ sung descriptor hỗ trợ sort động (ví dụ `sort_param` + `direction_param` với allowlist field) hoặc nhiều descriptor theo cột; không nhận SQL từ client.
- Validate: field ngoài allowlist → 400; giữ sort mặc định khi không truyền.

## 4. Tiêu chí nghiệm thu

- [ ] Bấm `Tên` → sort A→Z, bấm lần nữa → Z→A, lần 3 → mặc định.
- [ ] Sort kết hợp filter/page đúng; URL giữ sort khi reload/bookmark.
- [ ] Sort trên cả bảng list và cây/đa cha nếu áp dụng.
- [ ] 0 console error; mobile 390×844 không tràn ngang, touch header ≥ 40px.
- [ ] Test backend: allowlist, asc/desc, phân trang sau sort, tenant isolation.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug từ yêu cầu chủ dự án | Chủ dự án |
| 0.2 | 2026-10-28 | Gateway sort động (allowlist), API `sort/direction`, header click + mũi tên, URL `name-asc`; QA PASS |
| 0.3 | 2026-10-28 | Fix desc: thêm sort vào cache key `loadItemsIfNeeded`; test asc/desc | Developer/QA | Developer/QA |
