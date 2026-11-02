# [ADR-S09-004] Số dư phép theo ledger (grant/usage/adjust/expiry entries)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S09-004 / Quyết định kiến trúc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q14 (APPROVED, rủi ro §5.2), [ADR-S09-002](03_ADR-S09-002_request_forms_on_form_workflow.md) (mapping LEAVE), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) |
| Đọc trước / đọc tiếp | [SOL-S09-001](01_SOL-S09-001_attendance_architecture.md) / [ADR-S09-005](06_ADR-S09-005_multi_source_log_ingestion.md) |

## 1. Vấn đề

CONF Q14 chọn **leave đầy đủ**: loại nghỉ có thuộc tính, cấp phát theo năm, cộng dồn tối đa, hạn sử dụng, chặn âm (tùy cấu hình), hủy đơn khôi phục. Lưu "số dư" dạng cột cộng/trừ trực tiếp dễ drift khi hủy đơn, cộng dồn chéo năm, hoặc retry event — CONF §5.2 yêu cầu voucher/ledger để tránh cộng trừ sai.

## 2. Quyết định

**Số dư là kết quả tính tổng của các entry ledger append-only; không cột "balance" là nguồn sự thật.**

### 2.1. Mô hình

- `plg_attendance_leave_types`: `code`, `name`, `paid` (có lương), `counts_as_work` (tính công), `deduct_balance` (trừ dư), `allow_negative` (cho phép âm khi duyệt), `carry_over_max` (số ngày tối đa chuyển kỳ sau), `validity_months` (hạn dùng sau khi cấp), `default_annual_grant` (cấp mặc định theo năm công tác tùy chọn).
- `plg_attendance_leave_ledger`: entry append-only per (employee, leave_type):
  | entry_type | Nguồn | Hệ quả |
  | :--- | :--- | :--- |
  | `GRANT` | Cấp phép năm/mới tuyển (HR hoặc job tự cấp theo cấu hình) | `+days`, có `valid_until` theo `validity_months` |
  | `USAGE` | Đơn LEAVE được duyệt | `−days`, link `request_id` |
  | `USAGE_REVERSAL` | Hủy/đơn bị thu hồi sau duyệt | `+days`, link entry gốc |
  | `ADJUSTMENT` | HR điều chỉnh tay | `±days`, bắt buộc lý do |
  | `EXPIRY` | Job hết hạn | `−days_remaining` trên các entry GRANT quá `valid_until` |
  - Entry không bao giờ UPDATE/DELETE; sai sót sửa bằng entry ngược (audit đủ).
- **Balance derive**: `SUM(days)` theo (employee, leave_type) — entry còn hạn + chưa hết hạn; hiển thị kèm breakdown (được cấp/đã dùng/còn lại/hết hạn kỳ này).
- **Kiểm tra khi duyệt** (ADR-S09-002 mapping LEAVE): derive balance + `allow_negative=false` → chặn duyệt khi thiếu dư; chỉnh `allow_negative` cho phép âm theo loại.
- **Cộng dồn chéo năm**: entry GRANT chưa dùng và còn hạn tự tồn tại qua kỳ; khi hết hạn → EXPIRY entry; `carry_over_max` là rule của job cấp năm mới (cấp entry mới với phần chuyển đổi tính từ derive của năm trước, giới hạn tối đa).

### 2.2. Snapshot cache

Bảng `plg_attendance_leave_balances` (snapshot per employee/leave_type + `recomputed_at`) chỉ là **cache đọc cho UI/báo cáo**; job recompute theo event ledger; snapshot lệch so với derive được job đối soát định kỳ (recompute bắt buộc wins) — không bao giờ dùng snapshot để chặn duyệt.

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Cột `balance` cập nhật cộng/trừ trực tiếp | Hủy đơn/retry/chéo năm dễ drift; không truy vết được nguồn từng ngày; đúng thứ CONF §5.2 cảnh báo |
| Tính dư on-the-fly từ đơn nghỉ duyệt (không ledger) | Mất cấp phát/điều chỉnh/hạn dùng; không model được cộng dồn |
| Snapshot là nguồn sự thật | Snapshot lệch khi event thất bại; derive từ ledger luôn khôi phục được |

## 4. Hệ quả và kiểm chứng

- (+) Mọi thay đổi có truy vết (nguồn entry); khôi phục được balance bất kỳ thời điểm nào; cộng dồn/hạn dùng model tự nhiên bằng entry; test biên được (dư 0, âm, chéo năm).
- (−) Truy vấn balance là SUM (bảng nhỏ, index (employee, leave_type, valid_until)); thêm 1 job expiry hằng ngày multi-tenant idempotent.
- Kiểm chứng: unit test derive (grant/usage/reversal/adjust/expiry/carry-over); integration test duyệt đơn → usage → hủy → reversal; job expiry không trừ dư entry còn hạn; AC truy vết: AC-L01, AC-L02, AC-L04, AC-L05, AC-Đ04.
