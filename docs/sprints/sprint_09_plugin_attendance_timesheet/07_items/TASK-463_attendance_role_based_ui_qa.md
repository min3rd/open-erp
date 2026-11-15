# [TASK-463] Attendance UI — phân quyền hiển thị theo vai trò & ảnh QA đa vai trò

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-463 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-14 / phản hồi chủ dự án: “chưa thấy màn hình test với các vai trò khác” |
| depends_on / blocks / parent | TASK-460, TASK-462 / — / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/web/**`, `scripts/qa/run-attendance-dual-mode-qa.mjs` |

## 1. Mục tiêu

1. Thêm input `user-role` (Angular Elements attribute) và lọc `screenTabs` theo vai trò:
   - `EMPLOYEE`/`STAFF`: Chấm công của tôi, Đơn của tôi.
   - `LINE_MANAGER`/`MANAGER`: thêm Công phòng ban, Duyệt đơn.
   - `HR_MANAGER`: thêm các tab quản trị trừ Cấu hình quy trình/Kiosk.
   - `HR_ADMIN`/`SYSTEM_ADMIN`/`TENANT_ADMIN`: toàn bộ tab.
2. Nếu host truyền `context.permissions`, suy ra vai trò từ permission attendance tương ứng.
3. QA script render shell với role badge tương ứng và chụp 4 ảnh:
   `34_desktop_role_employee.png`, `35_desktop_role_manager.png`,
   `36_desktop_role_hr_admin.png`, `37_desktop_role_system_admin.png`.

## 2. Kiểm chứng

- `npm run attendance:ui:build` PASS.
- QA browser: mỗi role chỉ thấy tab được phép; badge role đúng.
- Ảnh 34–37 trong `08_testing/evidence/screenshots/`.
