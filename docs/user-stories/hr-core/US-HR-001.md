# US-HR-001: Tạo và phê duyệt Nhu cầu tuyển dụng

**ID:** US-HR-001  
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
- HR Manager
- Department Manager

## Goal

Chuẩn hóa quy trình tạo requisition theo tenant và luồng phê duyệt trước khi đăng tuyển.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** tạo nhu cầu tuyển dụng và gửi HR Manager phê duyệt,  
> **Để** doanh nghiệp kiểm soát kế hoạch tuyển dụng theo đúng cơ cấu và ngân sách.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] HR Staff tạo requisition với các trường bắt buộc: vị trí, phòng ban, số lượng, hạn tuyển
- [ ] Hệ thống kiểm tra `numberOfPositions >= 1` và `deadline` lớn hơn ngày hiện tại
- [ ] HR Manager có thể duyệt hoặc từ chối requisition kèm lý do
- [ ] Hệ thống lưu audit metadata cho thao tác duyệt/từ chối (`approvedBy`, `approvedAt`, `reason`)
- [ ] Requisition chỉ được chuyển sang trạng thái sẵn sàng đăng tuyển khi đã duyệt
- [ ] Mọi thao tác đều bị giới hạn theo tenant, không truy cập dữ liệu tenant khác

## Business Rules liên quan

- BR-HR-S03-R01: Requisition chỉ có thể đăng tuyển sau khi trạng thái là `APPROVED`
- BR-HR-S03-R02: Trạng thái hợp lệ gồm `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `PUBLISHED`, `CLOSED`
- BR-HR-S03-R03: Mọi truy vấn requisition bắt buộc có `tenantId`

## Dependency

- TASK-SPRINT-03-HR_RECRUITMENT-001
- TASK-SPRINT-01-FOUNDATION-002
- TASK-SPRINT-01-FOUNDATION-004
- TASK-SPRINT-02-SYSTEM_ADMIN-005
- US-HR-007
