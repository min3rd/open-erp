# SCR-SA-006 — Audit Log

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-006 |
| Route | /settings/audit-log |
| Luồng liên quan | Kiểm toán hệ thống |
| Mục tiêu | Theo dõi và truy vết thao tác trên tenant |

## 2. Layout và cấu trúc

- Filter bar đa tiêu chí.
- Bảng log theo thời gian giảm dần.
- Drawer chi tiết bản ghi log.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| filter-bar | Đầu trang | multi-filter | Lọc server-side |
| audit-table | Nội dung | dense | Sort theo timestamp |
| action-badge | Cột hành động | semantic color | Map theo loại thao tác |
| detail-drawer | Bên phải | 640px | Xem before/after JSON |

## 4. Trạng thái màn hình

- Không có bản ghi.
- Log chi tiết quá lớn (rút gọn + expand).
- Lỗi quyền truy cập dữ liệu nhạy cảm.

## 5. Dữ liệu hiển thị

- timestamp, actor, action, resource, ipAddress, userAgent, diff.
- Dữ liệu nhạy cảm được mask theo policy.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Table + drawer |
| <1024px | Card list + màn chi tiết riêng |
