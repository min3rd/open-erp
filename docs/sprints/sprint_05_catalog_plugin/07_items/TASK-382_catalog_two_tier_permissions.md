# [TASK-382] Phân quyền hai tầng: quyền module + grant theo loại

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-382 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress — code xong, test PASS (2026-10-06); chờ commit + QA** |
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
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Phân quyền 2 tầng: `@RequirePermission` (quyền module) + `CatalogPermissionGuard` kiểm tra `can_read`/`can_write` theo vai trò; loại hệ thống đọc được với quyền module; ghi cạnh chạm loại hệ thống ⇒ `CATALOG_TYPE_FORBIDDEN`; nhánh hệ thống qua `PlatformRoleRequiredFilter` (tenant ⇒ `403 PLATFORM_ACCESS_DENIED`).

**Tiến độ 2026-10-06**: hoàn thành trong đợt API (agent backend). Kiểm chứng: **34 test PASS** (23 test mới + 11 test cũ giữ xanh) trên PostgreSQL + Redis thật, không H2; bộ regression `PlatformAuthApiTest`, `PlatformPasswordChangeGuardTest`, `ImpersonationApiTest` **13/13 PASS**. Đường dẫn API khớp DES-API (kể cả `/api/v1/catalog/system/*` đã chốt ở §2.1). Trạng thái: **code xong, test PASS — chờ commit + QA (TASK-389)**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
