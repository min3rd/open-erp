# [TASK-383] Seed danh mục cố định + cầu nối Phòng ban (departments)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-383 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-379 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogSeedService.java`, `CatalogLookupService` (source SYSTEM_BACKED) |

## 1. Mục tiêu

Tenant mới có sẵn danh mục dùng ngay (Chức danh, Loại hợp đồng, Ca làm việc, Trình độ) và trường Phòng ban lấy từ cây tổ chức.

## 2. Các thao tác

- [ ] Seed khi cài đặt/backfill: Chức danh + Loại hợp đồng + Ca làm việc + Trình độ học vấn (tiếng Việt + name_en)
- [ ] Loại `DEPARTMENT` = SYSTEM_BACKED đọc từ `departments` (chỉ đọc, không tạo bản ghi trùng)
- [ ] Cho phép nhập tự do với loại `JOB_TITLE` (khách chốt Q4)

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-12, AC-13**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
