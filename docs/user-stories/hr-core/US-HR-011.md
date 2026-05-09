# US-HR-011: Mobile Self-Service HR cơ bản cho Nhân viên

**ID:** US-HR-011  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** mobile  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Trung bình (Should Have)  
**Ước tính:** 5 story points

---

## Persona

- Employee

## Goal

Cho phép nhân viên tự phục vụ trên mobile với phạm vi tối thiểu: hồ sơ cá nhân, hợp đồng và onboarding summary.

## Narrative

> **Là** Nhân viên,  
> **Tôi muốn** xem/cập nhật thông tin liên hệ của bản thân và xem tóm tắt hợp đồng trên ứng dụng mobile,  
> **Để** chủ động kiểm tra thông tin nhân sự mà không cần nhờ HR xử lý thủ công.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có route mobile cho profile, contract summary, onboarding summary
- [ ] Nhân viên chỉ xem được dữ liệu của chính mình
- [ ] Hỗ trợ cập nhật thông tin liên hệ cơ bản từ mobile
- [ ] Hiển thị trạng thái hợp đồng hiện tại và lịch sử tối thiểu của bản thân
- [ ] Có trạng thái offline/loading/error tối thiểu cho từng màn hình
- [ ] Có smoke checklist cho Android build

## Business Rules liên quan

- BR-HR-S03-M01: Self-service chỉ truy cập dữ liệu employee đang đăng nhập
- BR-HR-S03-M02: Không cho chỉnh sửa trường dữ liệu nhạy cảm qua mobile trong Sprint 03
- BR-HR-006: Tài khoản nhân viên nghỉ việc bị vô hiệu hóa sau ngày cuối làm việc

## Dependency

- TASK-SPRINT-03-MOBILE-001
- TASK-SPRINT-02-MOBILE-001
- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-03-HR_CONTRACT-001
- US-HR-004
- US-HR-005
