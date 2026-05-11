# TASK-SPRINT-03-HR_RECRUITMENT-003: Offer & Onboarding Init

## Thông tin

| Thuộc tính      | Giá trị                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------ |
| Task ID         | TASK-SPRINT-03-HR_RECRUITMENT-003                                                          |
| Tiêu đề         | Offer & Onboarding Init                                                                    |
| Sprint          | Sprint 03                                                                                  |
| Cluster         | hr-recruitment                                                                             |
| Loại            | Backend                                                                                    |
| Người phụ trách | Backend                                                                                    |
| Story Points    | 5                                                                                          |
| Trạng thái      | ⬜ TODO                                                                                    |
| Phụ thuộc       | TASK-SPRINT-03-HR_RECRUITMENT-002, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-01-USER-001 |

## Mô tả phạm vi

Đặc tả kỹ thuật cho bước gửi offer và khởi tạo onboarding cơ bản theo F-HR-004, bao gồm liên kết tuyển dụng sang hồ sơ nhân viên và tài khoản người dùng.

Phạm vi gồm:

- API gửi offer, ghi nhận thời hạn offer 7 ngày, phản hồi accept/reject.
- Thiết kế luồng khi ứng viên accept: tạo bản ghi employee tối thiểu và kích hoạt tạo user account.
- Event contract cho luồng khởi tạo onboarding checklist ở mức cơ bản.
- Quy tắc idempotent để tránh tạo trùng employee/user khi callback lặp.

## Traceability/References

- US-HR: US-HR-003
- F-HR: F-HR-004
- SCR-HR: SCR-HR-007, SCR-HR-008

## Acceptance Criteria

- [ ] Có đặc tả endpoint gửi offer và ghi nhận phản hồi ứng viên.
- [ ] Có rule hết hạn offer sau 7 ngày và trạng thái tương ứng.
- [ ] Có mô tả đầy đủ chuỗi tích hợp từ candidate sang employee và user account.
- [ ] Có chiến lược idempotency cho thao tác accept offer.
- [ ] Có mapping rõ dữ liệu nào bắt buộc khi khởi tạo employee tối thiểu.
- [ ] Có danh sách mã lỗi nghiệp vụ cho các case hết hạn, từ chối hoặc dữ liệu thiếu.
