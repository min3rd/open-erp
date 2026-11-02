# [TASK-444] Engine thuần: ShiftResolver + AttendanceCalculator + unit test

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-444 / Task / Sprint 09 |
| Severity / trạng thái | High / **Done (dev)** — 40/40 unit test PASS |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [ADR-S09-001](../05_solutions/02_ADR-S09-001_shift_structure_in_plugin.md), [ADR-S09-003](../05_solutions/04_ADR-S09-003_attendance_calculation_engine.md) 1.0 |
| depends_on / blocks / parent | TASK-443 / TASK-446 / [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope / baseline | `plugins/attendance/src/main/java/**/engine/**`, `src/test/java/**` |

## 1. Mục tiêu

Hàm thuần không phụ thuộc DB: `ShiftResolver` (precedence assignment → department → branch → tenant → default; ca đêm; ngày lễ) và `AttendanceCalculator` (muộn/về sớm grace 2 chiều, worked minutes trừ break, OT trong window trừ ot_grace/min_ot, 6 trạng thái, ca đêm gán ngày bắt đầu). Unit test ≥ 20 case biên (ADR-S09-003 §4).

## 2. Thao tác

- [x] `AttendanceStatus` enum + model records (ShiftDef, CalcInput, CalcResult)
- [x] `ShiftResolver.resolve(input)` thuần
- [x] `AttendanceCalculator.calculate(input)` thuần
- [x] Unit test biên toàn diện

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Unit test calculator + resolver | **Pass** | 26 + 14 test, BUILD SUCCESS 2026-11-02 15:32 |
| Case biên: ca đêm, grace 2 chiều, OT dưới ngưỡng, log lộn xộn, chưa có ca, ngày lễ | Pass | AttendanceCalculatorTest (26 case) + ShiftResolverTest (14 case) |

Ghi chú thiết kế rút ra khi implement: grace_in dịch ngưỡng muộn **sau** giờ bắt đầu (`start + grace` — Odoo "in favor of employee"); OFF trong template/assignment là **ràng buộc** tại tầng đó (không rơi xuống tầng dưới); OT chỉ tính trong window đã duyệt, trừ ot_grace, dưới min_ot về 0.

## 4. Bàn giao

- Files: `engine/**`, `model/**`, `src/test/**`. Chưa chạy: integration (TASK-446).

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Engine + unit test PASS | Developer; working tree |
