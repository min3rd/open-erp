# [TASK-411] CLI generate entity/field/relation

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-411 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — entity/field/relation + wizard + migration checksum; CLI tests 7/7 / 0.3 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Sinh entity/field/validator/relation đúng manifest 2.0; FK cùng plugin, soft ref Core/plugin khác; migration + quyền + query descriptor.

## 2. Việc phải làm

- [ ] Entity wizard: name/table/storage/fields/relations/CRUD.
- [x] Field types + migration zero-DB; `generate entity --fields` sinh POJO + migration + query descriptor.
- [x] `generate field` hỗ trợ validator/enum values; cập nhật Java + migration.
- [x] Relation wizard: self/core/plugin target; FK/SOFT_REF; display field; on_delete.
- [x] Generator idempotent; manifest ghi sau cùng; migration checksum.
- [x] Test CLI 7/7 + validate case xấu.

## 3. Tiêu chí nghiệm thu

- Tạo entity với field/validator sinh đúng Java + SQL + manifest.
- Relation `self.*` sinh FK; `core.*`/`plugin:*.*` sinh cột id + text soft ref.
- Chạy lại không ghi đè nếu không `--force`; validate PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: TASK-410, TASK-408
- Write scope: `tools/open-erp-cli/src/interactive/{entity,field,relation}-wizard.js`, `tools/open-erp-cli/src/lib/generator/{entity,manifest}.js`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
