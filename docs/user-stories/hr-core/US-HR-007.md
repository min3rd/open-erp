# US-HR-007: Giao diện Web Tuyển dụng cơ bản

**ID:** US-HR-007  
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

Cung cấp giao diện web liền mạch cho toàn bộ flow tuyển dụng cơ bản từ requisition đến offer.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** thao tác requisition, pipeline ứng viên, lịch phỏng vấn và offer trên cùng phân hệ web,  
> **Để** vận hành tuyển dụng nhanh và theo dõi trạng thái tập trung.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có route map đầy đủ cho danh sách requisition, pipeline ứng viên, lịch phỏng vấn, offer summary
- [ ] UI hỗ trợ tạo/sửa requisition và hiển thị trạng thái duyệt rõ ràng
- [ ] UI hỗ trợ kéo/thả hoặc thao tác chuyển stage ứng viên với thông báo lỗi hợp lệ
- [ ] Màn hình lịch phỏng vấn cho phép nhập kết quả phỏng vấn và cập nhật theo API
- [ ] Các thao tác được ẩn/hiện theo vai trò HR Staff và HR Manager
- [ ] Trang danh sách và form chi tiết đáp ứng tốt trên desktop

## Business Rules liên quan

- BR-HR-S03-F01: Không hiển thị hành động vượt quyền của vai trò đăng nhập
- BR-HR-S03-F02: Chuyển stage trên UI phải tuân theo ma trận stage transition hợp lệ
- BR-HR-S03-F03: Mọi dữ liệu hiển thị theo tenant của phiên đăng nhập

## Dependency

- TASK-SPRINT-03-FRONTEND-001
- TASK-SPRINT-03-HR_RECRUITMENT-001
- TASK-SPRINT-03-HR_RECRUITMENT-002
- TASK-SPRINT-03-HR_RECRUITMENT-003
- TASK-SPRINT-02-FRONTEND-004
- US-HR-001
- US-HR-002
- US-HR-003
