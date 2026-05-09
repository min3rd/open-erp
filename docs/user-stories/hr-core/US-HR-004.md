# US-HR-004: Quản lý Hồ sơ nhân viên chuẩn HR Core

**ID:** US-HR-004  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** hr-employee  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 8 story points

---

## Persona

- HR Staff
- HR Manager
- Employee

## Goal

Thiết lập nguồn dữ liệu nhân sự chuẩn, bảo mật và có thể chia sẻ nội bộ cho các phân hệ khác.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** tạo và cập nhật hồ sơ nhân viên với các trường chuẩn hóa,  
> **Để** doanh nghiệp có dữ liệu nhân sự nhất quán cho vận hành và báo cáo.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Hệ thống hỗ trợ tạo/cập nhật/xem hồ sơ nhân viên theo schema chuẩn
- [ ] Ràng buộc unique theo tenant cho `employeeCode` và `nationalId`
- [ ] Hệ thống validate độ tuổi lao động tối thiểu theo quy định
- [ ] Trường nhạy cảm (CCCD, tài khoản ngân hàng) được bảo vệ và phân quyền truy cập
- [ ] API nội bộ cung cấp dữ liệu nhân viên cho Office/Sale/Accounting
- [ ] Mọi truy vấn đều bắt buộc tenant filter và không rò rỉ dữ liệu chéo tenant

## Business Rules liên quan

- BR-HR-001: Mỗi nhân viên thuộc một phòng ban chính
- BR-HR-S03-E01: `employeeCode` và `nationalId` không được trùng trong cùng tenant
- BR-HR-S03-E02: Chỉ vai trò có thẩm quyền mới xem đầy đủ dữ liệu nhạy cảm

## Dependency

- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-01-USER-001
- TASK-SPRINT-01-FOUNDATION-004
- TASK-SPRINT-02-SYSTEM_ADMIN-005
- US-HR-008
- US-HR-011
