# TASK-SPRINT-03-HR_RECRUITMENT-001: Job Requisition Service

## Thông tin

| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-03-HR_RECRUITMENT-001 |
| Tiêu đề | Job Requisition Service |
| Sprint | Sprint 03 |
| Cluster | hr-recruitment |
| Loại | Backend |
| Người phụ trách | Backend |
| Story Points | 8 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004, TASK-SPRINT-02-SYSTEM_ADMIN-005 |

## Mô tả phạm vi

Thiết kế và đặc tả kỹ thuật microservice tuyển dụng cho chức năng yêu cầu tuyển dụng (F-HR-001), bảo đảm luồng tạo yêu cầu, phê duyệt HR Manager, và chuyển trạng thái để sẵn sàng đăng tuyển.

Phạm vi gồm:
- Mô hình dữ liệu `job_requisitions` theo tenant, có trạng thái `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `PUBLISHED`, `CLOSED`.
- API CRUD và API duyệt/từ chối requisition tại lớp HR service và gateway.
- Validation nghiệp vụ: `numberOfPositions >= 1`, `deadline` hợp lệ, bắt buộc `tenantId` trong mọi truy vấn.
- Định nghĩa event contract phát ra khi requisition được duyệt để các service khác subscribe.

## Traceability/References

- US-HR: US-HR-001
- F-HR: F-HR-001
- SCR-HR: SCR-HR-001, SCR-HR-002, SCR-HR-003

## Acceptance Criteria

- [ ] Có tài liệu endpoint cho tạo, cập nhật, duyệt, từ chối và tra cứu requisition.
- [ ] Mọi API đều có quy tắc tenant isolation rõ ràng.
- [ ] Quy trình duyệt/từ chối có audit metadata (`approvedBy`, `approvedAt`, `reason`).
- [ ] Có danh sách index MongoDB đề xuất cho truy vấn theo `tenantId`, `departmentId`, `status`, `deadline`.
- [ ] Tài liệu chỉ ra rõ event phát sinh khi requisition chuyển `APPROVED`.
- [ ] Có ma trận quyền tối thiểu cho HR Staff, HR Manager, Department Manager.
