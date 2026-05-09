# US-SA-002: Quản lý trạng thái và cấu hình Tenant

**ID:** US-SA-002  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Super Admin,  
> **Tôi muốn** xem và quản lý trạng thái của tất cả tenant,  
> **Để** kiểm soát hoạt động nền tảng và can thiệp khi cần thiết.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Super Admin xem được danh sách tất cả tenant với các thông tin: tên, subdomain, gói dịch vụ, trạng thái (trial/active/suspended/terminated), ngày tạo, ngày hết hạn trial
- [ ] Super Admin có thể lọc/tìm kiếm tenant theo tên, trạng thái, gói dịch vụ
- [ ] Super Admin có thể kích hoạt (active) tenant sau khi trial kết thúc
- [ ] Super Admin có thể tạm ngừng (suspended) tenant với lý do ghi rõ
- [ ] Khi tenant bị suspended, toàn bộ API của tenant đó trả về lỗi 403 với thông báo phù hợp
- [ ] Super Admin có thể chỉnh sửa thông tin cơ bản của tenant (tên, email liên hệ, gói dịch vụ)
- [ ] Thay đổi trạng thái tenant được ghi vào audit log

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **3 story points**
