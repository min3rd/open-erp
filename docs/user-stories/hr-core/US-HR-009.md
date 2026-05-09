# US-HR-009: Giao diện Web Hợp đồng lao động

**ID:** US-HR-009  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** frontend  
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

Theo dõi và thao tác vòng đời hợp đồng lao động trực quan trên web.

## Narrative

> **Là** HR Manager,  
> **Tôi muốn** tạo hợp đồng, theo dõi trạng thái và xử lý gia hạn/thanh lý trên giao diện web,  
> **Để** kiểm soát rủi ro hết hạn và đảm bảo tính pháp lý hồ sơ lao động.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có màn hình danh sách hợp đồng theo trạng thái và kỳ hạn
- [ ] Có form tạo hợp đồng và màn hình thao tác gia hạn/thanh lý
- [ ] UI thể hiện rõ lifecycle `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`
- [ ] UI chặn chỉnh sửa nội dung hợp đồng đã `ACTIVE`
- [ ] Hiển thị cảnh báo hợp đồng sắp hết hạn theo mốc 30 ngày và 7 ngày
- [ ] Có timeline lịch sử hợp đồng theo từng nhân viên

## Business Rules liên quan

- BR-HR-002: Cảnh báo hợp đồng sắp hết hạn trong 30 ngày
- BR-HR-007: Nội dung hợp đồng sau khi ký không được sửa
- BR-HR-S03-C01: Cảnh báo bổ sung ở mốc 7 ngày

## Dependency

- TASK-SPRINT-03-FRONTEND-003
- TASK-SPRINT-03-HR_CONTRACT-001
- TASK-SPRINT-03-FRONTEND-002
- US-HR-005
- US-HR-008
