# SCR-SA-003 — User Management: Form thêm/sửa

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-003 |
| Route | /settings/users/new hoặc drawer edit |
| Luồng liên quan | Quản trị người dùng |
| Mục tiêu | Tạo mới hoặc cập nhật người dùng trong tenant |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: tiêu đề màn hình + trạng thái create/edit.
- Vùng B: form thông tin cơ bản (họ tên, email, số điện thoại).
- Vùng C: form quyền hạn (vai trò, phòng ban, trạng thái).
- Vùng D: hành động Lưu, Hủy.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | Drawer 480px hoặc form 2 cột | Field gap 16px, section gap 20px |
| <1024px | 4 cột | Full-screen form 1 cột | Padding 16px, action sticky cuối |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| text-input-name | Vùng B | default, error | fullName | Bắt buộc, độ dài 2-100 ký tự |
| text-input-email | Vùng B | default, error, disabled | email | Chế độ edit có thể khóa email theo policy |
| role-select | Vùng C | single-select | roles[], selectedRole | Chỉ hiển thị role trong phạm vi quyền admin hiện tại |
| department-select | Vùng C | single/multi | departments[] | Bắt buộc khi role yêu cầu phạm vi phòng ban |
| status-toggle | Vùng C | active, inactive | status | Ẩn ở mode create nếu luôn mặc định active |
| btn-save-user | Vùng D | disabled, loading, enabled | formValidity | Enable khi form hợp lệ và có quyền ghi |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhấn Lưu | Validate form + gọi API create/update | Loading, toast thành công, quay lại SCR-SA-002 |
| Email đã tồn tại | API trả conflict | Hiển thị lỗi inline tại trường email |
| Nhấn Hủy khi có thay đổi chưa lưu | Kiểm tra dirty form | Hiện modal xác nhận rời trang |
| Đổi role | Cập nhật ràng buộc form liên quan | Hiện/ẩn trường bắt buộc theo role |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Drawer trượt vào từ phải 200ms (desktop).
- Lỗi field chuyển màu viền + icon cảnh báo.
- Toast thành công/fail dạng slide-up 180ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: tạo/sửa người dùng thành công và cập nhật danh sách.
- Validation error: thiếu trường bắt buộc, email sai định dạng, role không hợp lệ.
- Expired: session hết hạn lúc submit.
- Locked: tài khoản người dùng đang bị lock bởi chính sách bảo mật.
- Permission: không có quyền gán role cao hơn.
- No-data: danh sách role/phòng ban trống -> hiển thị trạng thái không cấu hình.
- Offline: lưu thất bại do mất mạng -> giữ form và cho thử lại.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: fullName, email, phone, roleId, departmentIds, status.
- Lỗi hiển thị theo messageKey + metadata.field để map đúng trường.
- Số điện thoại định dạng theo chuẩn quốc gia cấu hình tenant.
