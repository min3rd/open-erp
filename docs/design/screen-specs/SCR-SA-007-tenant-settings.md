# SCR-SA-007 — Tenant Settings

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-007 |
| Route | /settings/tenant |
| Luồng liên quan | Cấu hình tenant |
| Mục tiêu | Quản lý thông tin doanh nghiệp, bảo mật, gói dịch vụ |

## 2. Layout và cấu trúc

- Trang dạng tab: Thông tin DN, Bảo mật, Thông báo, Gói dịch vụ.
- Mỗi tab gồm form nhóm trường và nút Lưu.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| tab-group | Header nội dung | horizontal | Chuyển nhóm cấu hình |
| settings-form | Theo tab | grouped form | Validate theo tab |
| logo-upload | Tab thông tin DN | image | Upload logo doanh nghiệp |
| save-button | Footer tab | primary | Lưu từng nhóm cấu hình |

## 4. Trạng thái màn hình

- Unsaved changes cảnh báo khi rời trang.
- Save success/fail theo từng tab.
- Tab read-only tùy role.

## 5. Dữ liệu hiển thị

- companyProfile, securityPolicy, notificationPolicy, subscription.
- Trường ngôn ngữ mặc định map theo chuẩn locale.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Tab ngang + form 2 cột |
| <1024px | Tab thành accordion dọc |
