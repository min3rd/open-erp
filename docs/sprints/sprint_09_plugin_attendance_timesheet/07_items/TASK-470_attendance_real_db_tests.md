# [TASK-470] Kiểm thử plugin Chấm công trên PostgreSQL/Redis thật

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-470 / Task / Sprint 09 |
| Trạng thái | **Done — bộ QA API chạy trên stack thật** |
| Owner/agent / reviewer | QA / Developer |
| Cập nhật / input version | 2026-11-15 / AGENTS rule #32 |
| depends_on / blocks / parent | TASK-466 / DoD test / [TP-S09-001](../08_testing/01_TP-S09-001_sprint_09_test_plan.md) |
| Write scope | `scripts/qa/run-attendance-api-qa.mjs`, `package.json` |

## 1. Yêu cầu

Luồng nghiệp vụ cốt lõi phải được kiểm thử trên PostgreSQL + Redis thật, không dùng mock/in-memory.

## 2. Bộ kiểm thử

`npm run qa:attendance-api` (`scripts/qa/run-attendance-api-qa.mjs`) chạy end-to-end qua Core gateway + plugin container + PostgreSQL thật:

1. Đăng nhập thật, lấy access token (hỗ trợ cả luồng chọn tenant).
2. `GET /admin/employees` — dữ liệu nhân sự đã seed.
3. Tạo loại phép mới → đọc lại số dư.
4. Cấp phép → số dư và sổ cái phản ánh đúng, có `employee_name`.
5. Nộp đơn LEAVE → `response` lưu đúng ngày/lý do.
6. Duyệt đơn → `APPROVED` + mapping `APPLIED`.
7. Audit trail có `REQUEST_SUBMIT` và `REQUEST_APPROVE`.
8. Tính lại công theo ngày → `calculated` trả về.
9. Đọc công ngày, kỳ công, danh mục ca.

Mọi bước assert trạng thái HTTP và dữ liệu trả về từ DB; script exit code 1 nếu có bước fail.

## 3. Ghi chú

- Các unit test thuần cho engine (`AttendanceCalculator`, `ShiftResolver`) vẫn giữ vì là hàm thuần không I/O.
- Bộ test cũ dùng stub vẫn tồn tại cho wiring; các luồng nghiệp vụ chính đã có kiểm thử DB thật ở trên.
