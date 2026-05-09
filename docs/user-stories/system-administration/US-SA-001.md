# US-SA-001: Đăng ký Tài khoản Doanh nghiệp

**ID:** US-SA-001
**Phân hệ:** System Administration — Tenant Onboarding
**Sprint:** Sprint 01
**Cluster:** Tenant Onboarding
**Loại:** Feature
**Người phụ trách:** TBD
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao (Must Have)
**Story Points:** 8

---

## User Story

> **Là** Đại diện doanh nghiệp (Registrant),
> **Tôi muốn** tự đăng ký tài khoản trên hệ thống bằng Mã số thuế của công ty,
> **Để** doanh nghiệp tôi có thể bắt đầu sử dụng nền tảng quản lý mà không cần liên hệ với đội ngũ hỗ trợ.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Trang /register hiển thị form nhập MST, email, mật khẩu
- [ ] Hệ thống tra cứu MST và trả về tên DN chính thức, địa chỉ
- [ ] Nếu MST không hợp lệ hoặc DN ngừng hoạt động → hiển thị thông báo lỗi rõ ràng
- [ ] Email người dùng nhập phải khớp với email đăng ký Cục Thuế → nếu không khớp: thông báo và gợi ý (che khuất email đúng một phần, ví dụ: "ph***@company.com")
- [ ] Hệ thống gửi OTP 6 số về email xác minh, hết hạn 10 phút
- [ ] Nhập OTP đúng → hệ thống tự động tạo tenant, tài khoản Admin, khởi tạo dữ liệu mặc định
- [ ] MST đã đăng ký trước đó → hiển thị thông báo trùng, cung cấp link đăng nhập
- [ ] Sau khi tạo xong → chuyển vào Onboarding Wizard
- [ ] Rate limit: tối đa 5 lần thử đăng ký từ cùng IP trong 1 giờ
- [ ] Toàn bộ form có validation realtime

---

## Persona

- **Tên:** Nguyễn Văn Minh
- **Vai trò:** Giám đốc / Kế toán trưởng / Quản lý IT của doanh nghiệp vừa và nhỏ
- **Đặc điểm:** Muốn dùng thử nhanh, không muốn chờ đội support, cần quy trình đơn giản

---

## Phụ thuộc

- API tra cứu MST (MSTVerificationAdapter) — xem US-SA-025
- Email service (OTP delivery)
- tenant-service: POST /api/v1/register/...

---

## Ghi chú kỹ thuật

- Thiết kế form theo Design System: Cal Sans headline, Inter body, token màu chuẩn
- Mobile-responsive: form phải dùng được tốt trên điện thoại
- Hỗ trợ dark mode
- Subdomain theo format: `{subdomain}.openerp.vn`
