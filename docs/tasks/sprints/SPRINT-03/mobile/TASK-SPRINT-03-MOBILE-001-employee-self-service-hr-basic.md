# TASK-SPRINT-03-MOBILE-001: Employee Self-Service HR Basic

## Thông tin

| Thuộc tính      | Giá trị                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| Task ID         | TASK-SPRINT-03-MOBILE-001                                                                 |
| Tiêu đề         | Employee Self-Service HR Basic                                                            |
| Sprint          | Sprint 03                                                                                 |
| Cluster         | mobile                                                                                    |
| Loại            | Mobile                                                                                    |
| Người phụ trách | Mobile                                                                                    |
| Story Points    | 5                                                                                         |
| Trạng thái      | ⬜ TODO                                                                                   |
| Phụ thuộc       | TASK-SPRINT-02-MOBILE-001, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-03-HR_CONTRACT-001 |

## Mô tả phạm vi

Đặc tả kỹ thuật và UI flow tối thiểu cho mobile employee self-service trong HR Core.

Phạm vi gồm:

- Màn hình xem hồ sơ cá nhân cơ bản và cập nhật thông tin liên hệ cho chính mình.
- Màn hình xem danh sách hợp đồng của bản thân và trạng thái hiệu lực.
- Màn hình xem tóm tắt thông tin onboarding/việc cần hoàn tất sau khi nhận việc.
- Cơ chế xác thực, phân quyền chỉ cho phép truy cập dữ liệu của chính employee đăng nhập.

## Traceability/References

- US-HR: US-HR-004, US-HR-005, US-HR-011
- F-HR: F-HR-065, F-HR-010, F-HR-011
- SCR-HR: SCR-HR-015, SCR-HR-016, SCR-HR-017, SCR-HR-018

## Acceptance Criteria

- [ ] Có route map mobile cho profile, contract summary, onboarding summary.
- [ ] Có mô tả API tích hợp và dữ liệu hiển thị cho từng màn hình.
- [ ] Có quy tắc phân quyền self-service (không truy cập dữ liệu người khác).
- [ ] Có định nghĩa trạng thái offline/loading/error tối thiểu cho mobile.
- [ ] Có tiêu chí responsive theo chuẩn màn hình điện thoại phổ biến.
- [ ] Có checklist smoke test mobile cho Android build.
