# US-HR-003: Gửi Offer và Khởi tạo Onboarding cơ bản

**ID:** US-HR-003  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** hr-recruitment  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 5 story points

---

## Persona

- HR Staff
- Candidate
- HR Manager

## Goal

Chuyển đổi ứng viên trúng tuyển sang nhân viên mới bằng luồng offer có kiểm soát và khởi tạo onboarding.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** gửi offer cho ứng viên và ghi nhận phản hồi accept/reject,  
> **Để** tự động khởi tạo hồ sơ nhân viên tối thiểu khi ứng viên nhận việc.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] HR Staff gửi offer có thời hạn mặc định 7 ngày
- [ ] Candidate có thể phản hồi trạng thái `ACCEPTED` hoặc `REJECTED`
- [ ] Offer quá hạn 7 ngày tự chuyển trạng thái hết hạn, không cho accept muộn
- [ ] Khi accept, hệ thống tạo employee tối thiểu và kích hoạt tạo user account
- [ ] Luồng accept áp dụng idempotency, callback lặp không tạo trùng employee/user
- [ ] Hệ thống ghi log/audit đầy đủ cho gửi offer và phản hồi

## Business Rules liên quan

- BR-HR-S03-R07: Offer hết hạn sau 7 ngày kể từ thời điểm gửi
- BR-HR-S03-R08: Một offer chỉ được accept một lần hợp lệ
- BR-HR-S03-R09: Sau accept thành công, dữ liệu candidate được liên kết cố định với employee

## Dependency

- TASK-SPRINT-03-HR_RECRUITMENT-003
- TASK-SPRINT-03-HR_RECRUITMENT-002
- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-01-USER-001
- US-HR-002
- US-HR-004
