# [TASK-410] CLI interactive engine + wizard

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-410 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — menu create/entity/field/relation/contribution/validate + `--interactive` / 0.3 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Thêm menu tổng, prompt primitives và draft model; bare `open-erp-cli` mở wizard; mọi lệnh hỗ trợ `--interactive`.

## 2. Việc phải làm

- [x] `prompt.js`: text/confirm/select/multi; Ctrl+C không ghi file.
- [x] `wizard.js`: menu tạo plugin/entity/contribution/validate.
- [x] Draft model tối giản qua flags/command; `--non-interactive` giữ flag cũ.
- [x] `create` dùng wizard; `generate --interactive` hoạt động cho entity/field/relation/contribution.
- [x] Test CLI 7/7; cập nhật help/README.

## 3. Tiêu chí nghiệm thu

- Bare command mở menu; chọn được từng luồng.
- `--non-interactive` vẫn chạy như cũ; thiếu flag báo lỗi rõ.
- Ctrl+C/thoát giữa chừng không ghi file; test PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: TASK-408
- Write scope: `tools/open-erp-cli/src/interactive/**`, `tools/open-erp-cli/src/commands/create.js`, `tools/open-erp-cli/src/commands/generate.js`, `tools/open-erp-cli/bin/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
