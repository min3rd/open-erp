# SCR-SA-005 — Department / Org Chart

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                    |
| --------------- | ------------------------------------------ |
| Mã màn hình     | SCR-SA-005                                 |
| Route           | /settings/departments                      |
| Luồng liên quan | Quản trị cơ cấu tổ chức                    |
| Mục tiêu        | Quản lý cây tổ chức và danh sách phòng ban |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header trang + CTA thêm phòng ban.
- Vùng B: tab chuyển giữa Org Chart và List View.
- Vùng C: nội dung cây tổ chức tương tác.
- Vùng D: bảng danh sách phòng ban và thao tác nhanh.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid    | Vị trí thành phần chính          | Khoảng cách chính           |
| ---------- | ------- | -------------------------------- | --------------------------- |
| >=1024px   | 12 cột  | Tab + vùng cây/bảng full width   | Gap 16px, node gap 12px     |
| <1024px    | 8/4 cột | Ưu tiên list view dạng accordion | Padding 16px, item gap 10px |

## 3. Đặc tả component

| Component             | Vị trí  | Variant/State                | Dữ liệu đầu vào  | Ràng buộc hiển thị                     |
| --------------------- | ------- | ---------------------------- | ---------------- | -------------------------------------- |
| org-tabs              | Vùng B  | chart, list                  | activeTab        | Giữ trạng thái tab khi quay lại màn    |
| org-node-card         | Vùng C  | default, selected, collapsed | departmentNode   | Ẩn thao tác sửa/xóa nếu thiếu quyền    |
| department-table      | Vùng D  | loaded, empty, loading       | departments[]    | Hỗ trợ sort theo tên, số lượng nhân sự |
| department-modal-form | Overlay | create, edit, error          | departmentDetail | Validate tránh self-parent và vòng lặp |

## 4. Hành động và phản hồi UI

| Trigger                   | Xử lý                  | Phản hồi UI                                |
| ------------------------- | ---------------------- | ------------------------------------------ |
| Nhấn Thêm phòng ban       | Mở modal create        | Focus vào trường tên phòng ban             |
| Chọn node trong org chart | Tải chi tiết phòng ban | Highlight node và hiển thị panel thông tin |
| Lưu phòng ban             | Gọi API create/update  | Cập nhật cây/bảng theo thời gian thực      |
| Chọn parent không hợp lệ  | Validate cấu trúc cây  | Hiển thị lỗi và chặn submit                |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Mở/thu node cây dùng transition chiều cao 140ms.
- Node được chọn có viền highlight và shadow nhẹ.
- Chuyển tab có fade ngắn để tránh nhấp nháy nội dung.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: thêm/sửa phòng ban và cấu trúc cây cập nhật thành công.
- Validation error: tên phòng ban trống/trùng, parent không hợp lệ.
- Expired: phiên hết hạn khi lưu.
- Locked: phòng ban bị khóa chỉnh sửa theo chính sách dữ liệu.
- Permission: user chỉ xem không thấy CTA thêm/sửa/xóa.
- No-data: tenant chưa có phòng ban.
- Offline: thao tác lưu thất bại, cho retry.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: departmentId, parentId, managerId, memberCount, status.
- Tên phòng ban tối đa theo giới hạn SRS.
- Lỗi hiển thị theo messageKey + metadata.
