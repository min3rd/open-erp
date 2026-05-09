# Frontend Guidelines — Open ERP SaaS Platform

**Phiên bản:** 2.0  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Áp dụng cho:** Angular Web + Ionic Mobile  
**Tham chiếu:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) · [SCREEN-SPECS.md](SCREEN-SPECS.md)

---

## 1. Mục tiêu tài liệu

- Đồng bộ triển khai UI giữa web và mobile theo cùng thiết kế.
- Chuẩn hóa i18n bằng Transloco.
- Chuẩn hóa contract backend để FE render thông điệp đúng ngữ cảnh.
- Khẳng định định hướng Angular web dùng CSS, không dùng SCSS.

---

## 2. Quy ước bắt buộc cho Angular Web

### 2.1 Styling chuẩn Web

- Angular web dùng **CSS** cho toàn bộ component styles.
- Không tạo mới file `.scss` cho web.
- Global styles đặt trong `src/styles.css` và các file `.css` được import từ `styles.css`.
- Design tokens luôn dùng CSS custom properties `var(--token-name)`.

Cấu trúc đề xuất:

```text
src/
  styles.css
  styles/
    tokens.css
    typography.css
    layout.css
    utilities.css
```

### 2.2 Quy tắc token

- Không hardcode màu/spacing/radius trực tiếp trong component.
- Dùng token theo [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Ưu tiên semantic token cho trạng thái: success, warning, error, info.

---

## 3. Internationalization với Transloco

### 3.1 Chuẩn thư viện

- FE dùng `@jsverse/transloco` (Transloco) làm chuẩn duy nhất cho i18n.
- Không dùng lẫn Angular built-in i18n và Transloco trong cùng màn hình.

### 3.2 Cấu trúc key

Quy ước key:

- `scope.screen.element.state`
- Ví dụ:
  - `auth.register.activation.sentTitle`
  - `auth.register.activation.resendCooldown`
  - `system.user.form.email.invalid`

### 3.3 Namespace đề xuất

- `common.*`
- `auth.*`
- `system.*`
- `modules.<moduleName>.*`
- `errors.*`

### 3.4 Quy tắc sử dụng

- Tất cả text hiển thị cho người dùng phải đi qua Transloco.
- Không hardcode chuỗi tiếng Việt trực tiếp trong template/component, trừ prototype tạm thời.
- Screen spec phải tham chiếu `messageKey` tương ứng khi có lỗi nghiệp vụ.

---

## 4. Contract Backend cho thông điệp UI

Backend trả về **key + metadata**, FE dùng Transloco để render.

### 4.1 Contract phản hồi đề xuất

```json
{
  "success": false,
  "code": "REGISTRATION_EMAIL_ALREADY_ACTIVATED",
  "messageKey": "errors.auth.register.activation.alreadyUsed",
  "metadata": {
    "email": "m***@company.com",
    "retryAfterSeconds": 60,
    "maxResendPerDay": 3
  },
  "fieldErrors": [
    {
      "field": "taxCode",
      "messageKey": "errors.auth.register.taxCode.invalid",
      "metadata": {
        "expected": "10_or_13_digits"
      }
    }
  ],
  "requestId": "req_01J..."
}
```

### 4.2 Quy tắc FE xử lý

- Ưu tiên render `messageKey` qua Transloco.
- Dùng `metadata` để nội suy biến động (email ẩn, số giây cooldown, giới hạn gửi lại).
- Với `fieldErrors`, map theo `field` để hiển thị lỗi inline đúng input.
- Nếu thiếu `messageKey`, fallback key mặc định `errors.common.unexpected`.

---

## 5. Định hướng UI Library dùng chung Web và Mobile

### 5.1 Mục tiêu

- Một bộ thiết kế và hành vi nhất quán giữa Angular web và Ionic mobile.
- Tách rõ lớp design token, component API, và adapter nền tảng.

### 5.2 Mô hình thư viện đề xuất

- `open-erp-ui-core`:
  - Token (màu, typography, spacing, motion)
  - Quy ước biến thể component
  - Spec hành vi và accessibility
- `open-erp-ui-web`:
  - Wrapper component cho Angular web (CSS-only)
- `open-erp-ui-mobile`:
  - Wrapper component cho Ionic/Angular mobile

### 5.3 Danh sách component parity ưu tiên

- Button
- Input/Textarea/Select
- Form field + inline validation
- Badge/Chip
- Modal/Drawer
- Toast/Alert
- Data card
- Empty state
- Skeleton/loading state

### 5.4 Quy tắc parity

- Tên variant thống nhất: `primary`, `secondary`, `ghost`, `danger`.
- Trạng thái thống nhất: `default`, `hover` (web), `focused`, `disabled`, `error`, `loading`.
- Mapping nền tảng chỉ khác ở rendering engine, không khác behavior nghiệp vụ.

---

## 6. Cập nhật đặc biệt cho flow đăng ký DN

- Luồng đăng ký DN dùng **activation link qua email**, không dùng OTP nhập tay.
- Các màn hình liên quan:
  - `SCR-AUTH-002`
  - `SCR-AUTH-003`
  - `SCR-AUTH-004`
  - `SCR-AUTH-005`
  - `SCR-AUTH-006`
- CTA gửi lại email kích hoạt phải hỗ trợ cooldown và giới hạn số lần theo metadata backend.

---

## 7. Checklist trước khi bàn giao UI

- [ ] Màn hình dùng đúng mã SCR và đúng flow.
- [ ] Web không dùng SCSS mới, chỉ dùng CSS.
- [ ] 100% text đi qua Transloco key.
- [ ] Xử lý đầy đủ contract `messageKey + metadata + fieldErrors`.
- [ ] Thành phần UI dùng đúng parity với thư viện dùng chung web/mobile.
- [ ] Kiểm thử responsive desktop/tablet/mobile theo screen spec.
