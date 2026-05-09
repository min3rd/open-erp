# US-SA-003: Đăng nhập với email và mật khẩu

**ID:** US-SA-003  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Authentication  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** người dùng (Tenant Admin / Manager / Employee),  
> **Tôi muốn** đăng nhập vào hệ thống bằng email và mật khẩu,  
> **Để** truy cập vào không gian làm việc của doanh nghiệp tôi một cách bảo mật.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Người dùng nhập email và mật khẩu, hệ thống xác thực và cấp JWT access token (hết hạn sau 15 phút) và refresh token (hết hạn sau 7 ngày)
- [ ] Hệ thống nhận diện tenant từ subdomain hoặc tham số trong request để đảm bảo đăng nhập đúng tenant
- [ ] Khi nhập sai mật khẩu 5 lần liên tiếp, tài khoản bị khóa tạm thời 15 phút; thông báo rõ ràng cho người dùng
- [ ] Hệ thống ghi audit log mỗi lần đăng nhập (thành công/thất bại) với: thời gian, IP, user-agent
- [ ] Sau khi đăng nhập thành công, người dùng được chuyển đến Dashboard tương ứng với vai trò
- [ ] Tài khoản bị vô hiệu hóa (inactive) không thể đăng nhập; hiển thị thông báo phù hợp
- [ ] Mật khẩu không được lưu plaintext — phải hash bằng bcrypt

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**
