# SCR-SA-002 — User Management: Danh sách

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-002 |
| Route | /settings/users |
| Luồng liên quan | Quản trị người dùng |
| Mục tiêu | Tìm kiếm, lọc và thao tác danh sách người dùng |

## 2. Layout và cấu trúc

- Page header + breadcrumb + CTA thêm người dùng.
- Filter bar: search, phòng ban, vai trò, trạng thái.
- Bảng dữ liệu + pagination.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| filter-bar | Trên bảng | sticky | Lọc server-side |
| data-table | Nội dung | sortable | Chọn nhiều dòng |
| row-action-menu | Cột cuối | dropdown | Sửa, reset mật khẩu, vô hiệu hóa |
| bulk-action-bar | Trên bảng | contextual | Hiện khi có chọn nhiều |

## 4. Trạng thái màn hình

- Empty list.
- No result theo bộ lọc.
- Loading bảng và lỗi tải dữ liệu.

## 5. Dữ liệu hiển thị

- userId, avatar, họ tên, email, role, phòng ban, trạng thái, ngày tạo.
- Badge trạng thái map theo token semantic.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Bảng đầy đủ cột |
| <1024px | Card list + filter bottom sheet |
