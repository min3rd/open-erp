# [TASK-423] QA test plan/report Sprint 06

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-423 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — 7 bug Resolved, 22/22 AC PASS, QA sign-off; TR-S06-001 1.5 / 1.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Lập test plan + report + evidence cho template/CLI/slot/catalog/notification; browser desktop/mobile.

## 2. Việc phải làm

- [x] TP theo 22 AC + ma trận desktop/mobile/theme/i18n.
- [x] Backend test PostgreSQL/Redis thật; CLI smoke; catalog regression.
- [x] Browser desktop: header, settings tab, notification, catalog WC; 0 console error.
- [x] Browser mobile 390×844: phát hiện contribution header thiếu + bảng records bị cắt.
- [x] Evidence ảnh + log tại `08_testing/evidence/sprint_06_retest/`.
- [x] Bug report + fix/verify: BUG-154…160 (7 bug Resolved).
- [x] Re-test sau fix mobile + AC-05/11/16.
- [x] TR 1.2 + QA sign-off trước PM DoD.

## 3. Tiêu chí nghiệm thu

- TP/TR/EVD đầy đủ; trace AC.
- Desktop ≥1280 + mobile 390×844 PASS; 0 console error.
- 0 Critical/High mở trước nghiệm thu.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-408…421
- Write scope: `docs/sprints/sprint_06_plugin_dev_platform/08_testing/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.2 | 2026-10-29 | TP/TR created; desktop/mobile theo dev evidence; sign-off pending | QA; TASK-423 |
| 0.3 | 2026-10-29 | QA re-test bằng Chromium; thêm ảnh + log; AC-10 PASS; phát hiện BUG-154/155 (High), 156/157/158 (Medium/Low); sign-off blocked | QA; TASK-423 |
| 1.0 | 2026-10-29 | Fix toàn bộ bug + AC-05/11/16; backend 32/32, CLI 11/11, desktop/mobile 0 console error; QA sign-off | QA/Developer; TR-S06-001 1.2 |
| 1.1 | 2026-10-29 | Final re-check 11/11 PASS (desktop 8 + mobile 3); backend 32/32, CLI 11/11 | QA; TR-S06-001 1.3 |
| 1.2 | 2026-10-29 | Q19/Q20 PASS: 22/22 AC, drawer 19/19; plugin 1.0.7; old notification table dropped | QA; TR-S06-001 1.5 |
