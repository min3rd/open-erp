# [TASK-459] Shared UI Components + 100% i18n Parity (13 Locales)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-459 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) §3, §5 |
| depends_on / blocks / parent | FEAT-43..46 / TASK-460, TASK-461 / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `src/frontend/shared/**`, `src/frontend/web/public/i18n/**`, `src/frontend/mobile/public/i18n/**` |

## 1. Mục tiêu

1. Xây dựng các UI component dùng chung độc lập trong `src/frontend/shared/components/`:
   - `AttendanceStatusBadge`: Huy hiệu trạng thái chấm công chuẩn 6 trạng thái + cờ `needs_review` (viền đứt).
   - `LeaveBalanceCard`: Thẻ thống kê số dư phép cá nhân (Được cấp, Đã dùng, Còn lại, Sắp hết hạn).
   - `PeriodStepper`: Thanh chỉ báo tiến trình 4 bước bảng công (`S1_LOGS` -> `S2_SCHEDULE` -> `S3_CALCULATE` -> `S4_ADJUST` -> `DONE`).
   - `GpsIndicator`: Hiển thị trạng thái tọa độ GPS và khoảng cách địa lý (Haversine).
   - `RequestTimeline`: Hiển thị dòng thời gian tiến trình xử lý đơn từ.
2. Cập nhật và bổ sung 100% chuỗi i18n cho toàn bộ 13 ngôn ngữ (`en`, `vi`, `ar`, `de`, `es`, `fr`, `id`, `ja`, `ko`, `pt-BR`, `ru`, `th`, `zh-CN`) trên cả Web và Mobile (`npm run i18n:check:strict` đạt 100% OK).
