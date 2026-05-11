# SCR-HR-009 — Employee Directory List

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-009                                                                   |
| Route           | /hr/employees                                                                |
| Luồng liên quan | FLOW-HR-S03-EMP-001                                                          |
| Mục tiêu        | Tra cứu danh sách nhân viên theo bộ lọc tổ chức, trạng thái và loại hợp đồng |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header và action thêm nhân viên.
- Vùng B: filter bar (keyword, department, position, status).
- Vùng C: bảng danh sách nhân viên.
- Vùng D: pagination và tổng số bản ghi.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính   | Khoảng cách chính           |
| ---------- | ------ | ------------------------- | --------------------------- |
| >=1024px   | 12 cột | Filter + table full width | Gap 16px, row 48px          |
| <1024px    | 4 cột  | Table thành card list     | Padding 16px, card gap 10px |

## 3. Đặc tả component

| Component           | Vị trí | Variant/State                 | Dữ liệu đầu vào       | Ràng buộc hiển thị         |
| ------------------- | ------ | ----------------------------- | --------------------- | -------------------------- |
| employee-filter-bar | Vùng B | expanded, collapsed           | query + filters       | Debounce search 300ms      |
| employee-table      | Vùng C | loading, loaded, empty        | employees[]           | Cột nhạy cảm ẩn theo quyền |
| quick-status-badge  | Vùng C | ACTIVE, PROBATION, TERMINATED | employeeStatus        | Màu theo semantic token    |
| add-employee-button | Vùng A | enabled, disabled             | permissionCreate      | Chỉ role phù hợp thấy      |
| pagination-control  | Vùng D | default                       | page, pageSize, total | Đồng bộ query params       |

## 4. Hành động và phản hồi UI

| Trigger               | Xử lý                       | Phản hồi UI                         |
| --------------------- | --------------------------- | ----------------------------------- |
| Nhập từ khóa          | Gọi API danh sách nhân viên | Skeleton bảng trong khi tải         |
| Chọn bộ lọc phòng ban | Lọc server-side             | Kết quả cập nhật và reset page về 1 |
| Nhấn dòng nhân viên   | Mở SCR-HR-010               | Điều hướng profile detail           |
| Nhấn Thêm nhân viên   | Mở form tạo mới             | Điều hướng với trạng thái create    |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Skeleton row table khi loading.
- Hàng mới tạo được highlight 2 giây.
- Filter chips xuất hiện bằng fade-in.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: lọc và truy cập hồ sơ nhân viên nhanh.
- Validation error: bộ lọc ngày không hợp lệ.
- Locked: hồ sơ đang lock chỉnh sửa bởi phiên khác.
- Permission: ẩn cột dữ liệu nhạy cảm cho role hạn chế.
- No-data: không có nhân viên phù hợp bộ lọc.
- Offline: hiển thị cache gần nhất nếu có.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: employeeCode, fullName, department, position, manager, status, startDate.
- Date hiển thị dd/MM/yyyy.
- Status dùng badge chuẩn ACTIVE/PROBATION/ON_LEAVE/TERMINATED.
