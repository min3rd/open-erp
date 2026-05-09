# US-HR-010: Giao diện Web Cơ cấu/chức danh HR cơ bản

**ID:** US-HR-010  
**Module:** HR Core  
**Sprint:** 03  
**Cluster:** frontend  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  
**Độ ưu tiên:** Trung bình (Should Have)  
**Ước tính:** 3 story points

---

## Persona

- HR Staff
- HR Manager

## Goal

Tra cứu nhanh cây tổ chức và liên kết hồ sơ nhân sự để hỗ trợ nghiệp vụ HR hằng ngày.

## Narrative

> **Là** HR Staff,  
> **Tôi muốn** xem cơ cấu phòng ban/chức danh và truy cập nhanh hồ sơ nhân viên liên quan,  
> **Để** xử lý thay đổi tổ chức và điều phối nhân sự chính xác hơn.

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Có màn hình cây tổ chức với panel thông tin nhân sự liên quan
- [ ] Hỗ trợ lọc/tìm kiếm theo phòng ban, chức danh, trạng thái nhân viên
- [ ] Có điều hướng nhanh sang hồ sơ nhân viên và quay lại cây tổ chức
- [ ] Node inactive vẫn hiển thị theo quy tắc dữ liệu lịch sử
- [ ] Dữ liệu node được mapping đúng từ API cơ cấu HR
- [ ] Trải nghiệm vẫn ổn định khi dữ liệu cây lớn

## Business Rules liên quan

- BR-HR-S03-O01: Danh mục inactive không dùng để gán mới nhưng vẫn hiển thị lịch sử
- BR-HR-S03-O02: Quan hệ quản lý trực tiếp phải hợp lệ trong cây tổ chức
- BR-HR-S03-F06: Không hiển thị node ngoài phạm vi tenant

## Dependency

- TASK-SPRINT-03-FRONTEND-004
- TASK-SPRINT-03-HR_ORG-001
- TASK-SPRINT-03-FRONTEND-002
- US-HR-006
- US-HR-008
