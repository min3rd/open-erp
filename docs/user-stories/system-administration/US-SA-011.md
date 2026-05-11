# US-SA-011: Xem và tra cứu Nhật ký thao tác (Audit Log)

**ID:** US-SA-011  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Audit & Monitoring  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** xem nhật ký thao tác của tất cả người dùng trong doanh nghiệp,  
> **Để** kiểm tra, kiểm toán và phát hiện hoạt động bất thường trong hệ thống.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin xem được danh sách audit log với: thời gian, người thực hiện, module, hành động (create/update/delete/login/logout), tài nguyên bị tác động, kết quả (thành công/thất bại), IP address
- [ ] Hỗ trợ lọc theo: người dùng, khoảng thời gian, module, loại hành động, kết quả
- [ ] Xem chi tiết từng log entry bao gồm: dữ liệu trước khi thay đổi (before) và sau khi thay đổi (after)
- [ ] Audit log không thể bị xóa hoặc sửa đổi qua bất kỳ giao diện nào
- [ ] Tenant Admin xuất được audit log ra định dạng Excel/CSV
- [ ] Dữ liệu audit log phân trang, tối đa 50 bản ghi mỗi trang
- [ ] Tìm kiếm toàn văn trong audit log

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **5 story points**
