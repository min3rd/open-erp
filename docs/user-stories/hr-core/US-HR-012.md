# US-HR-012: Kế hoạch kiểm thử tích hợp HR Core Sprint 03

**ID:** US-HR-012  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** testing  
**Loại:** Enabler  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Cao (Must Have)  
**Ước tính:** 5 story points

---

## Persona

- QA Lead
- Product Owner
- HR Manager (UAT)

## Goal

Bảo đảm Sprint 03 đạt tiêu chí "làm đủ flow" thông qua test matrix xuyên suốt backend, web và mobile.

## Narrative

> **Là** QA Lead,  
> **Tôi muốn** có test plan ưu tiên cho các luồng HR Core trọng yếu,  
> **Để** đội dự án nghiệm thu sprint với rủi ro thấp và tiêu chí pass/fail rõ ràng.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có test matrix bao phủ flow tuyển dụng: requisition → candidate → interview → offer/onboarding init
- [ ] Có test case P0/P1 cho hồ sơ nhân viên, hợp đồng lao động và cảnh báo hết hạn
- [ ] Có ma trận quyền cho HR Manager, HR Staff, Employee
- [ ] Có tiêu chí pass/fail rõ cho API, web và mobile
- [ ] Có kế hoạch dữ liệu test đa tenant và dữ liệu biên quan trọng
- [ ] Có checklist regression cuối sprint và điều kiện nghiệm thu UAT

## Business Rules liên quan

- BR-HR-S03-T01: Không nghiệm thu khi flow P0 còn lỗi blocker
- BR-HR-S03-T02: Mọi test kết luận phải truy vết được tới user story tương ứng
- BR-HR-S03-T03: Báo cáo test phải tách rõ lỗi chức năng và lỗi phân quyền dữ liệu

## Dependency

- TASK-SPRINT-03-TESTING-001
- TASK-SPRINT-03-HR_RECRUITMENT-003
- TASK-SPRINT-03-HR_EMPLOYEE-001
- TASK-SPRINT-03-HR_CONTRACT-001
- TASK-SPRINT-03-FRONTEND-004
- TASK-SPRINT-03-MOBILE-001
- US-HR-001
- US-HR-011
