# US-SA-021: Cấu hình kênh thông báo hệ thống

**ID:** US-SA-021  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Notification  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** cấu hình kênh thông báo (email, in-app, mobile push) cho các loại sự kiện khác nhau,  
> **Để** đảm bảo người dùng nhận đúng thông tin qua kênh phù hợp mà không bị quá tải thông báo.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin xem danh sách các loại sự kiện hệ thống có thể gửi thông báo (ví dụ: đăng nhập mới, tài khoản bị khóa, hợp đồng sắp hết hạn)
- [ ] Với mỗi loại sự kiện, Tenant Admin bật/tắt các kênh: in-app, email, mobile push
- [ ] Người dùng cá nhân có thể tùy chỉnh kênh thông báo cho riêng mình (trong giới hạn mà Tenant Admin cho phép)
- [ ] Tenant Admin cấu hình SMTP email server hoặc dùng SMTP mặc định của nền tảng
- [ ] Thông báo quan trọng (bảo mật, hệ thống) không thể bị tắt bởi người dùng
- [ ] Xem lịch sử thông báo đã gửi trong 30 ngày gần nhất

---

## Độ ưu tiên: **Trung bình (Should Have)**  
## Ước tính: **5 story points**
