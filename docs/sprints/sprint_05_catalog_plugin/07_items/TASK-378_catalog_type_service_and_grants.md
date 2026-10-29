# [TASK-378] CRUD loại danh mục + quản trị quyền theo loại

> **Trạng thái lịch sử:** task baseline của kiến trúc in-process (TR-S05-001 đã withdrawn). Đã được thay thế bởi TASK-394…406 (plugin độc lập). Không dùng làm bằng chứng QA/DoD.

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-378 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `fde4f03`; QA TC-01/09/10** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogTypeService.java`, `resource/CatalogTypeResource.java`, `CatalogGrantService` |

## 1. Mục tiêu

Tenant tạo/sửa loại danh mục của mình và cấu hình vai trò nào được xem/ghi từng loại.

## 2. Các thao tác

- [ ] CRUD loại (không đổi `code`; loại hệ thống chỉ platform ghi)
- [ ] API grants `GET/PUT /types/{code}/grants` (ghi đè danh sách, validate role thuộc tenant)
- [ ] Audit mọi mutation; mã lỗi theo DES-API §6

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-09, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

API loại danh mục + grant: `GET/POST /types`, `PUT /types/{id}`, `GET/PUT /types/{code}/grants` (body `{grants:[...]}`); loại hệ thống chỉ đọc với tenant; `CatalogTypeResource` giữ luôn các handler `/types/{code}/items` (Quarkus chọn root dài nhất, không fallback).

**Tiến độ 2026-10-06**: hoàn thành trong đợt API (agent backend). Kiểm chứng: **34 test PASS** (23 test mới + 11 test cũ giữ xanh) trên PostgreSQL + Redis thật, không H2; bộ regression `PlatformAuthApiTest`, `PlatformPasswordChangeGuardTest`, `ImpersonationApiTest` **13/13 PASS**. Đường dẫn API khớp DES-API (kể cả `/api/v1/catalog/system/*` đã chốt ở §2.1). Trạng thái: **code xong, test PASS — chờ commit + QA (TASK-389)**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
