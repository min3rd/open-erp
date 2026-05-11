# TASK-SPRINT-03-FRONTEND-001: HR Recruitment Web UI

## Thông tin

| Thuộc tính      | Giá trị                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Task ID         | TASK-SPRINT-03-FRONTEND-001                                                                                                          |
| Tiêu đề         | HR Recruitment Web UI                                                                                                                |
| Sprint          | Sprint 03                                                                                                                            |
| Cluster         | frontend                                                                                                                             |
| Loại            | Frontend                                                                                                                             |
| Người phụ trách | Frontend                                                                                                                             |
| Story Points    | 8                                                                                                                                    |
| Trạng thái      | ⬜ TODO                                                                                                                              |
| Phụ thuộc       | TASK-SPRINT-03-HR_RECRUITMENT-001, TASK-SPRINT-03-HR_RECRUITMENT-002, TASK-SPRINT-03-HR_RECRUITMENT-003, TASK-SPRINT-02-FRONTEND-004 |

## Mô tả phạm vi

Thiết kế và đặc tả kỹ thuật giao diện web cho quy trình tuyển dụng cơ bản: requisition, candidate pipeline, interview schedule và offer summary.

Phạm vi gồm:

- Danh sách + form requisition với trạng thái duyệt.
- Candidate pipeline board theo stage và bộ lọc theo vị trí/phòng ban.
- Màn hình lập lịch phỏng vấn, nhập kết quả phỏng vấn, theo dõi offer.
- Đồng bộ i18n key, trạng thái loading/error, permission gate theo vai trò HR.

## Traceability/References

- US-HR: US-HR-001, US-HR-002, US-HR-003, US-HR-007
- F-HR: F-HR-061, F-HR-001, F-HR-002, F-HR-003, F-HR-004
- SCR-HR: SCR-HR-001, SCR-HR-002, SCR-HR-003, SCR-HR-004, SCR-HR-005, SCR-HR-006, SCR-HR-007, SCR-HR-008

## Acceptance Criteria

- [ ] Có sơ đồ màn hình và route map cho toàn bộ tuyển dụng cơ bản.
- [ ] Có đặc tả dữ liệu hiển thị cho từng màn hình và component chính.
- [ ] Có định nghĩa hành vi chuyển stage ứng viên và các trạng thái lỗi UI.
- [ ] Có mô tả tích hợp API cho requisition, candidate, interview, offer.
- [ ] Có checklist phân quyền hiển thị thao tác theo vai trò HR Staff/HR Manager.
- [ ] Có tiêu chí responsive desktop cho trang danh sách và form chi tiết.
