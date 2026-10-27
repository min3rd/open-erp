# [TASK-395] Schema plugin + di trú dữ liệu + system catalog

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-395 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do** — chặn bởi TASK-394 |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-394 / TASK-396…398 |
| Write scope | `plugins/catalog/src/main/resources/db/plugin-migration/**`, `src/backend/src/main/resources/db/migration/V5.0.0__*.sql`, `V5.0.1__*.sql` |

## 1. Mục tiêu

Chuyển 4 bảng catalog khỏi schema `public` sang mô hình: plugin sở hữu toàn bộ dữ liệu (system tenant canonical + bản sao tenant); di trú dữ liệu cũ an toàn.

## 2. Việc phải làm

- [ ] Plugin migration `V1.0.0__initial_schema.up.sql`: 4 bảng không `tenant_id`; `catalog_type_grants.role_code`; `catalog_audit`; EXCLUDE/index/constraint; `down.sql`.
- [ ] Seed 5 loại tenant + grant mặc định trong plugin migration (idempotent).
- [ ] Copy CSV địa giới vào plugin `src/main/resources/seed/`; seeder đọc resource, không gọi mạng.
- [ ] Core migration `V5.0.0`: seed **system tenant ẩn** + `tenant_plugins` ACTIVE; tạo schema system tenant + copy `public.catalog_*` có `tenant_id IS NULL`; tạo schema từng tenant + copy dữ liệu tenant; verify row count; drop 4 bảng public.
- [ ] Core migration `V5.0.1`: cập nhật `plugin_catalog`/`plugin_versions` cho `catalog` (published, distribution image).
- [ ] Không tạo `modules/catalogsystem`; không có bảng catalog trong core.
- [ ] Test migration trên DB dev có dữ liệu 60 tenant; rollback/backup trước khi drop.

## 3. Tiêu chí nghiệm thu

- Không còn bảng `catalog_*` trong `public`.
- System tenant + schema canonical có system types + địa giới; schema tenant có dữ liệu tenant tương ứng.
- Row count trước/sau khớp; verify fail-fast.
- Plugin container start tạo schema + migrate idempotent.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task; chốt A5/A6/A12 | Agent; ADR-S05-001 |
