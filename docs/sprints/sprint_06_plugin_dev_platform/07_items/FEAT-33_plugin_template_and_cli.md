# [FEAT-33] Plugin template 2.0 & CLI tương tác

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-33 / Feature / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — TASK-408…413; CLI tests 11/11; TR-S06-001 1.5 / 1.0 / 2026-10-29 |
| Owner / reviewer | PM + Architect / Chủ dự án |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, [00_READING_GUIDE](../00_READING_GUIDE.md) |
| Đọc trước / đọc tiếp | Các task con bên dưới |


## 1. Mục tiêu

Sinh plugin zero-DB đúng runtime Sprint 05 và cung cấp CLI hỏi–đáp tạo plugin/entity/field/relation/CRUD, validate, upgrade.

## 2. Task con

- [TASK-408](TASK-408_template_backend_2_0_zero_db.md) — Template backend 2.0 zero-DB
- [TASK-409](TASK-409_template_web_web_component_contribution_entry.md) — Template web Web Component + contribution entry
- [TASK-410](TASK-410_cli_interactive_engine_wizard.md) — CLI interactive engine + wizard
- [TASK-411](TASK-411_cli_generate_entity_field_relation.md) — CLI generate entity/field/relation
- [TASK-412](TASK-412_cli_generate_crud_angular_java.md) — CLI generate CRUD Angular + Java
- [TASK-413](TASK-413_cli_validate_upgrade_test.md) — CLI validate + upgrade + test

## 3. Tiêu chí nghiệm thu

- Template 2.0 tạo plugin build được, không Panache/Flyway/datasource/TENANT_ID.
- CLI bare wizard + `--interactive` hoạt động; `--non-interactive` giữ cho CI.
- Sinh entity/field/validator/relation/CRUD Angular + Java; validate offline + `--core-url`.
- Plugin cũ (catalog) migrate template 2.0 theo kế hoạch.

## 4. Phụ thuộc & ghi chú

- Phụ thuộc: CONF-S06-001 1.0; design DES-ARCH-S06-001/002, DES-API-S06-001
- Task 408–413; ưu tiên P1 cùng slot runtime.
- Design đã duyệt; task là kế hoạch triển khai, trạng thái Done phải có bằng chứng.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 1.0 | 2026-10-29 | TASK-408…413 Done (QA); CLI tests 11/11; template zero-DB; Sprint CLOSED | QA/PM; TR-S06-001 1.5, REV-S06-001 |
