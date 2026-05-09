# Flow — Đăng ký doanh nghiệp tự phục vụ (Self-Service)

**Mã flow:** FLOW-AUTH-REGISTER-DN-001  
**Actor chính:** Registrant (Đại diện doanh nghiệp)  
**Mục tiêu:** Hoàn tất đăng ký tenant theo luồng tự phục vụ, bắt buộc kích hoạt email qua activation link.

---

## 1. Tổng quan luồng

- Điểm bắt đầu: Người dùng truy cập trang đăng ký doanh nghiệp.
- Điểm kết thúc: Tenant được kích hoạt, người dùng vào Onboarding Wizard.
- Phụ thuộc nghiệp vụ: F-SA-010, F-SA-011, F-SA-012, F-SA-013, F-SA-014.

## 2. Flow diagram

```mermaid
flowchart LR
  A[SCR-AUTH-002\nNhập thông tin DN\nMST + Email + Password]
  B[SCR-AUTH-003\nXác nhận thông tin MST]
  C[Hệ thống gửi activation email]
  D[SCR-AUTH-004\nThông báo đã gửi email kích hoạt]
  E[Registrant mở email\nclick activation link]
  F{Token hợp lệ?}
  G[SCR-AUTH-005\nKích hoạt thành công]
  H[Tự động tạo tenant + admin user]
    I[SCR-AUTH-006\nOnboarding Wizard]
  X[Trang lỗi link\nexpired/used/invalid]

    A --> B
    B --> C --> D --> E --> F
  F -->|Hợp lệ| G --> H --> I
  F -->|Không hợp lệ| X
```

## 3. Danh sách màn hình trong luồng

1. SCR-AUTH-002 — Nhập thông tin đăng ký doanh nghiệp
2. SCR-AUTH-003 — Xác nhận thông tin MST
3. SCR-AUTH-004 — Đã gửi email kích hoạt
4. SCR-AUTH-005 — Kích hoạt thành công
5. SCR-AUTH-006 — Onboarding Wizard

## 4. Thiết kế tương tác

- Từ SCR-AUTH-004, UI hiển thị rõ email đích đã được ẩn bớt (ví dụ m***@company.com).
- Nút Gửi lại email kích hoạt có cooldown 60s; tối đa 3 lần/24h.
- Khi click activation link:
  - Nếu token hợp lệ: chuyển đến SCR-AUTH-005 và tự động chuyển sang onboarding.
  - Nếu token đã dùng/hết hạn: hiển thị trang lỗi có CTA Gửi lại email kích hoạt.
- Luồng activation là chủ động từ email; không dùng OTP nhập tay cho đăng ký DN.
