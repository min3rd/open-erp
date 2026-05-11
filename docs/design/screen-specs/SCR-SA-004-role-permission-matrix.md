# SCR-SA-004 — Role & Permission Matrix

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                |
| --------------- | -------------------------------------- |
| Mã màn hình     | SCR-SA-004                             |
| Route           | /settings/roles                        |
| Luồng liên quan | Quản trị RBAC                          |
| Mục tiêu        | Quản lý role và cấu hình ma trận quyền |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: danh sách role ở panel trái.
- Vùng B: ma trận quyền theo module và action ở panel phải.
- Vùng C: thanh hành động lưu thay đổi.
- Vùng D: cảnh báo unsaved changes.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid    | Vị trí thành phần chính                          | Khoảng cách chính             |
| ---------- | ------- | ------------------------------------------------ | ----------------------------- |
| >=1200px   | 12 cột  | Panel role 4 cột, matrix 8 cột                   | Gap 16px, row matrix 40px     |
| <1200px    | 8/4 cột | Tách thành 2 màn: role list -> permission detail | Padding 16px, sticky save bar |

## 3. Đặc tả component

| Component         | Vị trí | Variant/State               | Dữ liệu đầu vào                   | Ràng buộc hiển thị                     |
| ----------------- | ------ | --------------------------- | --------------------------------- | -------------------------------------- |
| role-list         | Vùng A | selected, hovered, disabled | roles[], selectedRoleId           | Role hệ thống không cho xóa            |
| permission-matrix | Vùng B | editable, readonly          | modules[], actions[], permissions | Checkbox phụ thuộc cha-con theo module |
| scope-select      | Vùng B | all, own-dept, own          | permissionScope                   | Chỉ hiển thị khi action hỗ trợ scope   |
| save-bar          | Vùng C | hidden, visible, saving     | hasChanges                        | Chỉ hiện khi có thay đổi chưa lưu      |

## 4. Hành động và phản hồi UI

| Trigger                   | Xử lý                             | Phản hồi UI                          |
| ------------------------- | --------------------------------- | ------------------------------------ |
| Chọn role trong danh sách | Tải permission set role đó        | Render matrix tương ứng              |
| Tick/untick quyền         | Cập nhật state ma trận cục bộ     | Đánh dấu unsaved changes             |
| Nhấn Lưu                  | Gọi API cập nhật role permissions | Toast thành công và reset hasChanges |
| Rời trang khi chưa lưu    | Chặn điều hướng                   | Hiển thị modal xác nhận              |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Highlight role được chọn bằng transition nền 120ms.
- Matrix cập nhật trạng thái checkbox tức thời, không reflow toàn bảng.
- Save bar trượt lên từ đáy khi xuất hiện.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: chỉnh quyền và lưu thành công.
- Validation error: cấu hình quyền xung đột (ví dụ có delete nhưng không read).
- Expired: phiên hết hạn khi lưu.
- Locked: role hệ thống bị khóa chỉnh sửa.
- Permission: user chỉ có quyền xem -> matrix readonly.
- No-data: chưa có role tùy chỉnh.
- Offline: lưu thất bại do mất mạng, giữ thay đổi cục bộ.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: roles, permissionsMatrix, permissionScope.
- Quyền hiển thị theo chuẩn resource.action.
- Lỗi nghiệp vụ map messageKey + metadata.
