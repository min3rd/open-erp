# [TASK-408] Template backend 2.0 zero-DB

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-408 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — template backend zero-DB; `mvn package` PASS / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Viết lại template backend plugin theo kiến trúc zero-DB của Sprint 05: POJO + DTO + service/resource + query descriptor + `plugin-sdk`; không Panache/JDBC/Flyway/datasource/`TENANT_ID`.

## 2. Việc phải làm

- [x] POM chỉ còn Quarkus REST, health, `plugin-sdk`, test; bỏ JDBC/Hibernate/Flyway.
- [x] `application.properties` chỉ còn gateway/Redis/TLS; bỏ datasource/Flyway.
- [x] Entity mẫu là POJO; bỏ repository Panache; resource dùng DTO + `ApiResponse.successList`.
- [x] Migration đặt trong `migrations/`, khai báo `migrations[]` + SHA-256; không `tenant_id`.
- [x] Cập nhật README template + next steps; thêm kiểm tra forbidden strings trong test.
- [x] Test Node + smoke `mvn -q -DskipTests package` PASS.

## 3. Tiêu chí nghiệm thu

- Plugin `create` không còn `Panache`, `quarkus-jdbc-postgresql`, `quarkus-flyway`, `datasource`, `TENANT_ID`.
- `mvn package` PASS với plugin sinh ra; migration checksum khớp.
- Test CLI template PASS; golden file không lệch.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: Design review PASS; TASK-407 (backlog cũ)
- Write scope: `tools/open-erp-cli/src/lib/templates.js`, `tools/open-erp-cli/src/lib/template-v2/**`, `tools/open-erp-cli/test/**`
- Mức độ: **High**
- Ghi chú: Đây là nội dung TASK-407 nâng cấp; đóng TASK-407 khi TASK-408 Done.
- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
