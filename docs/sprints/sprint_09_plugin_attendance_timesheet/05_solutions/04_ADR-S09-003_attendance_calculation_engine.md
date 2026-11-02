# [ADR-S09-003] Tính công: job engine idempotent, tolerance theo ca, OT đối chiếu window đã duyệt

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S09-003 / Quyết định kiến trúc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt qua hội thoại tương tác (nội dung 0.1 giữ nguyên) |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q6/Q7/Q8 (APPROVED), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) §3.1/§3.4, [ADR-S09-001](02_ADR-S09-001_shift_structure_in_plugin.md) |
| Đọc trước / đọc tiếp | [SOL-S09-001](01_SOL-S09-001_attendance_architecture.md) / [ADR-S09-004](05_ADR-S09-004_leave_balance_ledger.md) |

## 1. Vấn đề

Quy đổi log thô → công ngày phải xử lý: nhiều log/ngày, check-in treo, ca đêm, đổi ca giữa kỳ, override tay không bị ghi đè, OT chỉ tính khi đã duyệt (Q7), 6 trạng thái (Q6), 2 cách tính công hưởng lương (Q8). Frappe tách `Employee Checkin` (log) khỏi `Attendance` (record); Odoo có tolerance 2 chiều; Base.vn tách "cập nhật lại" khỏi dữ liệu sửa tay.

## 2. Quyết định

### 2.1. Ba tầng dữ liệu (chuẩn BENCH L01)

- `plg_attendance_logs` — append-only, `source` enum (`WEB`, `MOBILE`, `KIOSK`, `IMPORT`, `PUSH`, `MANUAL`), metadata (GPS, IP, device_id); xóa chỉ HR kèm lý do + audit (ADR-S09-005).
- `plg_attendance_records` — 1 dòng per (employee, work_date, shift_id nullable): `status` enum 6 giá trị (`PRESENT`, `ABSENT`, `HALF_DAY`, `WFH`, `ON_LEAVE`, `BUSINESS_TRIP`), `effective_in/effective_out`, `worked_minutes`, `late_minutes`, `early_leave_minutes`, `ot_minutes`, `is_override`, `override_reason/override_by`, `calc_version`, `needs_review` (log treo/thiếu ca).
- `plg_attendance_timesheets` — bảng công kỳ (bước 4 Base), tổng hợp từ records.

### 2.2. Công thức thuần + job idempotent

- **Công thức là hàm thuần** `(logs, shift, ot_window, holiday) → record` không phụ thuộc DB — unit test toàn diện (muộn/về sớm/OT/ca đêm/log lộn xộn) trước khi ghép job.
- **Job tính công** (Quarkus Scheduler, pattern ADR-S08-001): mỗi 15 phút quét ngày làm việc gần nhất + ngày có log mới; lấy tenant list qua internal API Core, chạy từng tenant trong context riêng; idempotent theo `(tenant, employee, work_date, calc_version)`; record có `is_override=true` **bỏ qua**, chỉ tính lại khi bấm "Tính lại" (audit — CONF AC-C02, Base pattern).
- **Tolerance theo ca** (ADR-S09-001): muộn = max(0, effective_in − (shift_start − grace_in)); về sớm tương tự; OT = phần log nằm trong `ot_window` đã duyệt, trừ `ot_grace_minutes`, dưới `min_ot_minutes` không tính (Odoo 2 chiều, BENCH L04).
- **OT window**: `plg_attendance_ot_windows` (employee, work_date, start/end, đơn OVERTIME đã duyệt từ ADR-S09-002) — log ngoài window không thành OT dù có đơn.
- **Check-in treo**: job phát hiện log mở quá `hanging_threshold` (setting tenant, mặc định 16h) → tự đóng tại thời điểm log cuối + `needs_review=true` + notification HR/nhân viên (CONF AC-A06).
- **Kỳ chốt**: record thuộc timesheet đã Done → khóa, mọi sửa phải mở khóa (audit).

### 2.3. Cách tính công hưởng lương (Q8)

Config trong timesheet: `STANDARD_MINUS_UNPAID` (số công chuẩn − nghỉ không lương) hoặc `ACTUAL_TOTAL` (tổng công thực tế) — giá trị tính khi chạy Bước 3 công thức, lưu snapshot vào timesheet (không derive khi đọc).

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Tính công realtime tại lúc check-out | Log có thể import/push trễ nhiều ngày; thiếu log đêm ca; realtime gây update ồn — job định kỳ + trigger theo log mới đủ |
| OT tính trực tiếp từ log không cần duyệt | CONF Q7 chốt duyệt trước; chi phí OT là rủi ro chi phí DN |
| Record tính trong bảng công kỳ (gộp 2 tầng) | Mất audit từng ngày; kỳ chốt sẽ khóa cả dữ liệu tính; Frappe/MISA/Base đều tách |
| Trigger DB (PostgreSQL trigger) tự tính | Logic nghiệp vụ trong trigger khó test/khó migration plugin; job + hàm thuần test được trên PostgreSQL thật |

## 4. Hệ quả và kiểm chứng

- (+) Hàm thuần test được 100% công thức; job idempotent chạy lại an toàn; override được bảo vệ; OT chặt theo duyệt.
- (−) Độ trễ tính công tối đa 15 phút (chấp nhận — báo cáo không cần realtime); thêm bảng ot_windows + calc_version.
- Kiểm chứng: unit test công thức (≥ 20 case biên: ca đêm, log lộn xộn, grace 2 chiều, OT dưới ngưỡng); integration test job multi-tenant idempotent + override skip + treo; AC truy vết: AC-C01…C03, AC-A06, AC-R03/04, AC-T02.
