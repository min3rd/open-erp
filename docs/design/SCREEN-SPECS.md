# Screen Specs Index — Open ERP SaaS Platform

**Phiên bản:** 2.1  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Phạm vi:** Sprint 01 (Auth, Onboarding) + Sprint 02 (System Admin)  
**Tham chiếu:** [Design System](DESIGN-SYSTEM.md) · [Frontend Guidelines](FRONTEND-GUIDELINES.md)

---

## 1. Quy ước mã màn hình

Quy ước thống nhất:

- `SCR-<DOMAIN>-<NNN>`
- `DOMAIN`:
  - `AUTH`: Nhóm xác thực, đăng ký, onboarding
  - `SA`: Nhóm System Administration sau đăng nhập
- `NNN`: Số tăng dần 3 chữ số trong từng domain

Ví dụ: `SCR-AUTH-004`, `SCR-SA-007`.

---

## 2. Danh sách flow

- [Flow đăng ký doanh nghiệp tự phục vụ (có activation link)](flows/FLOW-register-doanh-nghiep-self-service.md)

---

## 3. Danh sách screen specs

### 3.1 Nhóm AUTH

1. [SCR-AUTH-001 — Landing / Register Entry](screen-specs/SCR-AUTH-001-landing-register-entry.md)
2. [SCR-AUTH-002 — Đăng ký DN: Nhập thông tin ban đầu](screen-specs/SCR-AUTH-002-register-company-form.md)
3. [SCR-AUTH-003 — Đăng ký DN: Xác nhận thông tin MST](screen-specs/SCR-AUTH-003-register-tax-verification.md)
4. [SCR-AUTH-004 — Đăng ký DN: Đã gửi email kích hoạt](screen-specs/SCR-AUTH-004-register-activation-email-sent.md)
5. [SCR-AUTH-005 — Đăng ký DN: Kích hoạt thành công](screen-specs/SCR-AUTH-005-register-activation-success.md)
6. [SCR-AUTH-006 — Onboarding Wizard](screen-specs/SCR-AUTH-006-onboarding-wizard.md)
7. [SCR-AUTH-007 — Đăng nhập](screen-specs/SCR-AUTH-007-login.md)
8. [SCR-AUTH-008 — MFA](screen-specs/SCR-AUTH-008-login-mfa.md)
9. [SCR-AUTH-009 — Quên mật khẩu: Nhập email](screen-specs/SCR-AUTH-009-forgot-password-request.md)
10. [SCR-AUTH-010 — Quên mật khẩu: Đã gửi email](screen-specs/SCR-AUTH-010-forgot-password-email-sent.md)
11. [SCR-AUTH-011 — Đặt lại mật khẩu](screen-specs/SCR-AUTH-011-reset-password.md)

### 3.2 Nhóm System Administration

1. [SCR-SA-001 — Dashboard tổng quan](screen-specs/SCR-SA-001-dashboard-overview.md)
2. [SCR-SA-002 — User Management: Danh sách](screen-specs/SCR-SA-002-user-management-list.md)
3. [SCR-SA-003 — User Management: Form thêm/sửa](screen-specs/SCR-SA-003-user-management-form.md)
4. [SCR-SA-004 — Role & Permission Matrix](screen-specs/SCR-SA-004-role-permission-matrix.md)
5. [SCR-SA-005 — Department / Org Chart](screen-specs/SCR-SA-005-department-org-chart.md)
6. [SCR-SA-006 — Audit Log](screen-specs/SCR-SA-006-audit-log.md)
7. [SCR-SA-007 — Tenant Settings](screen-specs/SCR-SA-007-tenant-settings.md)
8. [SCR-SA-008 — Notification Preferences](screen-specs/SCR-SA-008-notification-preferences.md)

---

## 4. Template chuẩn cho mọi screen spec

Tất cả file trong `docs/design/screen-specs/` bắt buộc theo đúng thứ tự section sau:

1. **Thông tin màn hình**
2. **Layout chi tiết**
  - Cấu trúc vùng
  - Breakpoint, vị trí thành phần, khoảng cách chính
3. **Đặc tả component**
  - Tên component
  - Vị trí
  - Variant/State
  - Dữ liệu đầu vào
  - Ràng buộc hiển thị
4. **Hành động và phản hồi UI**
  - Trigger
  - Xử lý
  - Phản hồi UI
5. **Hiệu ứng hình ảnh/animation và âm thanh**
  - Mô tả animation/motion có chủ đích
  - Nếu không có âm thanh phải ghi rõ: `Không dùng âm thanh`
6. **Case hiển thị theo luồng nghiệp vụ**
  - Happy path
  - Validation error
  - Expired/Locked/Permission/No-data/Offline (nếu liên quan)
7. **Dữ liệu hiển thị và quy tắc format**

### Checklist nghiệm thu nhanh cho FE/QA

- Có đầy đủ 7 section theo thứ tự chuẩn.
- Có bảng breakpoint và khoảng cách chính.
- Có bảng component gồm đầy đủ dữ liệu đầu vào và ràng buộc hiển thị.
- Có bảng hành động thể hiện rõ trigger -> xử lý -> phản hồi UI.
- Có mô tả animation và có dòng xác nhận âm thanh.
- Có case hiển thị bao phủ tình huống lỗi/vấn đề vận hành phù hợp nghiệp vụ.

---

## 5. Trạng thái tài liệu

- Từ phiên bản 2.1, `SCREEN-SPECS.md` vừa là index vừa là tài liệu chuẩn hóa template chi tiết.
- Tất cả đặc tả chi tiết phải nằm trong các file riêng thuộc thư mục `docs/design/screen-specs/`.
*Tài liệu này mô tả screen specs cho Sprint 01–02. Các sprint tiếp theo sẽ được bổ sung dần theo tiến độ dự án.*
