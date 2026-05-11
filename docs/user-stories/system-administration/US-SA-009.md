# US-SA-009: Tenant Admin tạo và quản lý Vai trò (Role)

**ID:** US-SA-009  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — RBAC  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** tạo và quản lý các vai trò (roles) với các quyền tương ứng,  
> **Để** kiểm soát chính xác những gì mỗi nhóm người dùng có thể làm trong hệ thống.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin xem danh sách tất cả roles trong tenant, gồm roles hệ thống (không được xóa) và roles tùy chỉnh
- [ ] Tenant Admin tạo được role mới với tên, mô tả và danh sách quyền
- [ ] Hệ thống cung cấp danh sách quyền được tổ chức theo module (System Admin, Sale, HR, Office, Accounting, Dashboard) và action (view, create, update, delete, approve)
- [ ] Tenant Admin gán nhiều quyền cho một role bằng giao diện checkbox dễ sử dụng
- [ ] Tenant Admin xem được tất cả người dùng đang có role đó
- [ ] Khi role bị xóa, hệ thống cảnh báo số người dùng bị ảnh hưởng và yêu cầu xác nhận
- [ ] Không được phép xóa các role hệ thống (Super Admin, Tenant Admin)
- [ ] Mọi thay đổi role được ghi audit log

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **8 story points**
