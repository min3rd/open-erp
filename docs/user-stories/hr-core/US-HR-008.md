# US-HR-008: Giao diện Web Hồ sơ nhân viên

**ID:** US-HR-008  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** frontend  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 8 story points

---

## Persona

- HR Staff
- HR Manager

## Goal

Vận hành danh bạ nhân sự và hồ sơ chi tiết trên web với kiểm soát dữ liệu nhạy cảm theo quyền.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** tìm kiếm, tạo mới và cập nhật hồ sơ nhân viên trên giao diện web,  
> **Để** quản lý thông tin nhân sự tập trung và chính xác.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có màn hình danh sách nhân viên với lọc theo phòng ban, trạng thái, chức danh
- [ ] Có form tạo/cập nhật hồ sơ với validation theo field-level
- [ ] Có màn hình chi tiết hồ sơ gồm thông tin cá nhân, liên hệ, tài liệu đính kèm
- [ ] Trường nhạy cảm được ẩn/hiện theo quyền vai trò
- [ ] Giao diện hỗ trợ tìm kiếm, lọc, phân trang mượt cho danh bạ nhân sự
- [ ] Dữ liệu phòng ban/chức danh dùng chung metadata từ HR structure

## Business Rules liên quan

- BR-HR-001: Nhân viên thuộc một phòng ban chính
- BR-HR-S03-F04: Thông tin nhạy cảm chỉ hiển thị cho vai trò được ủy quyền
- BR-HR-S03-F05: Không cho lưu hồ sơ khi trùng `employeeCode` hoặc `nationalId` trong tenant

## Dependency

- TASK-SPRINT-03-FRONTEND-002
- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-03-HR_ORG-001
- TASK-SPRINT-02-FRONTEND-004
- US-HR-004
- US-HR-006
