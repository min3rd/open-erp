# [TASK-428] Core projection, SecurityContext & big-bang cutover

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-428 / Task / Sprint 07 |
| Severity / trạng thái | Critical / **Done (QA)** — projection/API/security PASS; **cutover C6 hoàn tất 2026-11-01**: Core đọc projection duy nhất, legacy org module/bảng/permission đã drop (V7.0.7), 254/254 backend test PASS |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-11-01 / ADR-001/002, DES-DB 0.2 |
| depends_on / blocks / parent | TASK-426/427 / FEAT-37 / FEAT-36 |
| Write scope / baseline | `src/backend/**`, `scripts/**`; working tree |

## 1. Mục tiêu

Tạo `core_user_scope`, `core_user_manager_edge`, `core_department_closure`; đổi `SecurityContextService` sang projection; internal API; cutover big-bang + rollback.

## 2. Thao tác

- [x] Migration `V7.0.0` projection; internal API upsert/delete/closure (service token).
- [x] `SecurityContextService` đọc projection trước; fallback legacy chỉ khi projection chưa có.
- [x] Rebuild qua `ScopeProjectionService.rebuildFromLegacy` + `scripts/ops/org-cutover.mjs`.
- [x] Cutover script freeze/copy/verify/rebuild; backup/rollback drill; drop legacy — **2026-11-01: `V7.0.7__organization_cutover_drop_legacy.sql` drop 4 bảng legacy + xóa permission `core:*` cũ + seed org-structure always-on (locked default-install)**; SecurityContextService bỏ fallback legacy (projection-only); `modules/organization` xóa toàn bộ (ADR-S07-002 C6); `AuthService` bỏ provisioning legacy (org plugin bootstrap đảm nhận); `TenantQuotaService`/`SampleRecordService` chuyển projection; test fixtures chuyển projection.
- [x] Tests projection precedence + department closure + subordinate + cross-tenant isolation; **backend suite 254/254 PASS 2026-11-01**.

## 3. Tiêu chí & kiểm chứng

- [x] Projection tables migration `V7.0.0`; internal API upsert/delete/closure/rebuild.
- [x] `SecurityContextService` đọc projection (projection-only sau cutover C6).
- [x] Cutover big-bang: freeze/backup/rebuild/verify/drop legacy — code + migration hoàn tất; `drop-legacy` chạy thật trên QA dev (TR 1.14); staging/prod theo runbook.
- [x] Tests data scope matrix + cutover dry-run (`ScopeProjectionServiceTest` 2/2, suite 254/254).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Backend `mvn package` | **Pass** | compile toàn bộ backend |
| `ScopeProjectionServiceTest` | **Pass** | projection precedence, closure, subordinate, cross-tenant |
| Cutover `status`/`backup` | **Pass** | `scripts/ops/org-cutover.mjs` chạy trên PostgreSQL thật |
| Cutover copy/verify/drop | **Pass** | TR 1.14 drop-legacy QA dev; V7.0.7 drop schema-wide 2026-11-01; backend 254/254 PASS |

## 4. Bàn giao

Files: `V7.0.0__scope_projection.sql`, `V7.0.7__organization_cutover_drop_legacy.sql`, `ScopeProjectionService`, `ScopeProjectionResource`, `SecurityContextService` projection-only, xóa `modules/organization/**`. Blocker: none. Lịch sử:

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Projection tables/API/service + SecurityContext projection-first fallback; backend package PASS; cutover pending | Developer |
| 0.3 | 2026-10-30 | Thêm cutover script/runbook, backup/status chạy thật, test projection + cross-tenant PASS; drop legacy chờ QA/maintenance | Developer |
| 0.4 | 2026-11-01 | Cutover C6 hoàn tất: V7.0.7 drop legacy + org-structure always-on; Core projection-only; 254/254 test PASS theo chỉ đạo hoàn tất deferred, không đẩy sprint sau | Developer |
