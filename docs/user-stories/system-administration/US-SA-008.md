# US-SA-008: Tenant Admin quản lý cơ cấu tổ chức (Phòng ban / Chi nhánh)

**ID:** US-SA-008  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Organization Structure  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** xây dựng cơ cấu tổ chức của doanh nghiệp (phòng ban, chi nhánh) trong hệ thống,  
> **Để** phân nhóm người dùng, phân quyền theo đơn vị tổ chức và hỗ trợ báo cáo chính xác.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin tạo được phòng ban/bộ phận với thông tin: tên, mã, mô tả, phòng ban cha (cho cơ cấu nhiều cấp), trưởng phòng
- [ ] Cơ cấu tổ chức hỗ trợ tối thiểu 5 cấp (Công ty → Chi nhánh → Phòng ban → Tổ → Cá nhân)
- [ ] Tenant Admin xem được org chart dạng cây (tree view)
- [ ] Tenant Admin sửa và xóa phòng ban (chỉ xóa được khi không còn nhân viên hoặc phòng ban con)
- [ ] Người dùng có thể được gán vào một phòng ban chính
- [ ] Thay đổi cơ cấu tổ chức không ảnh hưởng đến dữ liệu lịch sử
- [ ] Thao tác tạo/sửa/xóa phòng ban được ghi audit log

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **3 story points**
