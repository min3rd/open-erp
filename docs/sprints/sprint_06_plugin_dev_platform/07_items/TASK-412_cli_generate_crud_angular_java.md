# [TASK-412] CLI generate CRUD Angular + Java

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-412 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — CLI tests 11/11, generated plugin `mvn package` + DTO test + `ng build` PASS / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Sinh màn CRUD Angular (list + form drawer + service + route + i18n) và Java DTO/service/resource cho từng entity.

## 2. Việc phải làm

- [x] List dùng DataTable/Pagination shared; filter/sort/page; drawer tạo/sửa.
- [x] Form dùng SharpInput/SharpSelect/SharpToggle; validation theo field; i18n 100%.
- [x] Service Angular gọi API plugin; route + menu screen.
- [x] Java DTO/service/resource CRUD qua `PluginDataClient`; 4 khuôn mẫu response.
- [x] Không sinh `.spec.ts`; test backend list/create; `--dry-run`/`--force`.

## 3. Tiêu chí nghiệm thu

- CRUD list/form/drawer chạy desktop; build PASS.
- Java service/resource compile + test list/create PASS trên PostgreSQL/Redis thật.
- Không hardcode chuỗi; không modal; i18n key đủ vi/en.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: TASK-411, TASK-409
- Write scope: `tools/open-erp-cli/src/lib/generator/crud.js`, `tools/open-erp-cli/src/lib/template-v2/web/**`, `tools/open-erp-cli/src/lib/template-v2/java/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
