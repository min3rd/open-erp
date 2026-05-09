# US-SA-001: Đăng ký Tenant mới trên nền tảng SaaS

**ID:** US-SA-001  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Super Admin,  
> **Tôi muốn** tạo tenant mới trên nền tảng,  
> **Để** doanh nghiệp khách hàng có không gian làm việc riêng biệt và bắt đầu sử dụng hệ thống.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Super Admin có thể tạo tenant mới với thông tin: tên doanh nghiệp, subdomain, email admin, gói dịch vụ
- [ ] Subdomain phải là duy nhất trên toàn hệ thống; hệ thống kiểm tra và báo lỗi nếu đã tồn tại
- [ ] Sau khi tạo thành công, hệ thống tự động gửi email mời Tenant Admin với link đặt mật khẩu
- [ ] Tenant mới mặc định ở trạng thái "trial" với thời hạn 14 ngày
- [ ] Dữ liệu của tenant mới hoàn toàn tách biệt với các tenant khác (tenantId riêng biệt)
- [ ] Super Admin thấy tenant mới trong danh sách quản lý

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**

---

## Ghi chú kỹ thuật
- Tạo MongoDB database/collection riêng theo tenantId
- Email mời dùng template có link kích hoạt hết hạn sau 48 giờ
- Subdomain theo format: `{subdomain}.openerp.vn`
