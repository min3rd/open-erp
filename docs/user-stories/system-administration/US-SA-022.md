# US-SA-022: Phân quyền dữ liệu theo Phòng ban

**ID:** US-SA-022  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — RBAC  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** cấu hình giới hạn phạm vi dữ liệu người dùng có thể xem theo phòng ban,  
> **Để** nhân viên chỉ có thể truy cập dữ liệu của phòng ban mình, không xem được dữ liệu phòng ban khác.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin cấu hình được scope dữ liệu cho role: "Tất cả" / "Phòng ban của mình" / "Chỉ dữ liệu của cá nhân"
- [ ] Khi role được cấu hình scope "Phòng ban", người dùng trong role đó chỉ xem được dữ liệu (đơn hàng, nhân viên, công việc...) thuộc phòng ban của họ
- [ ] Manager có thể xem dữ liệu của tất cả phòng ban thuộc quyền quản lý (cây phòng ban)
- [ ] Scope áp dụng nhất quán trên tất cả phân hệ hỗ trợ data scoping
- [ ] Khi người dùng cố truy cập dữ liệu ngoài phạm vi, hệ thống trả về lỗi 403 (không tiết lộ sự tồn tại của dữ liệu)

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **8 story points**
