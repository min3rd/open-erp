# US-HR-006: Đồng bộ Cơ cấu tổ chức và Chức danh cho HR

**ID:** US-HR-006  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** hr-org  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 5 story points

---

## Persona

- HR Staff
- HR Manager

## Goal

Đảm bảo danh mục phòng ban/chức danh dùng trong HR luôn nhất quán với System Admin.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** tra cứu và gán phòng ban, chức danh, quản lý trực tiếp theo dữ liệu chuẩn,  
> **Để** hồ sơ nhân viên phản ánh đúng cơ cấu tổ chức hiện hành.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Hệ thống cung cấp danh sách phòng ban/chức danh theo tenant và trạng thái hiệu lực
- [ ] Khi danh mục bị inactive, dữ liệu lịch sử vẫn hiển thị đúng ngữ cảnh
- [ ] Quy tắc xác định `managerId` hợp lệ theo cây tổ chức được áp dụng nhất quán
- [ ] API metadata cơ cấu được dùng chung cho web và mobile
- [ ] Mapping trường dữ liệu HR với catalog System Admin được định nghĩa rõ
- [ ] Truy vấn cơ cấu có filter tenant bắt buộc

## Business Rules liên quan

- BR-HR-001: Nhân viên có một phòng ban chính
- BR-HR-S03-O01: Danh mục inactive không được gán mới nhưng vẫn giữ lịch sử
- BR-HR-S03-O02: `managerId` phải thuộc cùng tenant và trong cây tổ chức hợp lệ

## Dependency

- TASK-SPRINT-03-HR_ORG-001
- TASK-SPRINT-02-SYSTEM_ADMIN-003
- TASK-SPRINT-02-SYSTEM_ADMIN-005
- US-HR-008
- US-HR-010
