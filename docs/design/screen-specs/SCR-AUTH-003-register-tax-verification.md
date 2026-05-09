# SCR-AUTH-003 — Đăng ký DN: Xác nhận thông tin MST

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-003 |
| Route | /register/tax-verification |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Cho người dùng xác nhận dữ liệu DN lấy từ hệ thống thuế |

## 2. Layout và cấu trúc

- Card thông tin pháp lý: tên DN, MST, địa chỉ, trạng thái MST.
- Khu vực chỉnh sửa thông tin bổ sung (tên hiển thị, website, điện thoại).
- Action: Quay lại hoặc Xác nhận và gửi email kích hoạt.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| data-card tax profile | Nội dung chính | elevated | Chỉ đọc dữ liệu pháp lý |
| alert info | Dưới data-card | info | Nhắc nguồn dữ liệu từ Cục Thuế |
| optional-form | Collapsible | optional | Cho phép bổ sung thông tin hiển thị |
| btn-primary | Footer | default | Gửi yêu cầu tạo activation link |

## 4. Trạng thái màn hình

- Loading: skeleton cho card thông tin pháp lý.
- Tax invalid: thông báo DN ngừng hoạt động/không tìm thấy.
- Success: chuyển sang SCR-AUTH-004.

## 5. Dữ liệu hiển thị

- Dữ liệu từ F-SA-011: `legalName`, `taxCode`, `address`, `taxStatus`.
- Dữ liệu bổ sung do người dùng nhập sẽ đi kèm metadata tenant draft.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Card 1 cột giữa màn hình |
| <1024px | Card full width, action cố định cuối màn hình |
