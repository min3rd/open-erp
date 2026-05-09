# SCR-SA-002 — User Management: Danh sách

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-002 |
| Route | /settings/users |
| Luồng liên quan | Quản trị người dùng |
| Mục tiêu | Tìm kiếm, lọc và thao tác danh sách người dùng |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: page header, breadcrumb, CTA thêm người dùng.
- Vùng B: thanh bộ lọc (search, vai trò, phòng ban, trạng thái).
- Vùng C: bảng danh sách người dùng + chọn nhiều.
- Vùng D: pagination và tổng số bản ghi.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | Filter bar full width, table chiếm toàn trang | Gap 16px, table row height 48px |
| <1024px | 8/4 cột | Chuyển table thành card list + filter bottom sheet | Padding 16px, card gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| filter-bar | Vùng B | expanded, collapsed | query, role, department, status | Lọc server-side, debounce search 300ms |
| users-table | Vùng C | loading, loaded, empty | users[], sorting, paging | Cột hiển thị theo role của người xem |
| row-action-menu | Vùng C | default, disabled | rowData, permissions | Ẩn action không đủ quyền |
| bulk-action-bar | Vùng C | hidden, visible | selectedIds[] | Chỉ hiện khi chọn >= 1 bản ghi |
| pagination | Vùng D | default | page, pageSize, total | Luôn đồng bộ với query params |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhập từ khóa tìm kiếm | Gọi API danh sách user | Hiển thị loading trong table và cập nhật kết quả |
| Chọn nhiều người dùng | Cập nhật selectedIds | Hiện bulk-action-bar |
| Chọn Khóa tài khoản hàng loạt | Gọi API bulk update status | Toast kết quả + refresh danh sách |
| Nhấn Sửa ở row action | Điều hướng form chỉnh sửa | Mở SCR-SA-003 ở chế độ edit |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Skeleton hàng bảng khi tải dữ liệu.
- Highlight nhẹ hàng mới cập nhật sau thao tác thành công.
- Menu hành động mở bằng fade/scale 120ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: lọc/tìm kiếm chính xác và thao tác thành công.
- Validation error: bộ lọc không hợp lệ (ví dụ ngày bắt đầu > ngày kết thúc).
- Expired: session hết hạn khi gọi API -> chuyển đăng nhập.
- Locked: user mục tiêu đã bị khóa bởi tiến trình khác -> thông báo conflict.
- Permission: không đủ quyền tạo/sửa/xóa -> ẩn action tương ứng.
- No-data: danh sách trống hoặc không có kết quả lọc.
- Offline: hiển thị trạng thái offline, cho phép xem dữ liệu cache (nếu có).

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: userId, fullName, email, role, department, status, createdAt.
- Trạng thái hiển thị dùng semantic badge token.
- Ngày giờ theo timezone tenant; text lỗi theo messageKey + metadata.
