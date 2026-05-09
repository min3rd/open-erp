# US-SA-007: Tenant Admin tạo và quản lý người dùng

**ID:** US-SA-007  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — User Management  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** tạo và quản lý tài khoản người dùng trong doanh nghiệp của tôi,  
> **Để** kiểm soát ai có quyền truy cập vào hệ thống.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin xem được danh sách tất cả người dùng trong tenant, bao gồm: tên, email, vai trò, phòng ban, trạng thái, lần đăng nhập cuối
- [ ] Tenant Admin tạo được người dùng mới với thông tin: họ tên, email, số điện thoại, phòng ban, vai trò
- [ ] Hệ thống gửi email mời người dùng mới kèm link đặt mật khẩu (hết hạn 48 giờ)
- [ ] Tenant Admin chỉnh sửa được thông tin người dùng (trừ email)
- [ ] Tenant Admin vô hiệu hóa (deactivate) tài khoản người dùng; người dùng bị vô hiệu hóa không thể đăng nhập ngay lập tức
- [ ] Tenant Admin không thể vượt quá số lượng người dùng tối đa theo gói dịch vụ; hiển thị cảnh báo rõ ràng
- [ ] Không thể xóa vĩnh viễn tài khoản — chỉ được phép deactivate
- [ ] Mọi thao tác tạo/sửa/deactivate được ghi vào audit log

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**
