# TASK-SPRINT-03-TESTING-001: HR Core Test Plan

## Thông tin

| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-03-TESTING-001 |
| Tiêu đề | HR Core Test Plan |
| Sprint | Sprint 03 |
| Cluster | testing |
| Loại | Testing |
| Người phụ trách | QA |
| Story Points | 5 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-03-HR_RECRUITMENT-003, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-03-HR_CONTRACT-001, TASK-SPRINT-03-FRONTEND-004, TASK-SPRINT-03-MOBILE-001 |

## Mô tả phạm vi

Lập kế hoạch kiểm thử tổng thể cho Sprint 03 HR Core, bao gồm test backend API, web UI và mobile self-service tối thiểu.

Phạm vi gồm:
- Test scenario cho luồng tuyển dụng cơ bản: requisition → candidate → interview → offer/onboarding init.
- Test scenario cho hồ sơ nhân viên, hợp đồng lao động và cảnh báo sắp hết hạn.
- Test ma trận quyền truy cập cho HR Manager, HR Staff, Employee.
- Kế hoạch smoke/regression cho web và mobile, cùng tiêu chí vào-ra cho UAT.

## Traceability/References

- US-HR: US-HR-001, US-HR-002, US-HR-003, US-HR-004, US-HR-005, US-HR-006, US-HR-007, US-HR-008, US-HR-009, US-HR-010, US-HR-011, US-HR-012
- F-HR: F-HR-066, F-HR-001, F-HR-002, F-HR-003, F-HR-004, F-HR-010, F-HR-011, F-HR-060, F-HR-061, F-HR-062, F-HR-063, F-HR-064, F-HR-065
- SCR-HR: SCR-HR-001, SCR-HR-002, SCR-HR-003, SCR-HR-004, SCR-HR-005, SCR-HR-006, SCR-HR-007, SCR-HR-008, SCR-HR-009, SCR-HR-010, SCR-HR-011, SCR-HR-012, SCR-HR-013, SCR-HR-014, SCR-HR-015, SCR-HR-016, SCR-HR-017, SCR-HR-018

## Acceptance Criteria

- [ ] Có test matrix bao phủ chức năng chính và quyền truy cập theo vai trò.
- [ ] Có danh sách test case ưu tiên P0/P1 cho các luồng HR Core.
- [ ] Có tiêu chí pass/fail rõ ràng cho API, web và mobile.
- [ ] Có kế hoạch dữ liệu test đa tenant và dữ liệu biên quan trọng.
- [ ] Có checklist regression cuối sprint và điều kiện nghiệm thu.
- [ ] Có danh mục rủi ro kiểm thử và phương án giảm thiểu.
