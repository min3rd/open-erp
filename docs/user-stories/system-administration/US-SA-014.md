# US-SA-014: Quản lý phiên đăng nhập đang hoạt động

**ID:** US-SA-014  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Security  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** người dùng,  
> **Tôi muốn** xem và quản lý các phiên đăng nhập đang hoạt động của tài khoản tôi trên các thiết bị khác nhau,  
> **Để** phát hiện và chấm dứt các phiên đăng nhập không rõ nguồn gốc.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Người dùng xem được danh sách phiên đăng nhập đang hoạt động với: thiết bị, trình duyệt, IP address, vị trí địa lý (tên quốc gia/tỉnh), thời gian đăng nhập, lần hoạt động cuối
- [ ] Phiên hiện tại được đánh dấu rõ ràng ("Thiết bị này")
- [ ] Người dùng có thể chấm dứt bất kỳ phiên nào ngoài phiên hiện tại
- [ ] Người dùng có thể chấm dứt tất cả phiên khác cùng lúc ("Đăng xuất khỏi tất cả thiết bị khác")
- [ ] Khi phiên bị chấm dứt, refresh token tương ứng bị thu hồi ngay lập tức
- [ ] Tenant Admin xem được danh sách phiên của tất cả người dùng trong tenant (chỉ xem, không xóa)

---

## Độ ưu tiên: **Trung bình (Should Have)**

## Ước tính: **3 story points**
