# US-SA-025: Xác thực Mã số thuế và Email Cục Thuế

**ID:** US-SA-025
**Phân hệ:** System Administration — Tenant Onboarding
**Sprint:** Sprint 01
**Cluster:** Tenant Onboarding
**Loại:** Feature
**Người phụ trách:** TBD
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao (Must Have)
**Story Points:** 5

---

## User Story

> **Là** Đại diện doanh nghiệp,
> **Tôi muốn** thấy thông tin doanh nghiệp được tự động điền từ Mã số thuế,
> **Để** tôi không phải nhập thủ công và biết chắc thông tin là chính xác theo đăng ký pháp lý.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Sau khi nhập MST hợp lệ, hệ thống hiển thị: tên DN pháp lý, địa chỉ, trạng thái hoạt động
- [ ] Hệ thống so khớp email người dùng nhập với email đăng ký Cục Thuế
- [ ] Nếu email không khớp: hiển thị thông báo lỗi và gợi ý email đúng (che khuất một phần: "ph***@company.com")
- [ ] Nếu DN ngừng hoạt động / giải thể: từ chối đăng ký và giải thích lý do rõ ràng
- [ ] Loading state hiển thị khi đang tra cứu MST
- [ ] Timeout sau 10 giây nếu API tra cứu không phản hồi: hiển thị thông báo và nút thử lại

---

## Phụ thuộc

- US-SA-001 (Đăng ký tài khoản DN)
- MSTVerificationAdapter backend (Adapter Pattern — hỗ trợ masothue.com / API Cục Thuế)

---

## Ghi chú kỹ thuật

- Tra cứu MST được thực hiện thông qua **MSTVerificationAdapter** theo Adapter Pattern
- Adapter hiện tại hỗ trợ: masothue.com, API Cục Thuế chính thức
- Tương lai: bổ sung xác thực qua số điện thoại đăng ký Cục Thuế
- Kết quả tra cứu nên được cache ngắn hạn (TTL: 5 phút) để tránh gọi API lặp lại
