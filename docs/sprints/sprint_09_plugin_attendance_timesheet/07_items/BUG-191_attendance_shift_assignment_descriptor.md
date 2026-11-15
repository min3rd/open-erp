# [BUG-191] Phân ca hàng loạt và mapping SHIFT_SWAP thiếu descriptor

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-191 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-190 / duyệt đơn SHIFT_SWAP / [TASK-465](TASK-465_attendance_calc_job.md) |
| Write scope | `plugin.json`, `ShiftAdminResource`, UI ca làm việc |

## 1. Hiện tượng

- `plg_attendance_shift_assignments` luôn trống; không có API/UI phân ca.
- Duyệt đơn SHIFT_SWAP trả `APPROVED` nhưng `mapping_status = FAILED`.

## 2. Nguyên nhân

Manifest chỉ có `attendance.assignment.list_by_date`, thiếu `attendance.assignment.insert` dù `RequestMappingExecutor` đã gọi query này.

## 3. Sửa đổi

- Thêm descriptor `attendance.assignment.insert` (employee_id, work_date, shift_definition_id, source, reason, created_by) với cast `date`.
- `POST /admin/shift-assignments/bulk` `{ shift_definition_id, from, to }` (tối đa 10 ngày/lần): gán ca cho toàn bộ nhân sự `ACTIVE` của tenant, bỏ Thứ 7/Chủ nhật, bỏ qua cặp đã có ca.
- UI tab **Ca làm việc & Lịch** thêm nút **Phân ca hàng loạt** (drawer chọn ca + tháng); UI chia tháng thành các đoạn 7 ngày và gọi tuần tự để mỗi request nằm dưới timeout 30s của gateway.

## 4. Kiểm chứng

- `plg_attendance_shift_assignments` có bản ghi sau khi phân ca.
- Duyệt đơn SHIFT_SWAP có `shift_definition_id` → `mapping_status = APPLIED`.
