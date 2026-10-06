# [TASK-382] Phân quyền hai tầng: quyền module + grant theo loại

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-382 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-378 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `core/security` (kiểm tra), `modules/catalog/service/CatalogGrantService.java` |

## 1. Mục tiêu

Mọi API quản trị kiểm tra **cả** quyền module **và** grant trên loại; lỗi rõ ràng cho FE.

## 2. Các thao tác

- [ ] Đăng ký quyền `catalog:*` vào catalog + gán vai trò hệ thống (đã seed ở TASK-375)
- [ ] Bộ kiểm tra dùng chung: `requireTypeAccess(typeCode, READ|WRITE)`
- [ ] Test: có quyền module nhưng thiếu grant ⇒ 403 `CATALOG_TYPE_FORBIDDEN`; có grant ⇒ ghi được

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-09**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
