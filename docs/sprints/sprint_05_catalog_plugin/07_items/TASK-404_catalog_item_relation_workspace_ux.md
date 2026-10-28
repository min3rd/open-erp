# [TASK-404] UX tạo/sửa bản ghi danh mục: workspace quan hệ cha/con theo loại + quan hệ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-404 / Task UX / Sprint 06 (change request từ Sprint 05) |
| Mức độ / trạng thái | **High** / To Do (2026-10-28) — chờ thiết kế UI chi tiết |
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

- Giữ URL/drawer state khi thêm con (không reload mất form đang nhập); refresh chỉ vùng bảng con.
- Không dùng modal; ưu tiên split-view/drawer xếp tầng.
- Hiển thị tổng số con/cha, empty state hướng dẫn, lỗi cycle/type-not-allowed inline theo mã i18n.
- Mobile: read-only, ẩn toàn bộ nút thêm/sửa; chỉ xem cha/con.

## 3. Tiêu chí nghiệm thu

- [ ] Tạo loại `PROVINCE`, thêm `Hà Nội`; trong drawer bản ghi có tab `Phân cấp` với vùng Là cha/Là con.
- [ ] Thêm loại `COMMUNE` là con của `PROVINCE` ngay từ drawer bản ghi; sau lưu, tab `Phân cấp` có nhóm `Xã/Phường`.
- [ ] Thêm `Phường Hoàn Kiếm` (tạo mới hoặc chọn sẵn) làm con của `Hà Nội`; bảng con cập nhật ngay, reload vẫn giữ.
- [ ] Thêm/bớt cha cho bản ghi; cycle/loại không được phép bị chặn với mã lỗi rõ ràng.
- [ ] Nhiều relation + nhiều loại con: tab/nhóm đúng, không lẫn loại; phân trang/tìm kiếm hoạt động.
- [ ] Không mất dữ liệu form khi thêm con; 0 console error; i18n 13 locale; mobile read-only/overflow 0.
- [ ] Test backend: edge/type-relation qua API thật PostgreSQL; browser desktop + mobile; cập nhật user guide + TR.

## 4. Ghi chú thiết kế

- Ưu tiên **một tab = một relation type**, bên trong nhóm theo loại con; tránh n tab cho n loại con (dễ quá tải khi nhiều loại).
- Bảng con dùng component `app-table` + `app-pagination` sẵn có; picker dùng `catalog-picker` (multi) đã có.
- Tái dùng API hiện tại: `GET /items/{id}` (parents/children), `POST/DELETE /edges`, `GET/PUT /types/{code}/relations`; chỉ thêm endpoint nếu cần batch children theo relation.
- Không thay đổi mô hình dữ liệu; đây là task UI/UX + tối ưu API đọc.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo task từ luồng ví dụ của chủ dự án (Tỉnh → Hà Nội → Xã/Phường → Hoàn Kiếm) | Chủ dự án |
