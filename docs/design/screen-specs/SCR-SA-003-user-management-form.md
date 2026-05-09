# SCR-SA-003 — User Management: Form thêm/sửa

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-003 |
| Route | /settings/users/new hoặc drawer edit |
| Luồng liên quan | Quản trị người dùng |
| Mục tiêu | Tạo mới hoặc cập nhật người dùng trong tenant |

## 2. Layout và cấu trúc

- Nhóm trường: Thông tin cơ bản, Phân công, Bảo mật, Trạng thái.
- Desktop ưu tiên drawer 480px cho edit nhanh.
- Mobile dùng full-screen form.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| form-section | Nội dung | grouped | Chia nhóm rõ ràng |
| select role/department | Phân công | searchable | Lấy dữ liệu động |
| toggle mfa | Bảo mật | switch | Bật/tắt MFA user |
| btn-primary | Footer | save | Validate trước submit |

## 4. Trạng thái màn hình

- Create mode và Edit mode.
- Validation lỗi theo từng field.
- Submit success: đóng drawer và refresh list.

## 5. Dữ liệu hiển thị

- fullName, email, phone, departmentId, roleIds, status, mfaEnabled.
- Lỗi trả về hiển thị qua messageKey + metadata.field.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Drawer 480px |
| <1024px | Full-screen page |
