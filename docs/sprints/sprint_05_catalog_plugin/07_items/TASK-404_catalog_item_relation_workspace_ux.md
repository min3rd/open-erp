# [TASK-404] UX tạo/sửa bản ghi danh mục: workspace quan hệ cha/con theo loại + quan hệ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-404 / Task UX / Sprint 05 (change request) |
| Mức độ / trạng thái | **High** / **Done (QA)** 2026-10-29 — QA pass desktop/mobile, i18n 13 locale, 0 console error |
| Owner / reviewer | Solution Architect (UI) → Developer / QA + chủ dự án |
| Liên quan | [FEAT-31](FEAT-31_catalog_type_relations_child_picker.md) (Done), [FEAT-32](FEAT-32_catalog_tenant_system_type_clone_sync.md) (Done), [TASK-385](TASK-385_catalog_admin_ui.md), [BUG-151](BUG-151_plugin_host_duplicate_header.md) |

## 1. Mục tiêu

Màn **Thêm/Sửa bản ghi danh mục** phải là nơi khai báo quan hệ ngay trong ngữ cảnh bản ghi:

- Tạo/sửa **quan hệ cha/con với loại khác** (ví dụ Tỉnh/Thành phố → Xã/Phường) mà không phải rời màn hình.
- Khai báo **các bản ghi con theo từng loại, từng quan hệ** ngay khi thêm/sửa bản ghi cha.
- Luồng ví dụ: tạo loại `PROVINCE` → thêm bản ghi `Hà Nội` → thêm loại `COMMUNE` là con của `PROVINCE` → trong bản ghi `Hà Nội`, tab `Xã/Phường` → thêm `Phường Hoàn Kiếm` là con.

## 2. Phạm vi UX

### 2.1. Item drawer — tab theo quan hệ

- Drawer thêm/sửa bản ghi chia **tab theo `relation_type`** mà loại của bản ghi tham gia (HIERARCHY/CLASSIFICATION/ALLOCATION/CUSTOM), kèm tab **Thông tin** hiện có.
- Trong mỗi tab, tách rõ 2 vùng:
  - **Là cha** (bản ghi hiện tại là cha): bảng các con, nhóm theo **loại con** (ví dụ Xã/Phường, Quận/Huyện). Mỗi nhóm có bảng con: mã, tên, trạng thái, hiệu lực, thao tác; tìm kiếm + phân trang 10/20/50.
  - **Là con** (bản ghi hiện tại là con): danh sách cha hiện tại + nút thêm cha (picker lọc theo loại cha được phép của loại).
- Nếu một loại có nhiều loại con trong cùng relation: hiển thị sub-tab hoặc nhóm có tiêu đề theo loại con; không tạo tab rời rạc cho từng bản ghi.
- Thêm con: picker tìm kiếm theo loại con + relation; lưu edge ngay (không đóng drawer), cập nhật bảng tại chỗ.
- Thêm nhanh con: nút `+ Tạo <loại con>` mở form nhỏ (mã, tên, trạng thái) và tự tạo edge sau khi lưu; dùng version/effective mặc định của loại.
- Xoá quan hệ: đóng edge (`valid_to`), không xoá bản ghi; xác nhận inline (không modal).

### 2.2. Tạo loại con ngay trong ngữ cảnh

- Trong tab quan hệ có nút `+ Thêm loại con` (nếu người dùng có quyền `catalog:type:manage`): mở type drawer với:
  - `allowed_parent_types`/quan hệ cha đã gán sẵn loại hiện tại;
  - quan hệ mặc định = relation đang xem;
  - sau khi lưu, tự thêm loại mới vào nhóm con của tab và focus vào ô tìm bản ghi con.
- Tương tự `+ Thêm loại cha` ở vùng Là con.

### 2.3. Điều hướng & trạng thái

- **Bản ghi mới chưa lưu**: tab quan hệ hiển thị nhưng disabled kèm hint "Lưu bản ghi trước để thêm quan hệ"; sau khi Lưu thành công, giữ nguyên drawer ở chế độ sửa và bật tab (không đóng/không mất ngữ cảnh). Không tự động lưu ngầm form đang nhập.
- Giữ URL/drawer state khi thêm con (không reload mất form đang nhập); refresh chỉ vùng bảng con.
- Không dùng modal; ưu tiên split-view/drawer xếp tầng.
- Hiển thị tổng số con/cha, empty state hướng dẫn, lỗi cycle/type-not-allowed inline theo mã i18n.
- Mobile: read-only, ẩn toàn bộ nút thêm/sửa; chỉ xem cha/con.

## 3. Tiêu chí nghiệm thu

