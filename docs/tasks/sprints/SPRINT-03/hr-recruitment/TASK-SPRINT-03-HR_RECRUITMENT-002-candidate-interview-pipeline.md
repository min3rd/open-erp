# TASK-SPRINT-03-HR_RECRUITMENT-002: Candidate & Interview Pipeline

## Thông tin

| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-03-HR_RECRUITMENT-002 |
| Tiêu đề | Candidate & Interview Pipeline |
| Sprint | Sprint 03 |
| Cluster | hr-recruitment |
| Loại | Backend |
| Người phụ trách | Backend |
| Story Points | 8 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-03-HR_RECRUITMENT-001, TASK-SPRINT-02-SYSTEM_ADMIN-006 |

## Mô tả phạm vi

Đặc tả kỹ thuật pipeline ứng viên từ tiếp nhận CV đến phỏng vấn theo các chức năng F-HR-002 và F-HR-003.

Phạm vi gồm:
- Thiết kế dữ liệu `job_candidates` và `interviews` với stage pipeline: `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`.
- API nhập hồ sơ ứng viên, cập nhật stage, lên lịch phỏng vấn, ghi nhận kết quả phỏng vấn.
- Ràng buộc không trùng lịch interviewer, kiểm tra mốc thông báo trước tối thiểu 24 giờ.
- Contract tích hợp Notification Service để gửi email lịch phỏng vấn.

## Traceability/References

- US-HR: US-HR-002
- F-HR: F-HR-002, F-HR-003
- SCR-HR: SCR-HR-001, SCR-HR-004, SCR-HR-005, SCR-HR-006

## Acceptance Criteria

- [ ] Có đặc tả API đầy đủ cho quản lý ứng viên và lịch phỏng vấn.
- [ ] Có quy tắc validate file CV, dữ liệu liên hệ và liên kết bắt buộc tới requisition.
- [ ] Có định nghĩa kiểm tra xung đột lịch interviewer và xử lý lỗi tương ứng.
- [ ] Có mô tả cơ chế stage transition hợp lệ và các trạng thái cấm.
- [ ] Có hợp đồng tích hợp Notification Service cho email mời phỏng vấn.
- [ ] Có tiêu chí log/audit cho các hành động đổi stage và cập nhật kết quả phỏng vấn.
