# [TASK-413] CLI validate + upgrade + test

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-413 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — validate offline/`--core-url`, upgrade check/apply, CLI tests 11/11 / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Validate offline + `--core-url`; `upgrade --check/--apply` cho template 2.0; test đầy đủ.

## 2. Việc phải làm

- [x] Offline: schema/manifest/field/validator/relation/migration checksum/slot syntax/render mode.
- [x] `--core-url`: kiểm tra Entity Registry + UI Slot Registry; báo PASS/FAIL/WARN.
- [x] `upgrade --check`: MISSING/OUTDATED/CUSTOMIZED; `--apply` backup + giữ file customized.
- [x] Test Node: prompt, generator snapshot, validate, upgrade.
- [x] CI smoke `create → generate entity → generate crud → validate → build`.

## 3. Tiêu chí nghiệm thu

- Validate bắt được manifest/field/relation/slot/checksum sai; exit code đúng.
- Upgrade không ghi đè file customized; backup rõ ràng.
- Test CLI + smoke build PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: TASK-410, TASK-411, TASK-412
- Write scope: `tools/open-erp-cli/src/commands/validate.js`, `tools/open-erp-cli/src/commands/upgrade.js`, `tools/open-erp-cli/src/lib/validate/**`, `tools/open-erp-cli/test/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
