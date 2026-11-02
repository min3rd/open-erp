# [FEAT-46] Plugin attendance — Leave module (loại nghỉ, ledger, số dư, expiry)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-46 / Feature / Sprint 09 |
| Trạng thái / Severity | To Do / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [ADR-S09-004](../05_solutions/05_ADR-S09-004_leave_balance_ledger.md) APPROVED |
| depends_on / blocks | [FEAT-45](FEAT-45_attendance_request_forms.md) (đơn LEAVE) / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/**` (leave) |

## 1. Scope

LeaveTypes thuộc tính (paid/counts_as_work/deduct_balance/allow_negative/carry_over_max/validity_months/default_annual_grant); LeaveLedger append-only (GRANT/USAGE/USAGE_REVERSAL/ADJUSTMENT/EXPIRY); balance derive + snapshot cache đối soát; job expiry hằng ngày; grants/adjustments API; mapping LEAVE từ FEAT-45 (duyệt → trừ dư → công ngày On Leave/Half Day; hủy → reversal). AC truy vết: AC-L01…L05.

## 2. Task con (reservation — tạo file trước khi phân công)

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| TASK-456 | LeaveTypes + Ledger + derive + snapshot | Reserved |
| TASK-457 | Mapping LEAVE + expiry job + reversal | Reserved |
| TASK-458 | Grants/adjustments API + leave reports | Reserved |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-456…458 |
