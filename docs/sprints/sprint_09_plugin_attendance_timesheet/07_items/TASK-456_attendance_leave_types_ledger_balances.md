# [TASK-456] Loại nghỉ phép + LeaveLedger Append-only + Derive số dư

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-456 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-004](../05_solutions/05_ADR-S09-004_leave_balance_ledger.md) 1.0, [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §7 |
| depends_on / blocks / parent | FEAT-44 / TASK-457 / [FEAT-46](FEAT-46_attendance_leave_module.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. CRUD loại nghỉ phép `plg_attendance_leave_types`: các thuộc tính `paid`, `counts_as_work`, `deduct_balance`, `allow_negative`, `carry_over_max_days`, `validity_months`, `default_annual_grant`.
2. Sổ cái nghỉ phép append-only `plg_attendance_leave_ledger` với các loại bút toán: `GRANT`, `USAGE`, `USAGE_REVERSAL`, `ADJUSTMENT`, `EXPIRY`.
3. Hàm tính toán số dư thực tế (derive balance) từ sổ cái theo thời hạn và cộng dồn; đồng bộ snapshot cache `plg_attendance_leave_balances`.

