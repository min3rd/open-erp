# SCR-SA-005 — Department / Org Chart

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-005 |
| Route | /settings/departments |
| Luồng liên quan | Quản trị cơ cấu tổ chức |
| Mục tiêu | Quản lý cây tổ chức và danh sách phòng ban |

## 2. Layout và cấu trúc

- Tab 1: Cây tổ chức dạng node.
- Tab 2: Danh sách phòng ban dạng bảng.
- Modal thêm/sửa phòng ban.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| org-node-card | Tab cây | interactive | Mở chi tiết phòng ban |
| department-table | Tab danh sách | sortable | Quản lý nhanh |
| modal department-form | Overlay | create/edit | Lưu phòng ban mới |

## 4. Trạng thái màn hình

- Empty org chart.
- Có vòng lặp phòng ban không hợp lệ.
- Loading khi chuyển tab.

## 5. Dữ liệu hiển thị

- departmentId, parentId, managerId, memberCount.
- Validation tránh self-parent và vòng lặp cây.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Org chart trực quan đầy đủ |
| <1024px | Accordion phân cấp theo danh sách |
