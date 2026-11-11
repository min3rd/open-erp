# [FEAT-46] Plugin attendance — Leave module (loại nghỉ, ledger, số dư, expiry)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-46 / Feature / Sprint 09 |
| Trạng thái / Severity | Done / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-004](../05_solutions/05_ADR-S09-004_leave_balance_ledger.md) APPROVED |
| depends_on / blocks | [FEAT-45](FEAT-45_attendance_request_forms.md) (đơn LEAVE) / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/**` (leave) |

## 1. Scope

LeaveTypes thuộc tính (paid/counts_as_work/deduct_balance/allow_negative/carry_over_max/validity_months/default_annual_grant); LeaveLedger append-only (GRANT/USAGE/USAGE_REVERSAL/ADJUSTMENT/EXPIRY); balance derive + snapshot cache đối soát; job expiry hằng ngày; grants/adjustments API; mapping LEAVE từ FEAT-45 (duyệt → trừ dư → công ngày On Leave/Half Day; hủy → reversal). AC truy vết: AC-L01…L05.

## 2. Task con

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| [TASK-456](TASK-456_attendance_leave_types_ledger_balances.md) | LeaveTypes + Ledger + derive + snapshot | Done |
| [TASK-457](TASK-457_attendance_leave_mapping_expiry.md) | Mapping LEAVE + expiry job + reversal | Done |
| [TASK-458](TASK-458_attendance_leave_grants_adjustments_api.md) | Grants/adjustments API + leave reports | Done |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-456…458 |
