# [BUG-155] Mobile catalog: vùng bản ghi bị cắt, không thể cuộn tới bảng dữ liệu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-155 / Bug chức năng / Sprint 06 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-14/AC-19](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-420](TASK-420_catalog_web_component_migration.md), `plugins/catalog/web`, `CatalogBrowsePage` |

## 1. Mô tả

Trên Ionic 390×844, trang **Tra cứu danh mục** chỉ hiển thị danh sách loại danh mục. Vùng bản ghi (bảng) nằm ngoài viewport và không có phần tử cuộn nào để tới được.

Đo thực tế (Xã/Phường đang chọn):

- Viewport: 390×844; `op-catalog-app` cao 795px, `scrollHeight = clientHeight = 795`.
- `<table>` có `getBoundingClientRect().top = 1013`, `bottom = 2035` → nằm hoàn toàn dưới viewport.
- Không có element nào có `overflow-y: auto|scroll` và `scrollHeight > clientHeight` (0 scrollable).
- `ion-content scrollY="false"`, catalog layout dùng `overflow-hidden` + chiều cao cố định nên phần bảng bị cắt.

Ảnh hưởng: người dùng mobile không xem được bản ghi danh mục — chức năng tra cứu read-only mất tác dụng dù dữ liệu đã tải.

## 2. Các bước tái hiện

1. Đăng nhập Ionic 390×844 bằng `e2e-tenant@example.com`.
2. Mở **Tra cứu danh mục** (`/settings/catalog`).
3. Chọn loại **Xã/Phường** (đang mặc định).
4. Quan sát: chỉ thấy danh sách loại; bảng bản ghi không xuất hiện.
5. Thử vuốt/scroll: không có vùng cuộn.

**Mong muốn:** danh sách loại và bảng bản ghi đều truy cập được (scroll trong trang hoặc panel riêng).
**Thực tế:** bảng bị cắt dưới đáy, không cuộn được.

## 3. Bằng chứng

- [Ảnh mobile catalog 390×844](../08_testing/evidence/sprint_06/13_mobile_catalog_readonly_390.png)
- [Số đo DOM](../08_testing/evidence/sprint_06/mobile-catalog-measure.json): table top 1013px; 0 scrollable container; `documentElement.scrollWidth = 390` (không tràn ngang).

## 4. Hướng sửa đề xuất

- Cho phép `ion-content` cuộn (`scrollY=true`) hoặc đặt vùng catalog trong container `overflow-y:auto` có `min-h-0`.
- Bỏ `overflow-hidden`/chiều cao cố định gây cắt ở breakpoint mobile; giữ split-view chỉ cho desktop.
- Bổ sung regression mobile: bảng bản ghi phải render trong viewport hoặc cuộn tới được.

## 5. Cách sửa & kiểm chứng

- Mobile dùng layout block: vùng nội dung cuộn dọc, danh sách loại giới hạn `max-h-80` (320px), section bảng `h-auto`, bảng không bị `overflow-hidden` cắt.
- **Kiểm chứng:** 390×844, `tableTop=577`, `asideH=320`, overflow 0; bảng bản ghi hiển thị và cuộn được; ảnh `evidence/sprint_06_retest/14_mobile_catalog_fixed.png`.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA browser 390×844 | TR-S06-001 / TASK-423 |
| 0.2 | 2026-10-29 | Fixed mobile catalog layout; QA re-test PASS | Developer/QA |
