# SCR-AUTH-002 — Đăng ký DN: Nhập thông tin ban đầu

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-002 |
| Route | /register |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Thu thập MST, email đăng ký, mật khẩu ban đầu |

## 2. Layout và cấu trúc

```mermaid
block-beta
  columns 1
  Header[Logo Open ERP]
  Stepper[Stepper đăng ký DN]
  Form[Form MST + Email + Password]
  Actions[Nút Quay lại / Tiếp theo]
```

Stepper mức luồng chính:
- Bước 1: Thông tin DN
- Bước 2: Xác nhận MST
- Bước 3: Kích hoạt email
- Bước 4: Onboarding

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| text-input MST | Form | required | Chỉ nhận 10 hoặc 13 chữ số |
| text-input Email | Form | required | Validate định dạng email |
| password-input | Form | required | Hiển thị meter độ mạnh mật khẩu |
| btn-primary | Footer form | disabled/enabled | Enable khi form hợp lệ |

## 4. Trạng thái màn hình

- Default: chưa nhập dữ liệu.
- Invalid input: hiển thị lỗi inline theo field.
- API rate limit: hiển thị cảnh báo và thời gian chờ.

## 5. Dữ liệu hiển thị

- `taxCode`, `email`, `password`, `confirmPassword`.
- Message lỗi nhận từ backend theo `messageKey` + `metadata`.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Card form giữa màn hình, max-width 560px |
| <1024px | Form full width, padding 16px |
