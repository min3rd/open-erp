# US-SA-019: Quản lý gói dịch vụ và Quota sử dụng

**ID:** US-SA-019  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Subscription  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Super Admin,  
> **Tôi muốn** quản lý gói dịch vụ và kiểm soát quota sử dụng của từng tenant,  
> **Để** đảm bảo mỗi tenant chỉ sử dụng tài nguyên trong phạm vi đã đăng ký.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Super Admin xem được mức sử dụng hiện tại của mỗi tenant: số người dùng active, dung lượng lưu trữ đã dùng, số API calls trong ngày
- [ ] Khi tenant đạt 80% quota, hệ thống gửi cảnh báo tự động cho cả Super Admin và Tenant Admin
- [ ] Khi tenant vượt 100% quota người dùng, hệ thống chặn tạo người dùng mới và hiển thị thông báo nâng cấp gói
- [ ] Super Admin có thể nâng/hạ gói dịch vụ của tenant; thay đổi có hiệu lực ngay lập tức
- [ ] Tenant Admin xem được mức sử dụng hiện tại của tenant mình trong phần Cài đặt
- [ ] Hệ thống ghi nhận lịch sử thay đổi gói dịch vụ

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**
