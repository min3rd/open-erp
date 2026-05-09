# US-SA-013: Kích hoạt và quản lý xác thực hai yếu tố (MFA)

**ID:** US-SA-013  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Security  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** người dùng quan tâm đến bảo mật tài khoản,  
> **Tôi muốn** kích hoạt xác thực hai yếu tố (MFA) cho tài khoản của mình,  
> **Để** tài khoản được bảo vệ ngay cả khi mật khẩu bị lộ.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Người dùng vào Cài đặt bảo mật và kích hoạt MFA bằng TOTP (Google Authenticator, Authy...)
- [ ] Khi bật MFA, hệ thống hiển thị QR code để quét bằng app Authenticator; yêu cầu nhập code xác nhận trước khi lưu
- [ ] Hệ thống tạo và hiển thị 8 backup codes để dùng khi mất thiết bị; backup code chỉ hiện một lần
- [ ] Sau khi bật MFA, mỗi lần đăng nhập phải nhập thêm mã OTP 6 số
- [ ] OTP hợp lệ trong window 30 giây ± 1 window (chấp nhận sai lệch đồng hồ nhỏ)
- [ ] Tenant Admin có thể bắt buộc (enforce) MFA cho toàn bộ tenant hoặc theo nhóm role
- [ ] Người dùng có thể tắt MFA bằng cách nhập mã OTP hiện tại
- [ ] Khi tắt/bật MFA được ghi audit log

---

## Độ ưu tiên: **Trung bình (Should Have)**  
## Ước tính: **5 story points**
