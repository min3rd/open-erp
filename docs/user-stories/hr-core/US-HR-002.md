# US-HR-002: Quản lý Pipeline Ứng viên và Lịch phỏng vấn

**ID:** US-HR-002  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** hr-recruitment  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 8 story points

---

## Persona

- HR Staff
- Interviewer
- HR Manager

## Goal

Quản lý ứng viên từ tiếp nhận CV đến kết quả phỏng vấn trong một pipeline thống nhất.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** theo dõi ứng viên theo từng stage và lên lịch phỏng vấn,  
> **Để** giảm thất thoát ứng viên và tăng tốc độ tuyển dụng.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] HR Staff nhập hồ sơ ứng viên và liên kết bắt buộc tới một requisition đã tồn tại
- [ ] Hệ thống chỉ cho phép chuyển stage hợp lệ: `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`
- [ ] Hệ thống chặn chuyển stage không hợp lệ và trả mã lỗi nghiệp vụ rõ ràng
- [ ] HR Staff lên lịch phỏng vấn, hệ thống kiểm tra xung đột lịch của interviewer
- [ ] Lịch phỏng vấn phải được tạo trước tối thiểu 24 giờ
- [ ] Khi lịch hợp lệ, hệ thống gửi thông báo email mời phỏng vấn qua Notification Service

## Business Rules liên quan

- BR-HR-S03-R04: Ứng viên phải thuộc đúng requisition và tenant
- BR-HR-S03-R05: Không cho phép lịch phỏng vấn trùng interviewer trong cùng time slot
- BR-HR-S03-R06: Chỉ stage transition hợp lệ mới được ghi nhận vào lịch sử

## Dependency

- TASK-SPRINT-03-HR_RECRUITMENT-002
- TASK-SPRINT-03-HR_RECRUITMENT-001
- TASK-SPRINT-02-SYSTEM_ADMIN-006
- US-HR-001
- US-HR-007
