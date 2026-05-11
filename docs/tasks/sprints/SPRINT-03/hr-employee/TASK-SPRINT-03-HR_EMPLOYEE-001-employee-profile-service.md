# TASK-SPRINT-03-HR_EMPLOYEE-001: Employee Profile Service

## Thông tin

| Thuộc tính      | Giá trị                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Task ID         | TASK-SPRINT-03-HR_EMPLOYEE-001                                                          |
| Tiêu đề         | Employee Profile Service                                                                |
| Sprint          | Sprint 03                                                                               |
| Cluster         | hr-employee                                                                             |
| Loại            | Backend                                                                                 |
| Người phụ trách | Backend                                                                                 |
| Story Points    | 8                                                                                       |
| Trạng thái      | ⬜ TODO                                                                                 |
| Phụ thuộc       | TASK-SPRINT-01-USER-001, TASK-SPRINT-01-FOUNDATION-004, TASK-SPRINT-02-SYSTEM_ADMIN-005 |

## Mô tả phạm vi

Đặc tả kỹ thuật dịch vụ hồ sơ nhân viên (F-HR-010), làm nguồn dữ liệu chuẩn cho HR Core và các phân hệ đọc nội bộ.

Phạm vi gồm:

- Thiết kế collection `employees` theo SRS, áp dụng unique key theo tenant (`employeeCode`, `nationalId`).
- API tạo/cập nhật/xem hồ sơ nhân viên, phân quyền xem theo vai trò và phạm vi dữ liệu.
- Quy tắc bảo mật dữ liệu nhạy cảm (mã hóa trường CCCD, tài khoản ngân hàng nếu có).
- API nội bộ `/internal/employees` và `/internal/employees/{id}` cho service khác sử dụng.

## Traceability/References

- US-HR: US-HR-003, US-HR-004
- F-HR: F-HR-010
- SCR-HR: SCR-HR-009, SCR-HR-010, SCR-HR-011

## Acceptance Criteria

- [ ] Có đặc tả dữ liệu `employees` đầy đủ trường bắt buộc và optional theo SRS.
- [ ] Có danh sách index bắt buộc và giải thích truy vấn chính.
- [ ] Có rule validate `employeeCode`, `nationalId`, độ tuổi lao động tối thiểu.
- [ ] Có mô tả bảo mật trường nhạy cảm và quyền truy cập theo vai trò.
- [ ] Có đặc tả API nội bộ cho tích hợp Office/Sale/Accounting.
- [ ] Có quy định rõ tenant filter bắt buộc ở mọi truy vấn và cập nhật.
