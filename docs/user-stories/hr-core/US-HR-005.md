# US-HR-005: Quản lý Vòng đời Hợp đồng lao động

**ID:** US-HR-005  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** hr-contract  
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

Quản lý đầy đủ trạng thái hợp đồng lao động và cảnh báo hết hạn để giảm rủi ro pháp lý.

## Narrative

> **Là** HR Manager,  
> **Tôi muốn** quản lý vòng đời hợp đồng từ dự thảo đến thanh lý,  
> **Để** đảm bảo hồ sơ lao động đúng hạn, đúng trạng thái và có lịch sử minh bạch.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Hệ thống hỗ trợ lifecycle `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`
- [ ] HR Staff tạo hợp đồng với ràng buộc ngày hiệu lực hợp lệ
- [ ] Khi hợp đồng đã ở trạng thái `ACTIVE`, nội dung chính không được sửa
- [ ] Hệ thống hỗ trợ gia hạn, thanh lý và lưu lịch sử theo nhân viên
- [ ] Hệ thống phát cảnh báo hợp đồng sắp hết hạn ở mốc 30 ngày và 7 ngày
- [ ] Các thao tác gia hạn/thanh lý không hợp lệ trả mã lỗi nghiệp vụ rõ ràng

## Business Rules liên quan

- BR-HR-002: Cảnh báo hợp đồng hết hạn trong 30 ngày
- BR-HR-007: Lịch sử hợp đồng là bất biến sau khi ký/phê duyệt
- BR-HR-S03-C01: Cảnh báo bổ sung ở mốc 7 ngày trước hạn

## Dependency

- TASK-SPRINT-03-HR_CONTRACT-001
- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-02-SYSTEM_ADMIN-006
- US-HR-004
- US-HR-009
- US-HR-011
