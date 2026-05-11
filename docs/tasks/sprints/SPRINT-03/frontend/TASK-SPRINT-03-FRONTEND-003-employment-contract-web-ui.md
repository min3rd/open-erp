# TASK-SPRINT-03-FRONTEND-003: Employment Contract Web UI

## Thông tin

| Thuộc tính      | Giá trị                                                     |
| --------------- | ----------------------------------------------------------- |
| Task ID         | TASK-SPRINT-03-FRONTEND-003                                 |
| Tiêu đề         | Employment Contract Web UI                                  |
| Sprint          | Sprint 03                                                   |
| Cluster         | frontend                                                    |
| Loại            | Frontend                                                    |
| Người phụ trách | Frontend                                                    |
| Story Points    | 5                                                           |
| Trạng thái      | ⬜ TODO                                                     |
| Phụ thuộc       | TASK-SPRINT-03-HR_CONTRACT-001, TASK-SPRINT-03-FRONTEND-002 |

## Mô tả phạm vi

Thiết kế và đặc tả giao diện web quản lý hợp đồng lao động cho HR Core: tạo mới, theo dõi vòng đời, nhắc hạn và lịch sử theo nhân viên.

Phạm vi gồm:

- Danh sách hợp đồng theo trạng thái và kỳ hạn.
- Form tạo hợp đồng và màn hình thao tác gia hạn/thanh lý.
- Hiển thị timeline lịch sử hợp đồng theo từng nhân viên.
- Hiển thị cảnh báo hợp đồng sắp hết hạn theo rule 30/7 ngày.

## Traceability/References

- US-HR: US-HR-005, US-HR-009
- F-HR: F-HR-063, F-HR-011
- SCR-HR: SCR-HR-012, SCR-HR-013

## Acceptance Criteria

- [ ] Có đặc tả màn hình list, detail, create/edit cho hợp đồng.
- [ ] Có mô tả rõ trạng thái UI theo lifecycle hợp đồng (`DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`).
- [ ] Có mapping API cho tạo, cập nhật trạng thái và tra cứu lịch sử hợp đồng.
- [ ] Có quy tắc UI ngăn sửa nội dung hợp đồng đã ký.
- [ ] Có định nghĩa hiển thị cảnh báo hết hạn và hành động tiếp theo.
- [ ] Có tiêu chí kiểm thử giao diện cho các trường hợp lỗi nghiệp vụ phổ biến.
