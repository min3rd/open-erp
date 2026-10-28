# [BUG-145] Trang 2 danh sách bản ghi vẫn hiển thị dữ liệu trang 1

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-145 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev+QA) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-402](TASK-402_plugin_data_gateway_grpc.md), `PluginQueryCompiler`, `CatalogGateway`, danh sách bản ghi catalog |

## 1. Mô tả

Ở danh sách bản ghi (ví dụ `PROVINCE`), bấm sang trang 2 thì bảng vẫn hiển thị 20 dòng của trang 1 (mã `1..48`), không đổi dữ liệu.

## 2. Nguyên nhân

- API catalog dùng `page` **0-based** (`page=0` là trang đầu), UI cũng gửi `page` 0-based.
- `PluginQueryCompiler.pageSlice` lại tính `pageNumber = max(1, page)` và `offset = (pageNumber - 1) * size`, nên `page=0` và `page=1` đều cho offset 0; trang 2 (`page=1`) lặp trang 1.
- `CatalogGateway.pageThrough` cũng đang bắt đầu từ `page=1` theo quy ước sai này.

## 3. Hướng sửa

- `pageSlice`: `pageNumber = max(0, page)`, `offset = pageNumber * size`; mặc định page = 0.
- `CatalogGateway.pageThrough` bắt đầu `page = 0`.
- Thêm test `PluginDataGatewayTest.paginationUsesZeroBasedPages`: `page=0,size=1` → `A`; `page=1,size=1` → `B`.

## 4. Kiểm chứng

- API gateway: `page=0` → `1..48`; `page=1` → `51..96`; `page=2` → rỗng (34 tỉnh).
- Browser `/settings/apps/catalog/PROVINCE/...`: bấm `Sau` → `Trang 2/2`, dòng đầu `51` (trước đó là `1`).
- `PluginDataGatewayTest` 17 test PASS.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Fix 0-based pagination + test; QA API/browser PASS | Chủ dự án báo lỗi |
