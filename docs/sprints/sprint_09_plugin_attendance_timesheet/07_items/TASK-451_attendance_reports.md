# [TASK-451] Báo cáo Chấm công & Bảng công (Summary, Team, Top-Late, Overtime)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-451 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §9 |
| depends_on / blocks / parent | TASK-448, TASK-450 / FEAT-47 / [FEAT-44](FEAT-44_attendance_timesheets.md) |
| Write scope | `plugins/attendance/src/main/java/**` |

## 1. Mục tiêu

Hiện thực hóa các API báo cáo tổng hợp cho HR và Quản lý nhóm (DES-API §9):
1. `GET /reports/summary`: Báo cáo tỷ lệ chuyên cần (attendance_rate), tổng giờ OT, số lượt đi muộn, số lượt vắng mặt, phân rã theo phòng ban.
2. `GET /reports/team`: Báo cáo công chi tiết của các thành viên trong nhóm trực thuộc manager (phân quyền team assignment).
3. `GET /reports/top-late`: Danh sách nhân viên đi muộn nhiều nhất theo khoảng thời gian.
4. `GET /reports/overtime`: Thống kê nhân viên làm thêm giờ nhiều nhất.