- [x] Tạo loại `PROVINCE`, thêm `Hà Nội`; trong drawer bản ghi có tab `Phân cấp` với vùng Là cha/Là con.
- [x] Thêm loại `COMMUNE` là con của `PROVINCE` ngay từ drawer bản ghi; sau lưu, tab `Phân cấp` có nhóm `Xã/Phường`.
- [x] Tạo mới bản ghi: tab quan hệ visible nhưng disabled + hint; sau Lưu tự chuyển sang tab quan hệ đầu tiên và giữ drawer.
- [x] `+ Tạo loại cha` / `+ Tạo loại con` đặt **trên cùng** vùng Cha/Con, đúng relation đang xem.
- [x] Mỗi nhóm `Quan hệ · Loại con` có toggle đóng/mở, nút `+ Tạo nhanh` bản ghi con, bảng phân trang 10 dòng/nhóm.
- [x] Tạo loại / tạo nhanh con xong cập nhật tại chỗ, không đóng drawer.
- [x] Thêm/bớt cha cho bản ghi; cycle/loại không được phép bị chặn với mã lỗi rõ ràng.
- [x] Nhiều relation + nhiều loại con: header nhóm `Quan hệ · Loại con` + badge, filter loại con trong tab, không lẫn loại; phân trang/tìm kiếm hoạt động.
- [x] Không mất dữ liệu form khi thêm con; 0 console error; i18n 13 locale; mobile read-only/overflow 0.
- [x] Test backend: edge/type-relation qua API thật PostgreSQL; browser desktop + mobile; cập nhật user guide + TR.

## 4. Quyết định đã chốt (2026-10-28)

1. **Một tab = một quan hệ**, bên trong nhóm theo loại con. Mỗi nhóm có header rõ `Quan hệ · Loại con` + badge (ví dụ `Phân cấp · Xã/Phường`), không tạo tab riêng cho từng loại con. Khi có nhiều nhóm, thêm segmented filter theo loại con trong tab để chuyển nhanh; bảng vẫn tách nhóm để không lẫn loại.
2. **`+ Tạo loại con`** ngay trong tab: mở type drawer prefill loại cha hiện tại + relation đang xem; lưu xong tự thêm nhóm mới và focus ô thêm bản ghi con.
3. **`+ Tạo nhanh con`**: chỉ mã/tên (các field khác lấy default của loại), lưu xong tạo edge ngay; có link mở form đầy đủ để sửa sau.
4. **Cập nhật tại chỗ**: thêm/xoá con hoặc cha chỉ refresh vùng bảng, không đóng drawer, không mất dữ liệu form đang nhập.
5. **Lỗi inline theo mã i18n**: cycle, loại không được phép, trùng edge; mobile read-only ẩn toàn bộ thao tác ghi.
6. **Bản ghi mới chưa lưu**: tab quan hệ disabled + hint “Lưu bản ghi trước”; sau khi Lưu giữ drawer ở chế độ sửa và bật tab (không auto-save ngầm).

## 5. Ghi chú thiết kế

- Ưu tiên **một tab = một relation type**, bên trong nhóm theo loại con; tránh n tab cho n loại con (dễ quá tải khi nhiều loại).
- Bảng con dùng component `app-table` + `app-pagination` sẵn có; picker dùng `catalog-picker` (multi) đã có.
- Tái dùng API hiện tại: `GET /items/{id}` (parents/children), `POST/DELETE /edges`, `GET/PUT /types/{code}/relations`; chỉ thêm endpoint nếu cần batch children theo relation.
- Không thay đổi mô hình dữ liệu; đây là task UI/UX + tối ưu API đọc.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo task từ luồng ví dụ của chủ dự án (Tỉnh → Hà Nội → Xã/Phường → Hoàn Kiếm) | Chủ dự án |
| 0.2 | 2026-10-28 | Chốt: 1 tab/quan hệ + nhóm theo loại con có badge; + tạo loại con; + tạo nhanh con; cập nhật tại chỗ; lỗi inline; unsaved-item disabled | Chủ dự án xác nhận |
| 0.3 | 2026-10-28 | Implement core: `type_code` trong item links, tab quan hệ, vùng Cha/Con nhóm theo loại, thêm/gỡ edge, tạo nhanh con, tạo loại con inline; giữ drawer sau Lưu | Developer |
| 0.4 | 2026-10-28 | UX theo phản hồi: tab hiện disabled khi tạo mới + hint; sau Lưu tự mở tab quan hệ; form tạo loại con luôn hiện (mã + tên) | Developer |
| 0.5 | 2026-10-28 | Sửa tab Thông tin không bị disable khi tạo mới; xác nhận flow tạo mới QA404C → Lưu tự mở Phân cấp; full backend 268 PASS | Developer |
| 0.6 | 2026-10-28 | Theo phản hồi: form tạo loại cha/con lên đầu vùng; mỗi nhóm con có collapse, tạo nhanh bản ghi con, phân trang 10/nhóm | Developer |
| 0.7 | 2026-10-29 | QA PASS: drawer CHA/CON, nhóm COMMUNE 126→127, giữ form khi tạo nhanh, i18n 13 locale, desktop/mobile 390×844 không console error/overflow; cập nhật user guide + TR-S05-004 | QA/QC |
