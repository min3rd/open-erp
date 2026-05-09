# US-SA-010: Gán và thu hồi quyền cho Người dùng

**ID:** US-SA-010  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — RBAC  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** gán vai trò cho người dùng và có thể override quyền riêng lẻ,  
> **Để** đảm bảo mỗi người dùng chỉ có đúng những quyền cần thiết cho công việc của họ.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin vào trang quản lý người dùng và gán một hoặc nhiều role cho user
- [ ] Thay đổi role có hiệu lực ngay lập tức, không cần người dùng đăng xuất và đăng nhập lại
- [ ] Tenant Admin có thể thêm quyền bổ sung (permission override) cho user cụ thể ngoài quyền từ role
- [ ] Tenant Admin có thể thu hồi quyền cụ thể của user (deny override) dù role của họ có quyền đó
- [ ] Quyền được tính theo thứ tự: deny override > allow override > role permissions
- [ ] Xem được tổng hợp quyền hiệu lực của user (effective permissions) từ tất cả nguồn
- [ ] Mọi thay đổi phân quyền được ghi audit log với actor, thời gian, và quyền thay đổi

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**
