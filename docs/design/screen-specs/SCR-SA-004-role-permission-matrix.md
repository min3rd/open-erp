# SCR-SA-004 — Role & Permission Matrix

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-004 |
| Route | /settings/roles |
| Luồng liên quan | Quản trị RBAC |
| Mục tiêu | Quản lý role và cấu hình ma trận quyền |

## 2. Layout và cấu trúc

- Cột trái: danh sách role.
- Cột phải: bảng ma trận quyền theo module và action.
- CTA lưu thay đổi có cảnh báo unsaved changes.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| role-list | Trái | selectable list | Chọn role đang chỉnh |
| permission-matrix | Phải | dense table | Tick theo module/action |
| btn-primary save | Footer | sticky | Lưu cấu hình quyền |

## 4. Trạng thái màn hình

- Chưa chọn role.
- Có thay đổi chưa lưu.
- Không đủ quyền chỉnh sửa (read-only).

## 5. Dữ liệu hiển thị

- role name, description, permission set.
- Scope quyền: ALL, OWN_DEPARTMENT, OWN.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1200px | 2 cột song song |
| <1200px | Tách 2 màn hình: role list -> permission |
