# TASK-SPRINT-03-HR_CONTRACT-001: Employment Contract Lifecycle

## Thông tin

| Thuộc tính      | Giá trị                                                         |
| --------------- | --------------------------------------------------------------- |
| Task ID         | TASK-SPRINT-03-HR_CONTRACT-001                                  |
| Tiêu đề         | Employment Contract Lifecycle                                   |
| Sprint          | Sprint 03                                                       |
| Cluster         | hr-contract                                                     |
| Loại            | Backend                                                         |
| Người phụ trách | Backend                                                         |
| Story Points    | 8                                                               |
| Trạng thái      | ⬜ TODO                                                         |
| Phụ thuộc       | TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-02-SYSTEM_ADMIN-006 |

## Mô tả phạm vi

Đặc tả kỹ thuật quản lý hợp đồng lao động theo F-HR-011, bao gồm vòng đời hợp đồng, trạng thái ký và cảnh báo sắp hết hạn.

Phạm vi gồm:

- Thiết kế collection `employment_contracts` và lifecycle `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`.
- API tạo hợp đồng, ký hợp đồng, gia hạn, thanh lý và tra cứu lịch sử hợp đồng theo nhân viên.
- Rule bất biến với hợp đồng đã ký (BR-HR-007) và cảnh báo trước 30 ngày (BR-HR-002).
- Contract phát sự kiện thông báo hết hạn sang Notification Service.

## Traceability/References

- US-HR: US-HR-005
- F-HR: F-HR-011
- SCR-HR: SCR-HR-012, SCR-HR-013

## Acceptance Criteria

- [ ] Có đặc tả endpoint cho toàn bộ lifecycle hợp đồng.
- [ ] Có mô tả rõ trường dữ liệu bắt buộc và ràng buộc ngày hiệu lực.
- [ ] Có quy tắc không cho sửa nội dung hợp đồng sau khi trạng thái `ACTIVE`.
- [ ] Có thiết kế job/quy trình cảnh báo hợp đồng trước 30 ngày và 7 ngày.
- [ ] Có index đề xuất cho truy vấn theo `tenantId`, `employeeId`, `status`, `endDate`.
- [ ] Có danh mục lỗi nghiệp vụ cho gia hạn/thanh lý không hợp lệ.
