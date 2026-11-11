# [TASK-457] Khấu trừ phép khi duyệt đơn LEAVE + Khôi phục khi hủy + Job hết hạn

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-457 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-004](../05_solutions/05_ADR-S09-004_leave_balance_ledger.md) 1.0 |
| depends_on / blocks / parent | TASK-456 / TASK-458 / [FEAT-46](FEAT-46_attendance_leave_module.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. Mapping đơn `LEAVE`: khi duyệt -> ghi bút toán `USAGE` (-days) vào ledger, cập nhật trạng thái chấm công ngày `ON_LEAVE` hoặc `HALF_DAY`.
2. Khi hủy đơn -> ghi bút toán `USAGE_REVERSAL` (+days) hoàn trả số dư phép.
3. Job hết hạn phép: quét các khoản cấp phép hết hạn sử dụng (`valid_until < today`), ghi bút toán `EXPIRY` (-days_remaining).

