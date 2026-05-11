# US-SA-005: Quên mật khẩu và đặt lại mật khẩu

**ID:** US-SA-005  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Authentication  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** người dùng quên mật khẩu,  
> **Tôi muốn** đặt lại mật khẩu qua email,  
> **Để** lấy lại quyền truy cập tài khoản của mình một cách an toàn.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Người dùng nhập email trên trang "Quên mật khẩu"; hệ thống gửi email chứa link đặt lại (nếu email tồn tại)
- [ ] Hệ thống luôn hiển thị thông báo "Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn" — không tiết lộ email có tồn tại hay không
- [ ] Link đặt lại mật khẩu chỉ có hiệu lực trong 30 phút
- [ ] Link chỉ dùng được một lần; sau khi dùng hoặc hết hạn, link không còn hợp lệ
- [ ] Mật khẩu mới phải đáp ứng chính sách: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
- [ ] Sau khi đặt lại mật khẩu thành công, toàn bộ refresh token cũ bị thu hồi (bắt buộc đăng nhập lại)
- [ ] Thao tác đặt lại mật khẩu được ghi vào audit log

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **3 story points**
