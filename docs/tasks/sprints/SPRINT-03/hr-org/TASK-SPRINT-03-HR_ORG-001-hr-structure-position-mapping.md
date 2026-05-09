# TASK-SPRINT-03-HR_ORG-001: HR Structure & Position Mapping

## Thông tin

| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-03-HR_ORG-001 |
| Tiêu đề | HR Structure & Position Mapping |
| Sprint | Sprint 03 |
| Cluster | hr-org |
| Loại | Backend |
| Người phụ trách | Backend |
| Story Points | 5 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-02-SYSTEM_ADMIN-003, TASK-SPRINT-02-SYSTEM_ADMIN-005 |

## Mô tả phạm vi

Đặc tả mô hình dữ liệu và API phục vụ cơ cấu/chức danh liên quan HR Core, đảm bảo đồng bộ với danh mục dùng chung của platform.

Phạm vi gồm:
- Mapping department, position, manager relation cho hồ sơ nhân viên HR.
- API tra cứu danh sách phòng ban/chức danh hiệu lực để dùng trong form HR.
- Quy tắc nhất quán khi phòng ban/chức danh bị vô hiệu hóa nhưng còn dữ liệu lịch sử.
- Chuẩn contract nội bộ để frontend và mobile dùng chung metadata cơ cấu tổ chức.

## Traceability/References

- US-HR: US-HR-004, US-HR-006
- F-HR: F-HR-060
- SCR-HR: SCR-HR-014

## Acceptance Criteria

- [ ] Có đặc tả contract đọc department/position cho HR với filter trạng thái.
- [ ] Có mô tả quy tắc xử lý dữ liệu lịch sử khi danh mục bị khóa/inactive.
- [ ] Có quy định rõ cách xác định `managerId` hợp lệ theo cây tổ chức.
- [ ] Có danh sách endpoint nội bộ/public cho nhu cầu HR Core.
- [ ] Có mô tả đồng bộ tenant scope cho toàn bộ dữ liệu cơ cấu.
- [ ] Có bảng mapping trường dữ liệu giữa HR và System Admin catalog.
