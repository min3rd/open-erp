# US-SA-026: Super Admin phê duyệt đăng ký Doanh nghiệp

**ID:** US-SA-026
**Phân hệ:** System Administration — Tenant Management
**Sprint:** Sprint 02
**Cluster:** Tenant Management
**Loại:** Feature
**Người phụ trách:** TBD
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Trung bình (Should Have)
**Story Points:** 5

---

## User Story

> **Là** Super Admin,
> **Tôi muốn** xem xét và phê duyệt hoặc từ chối các yêu cầu đăng ký doanh nghiệp mới,
> **Để** tôi có thể kiểm soát chất lượng doanh nghiệp sử dụng nền tảng khi hệ thống cần xét duyệt thủ công.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Super Admin thấy danh sách tenant đang ở trạng thái PENDING_VERIFICATION
- [ ] Mỗi entry hiển thị: tên DN, MST, email, thông tin từ MST lookup, thời gian đăng ký
- [ ] Super Admin có thể duyệt → tenant chuyển sang TRIAL, gửi email chào mừng tới DN
- [ ] Super Admin có thể từ chối kèm lý do → gửi email thông báo từ chối với lý do cụ thể
- [ ] Super Admin có thể cấu hình platform: bật/tắt Manual Review Mode (REQUIRE_MANUAL_REVIEW)

---

## Phụ thuộc

- US-SA-001 (Đăng ký tài khoản DN)
- US-SA-025 (Xác thực MST và Email Cục Thuế)

---

## Ghi chú kỹ thuật

- Chỉ áp dụng khi cấu hình `REQUIRE_MANUAL_REVIEW = true` trên platform
- Khi `REQUIRE_MANUAL_REVIEW = false` (mặc định): tenant được tạo trực tiếp với trạng thái TRIAL sau khi xác minh OTP
- Thông báo duyệt/từ chối gửi qua notification-service
