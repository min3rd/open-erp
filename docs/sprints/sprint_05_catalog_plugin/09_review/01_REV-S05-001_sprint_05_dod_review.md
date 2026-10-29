# [REV-S05-001] Nghiệm thu & đóng Sprint 05 — Catalog plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S05-001 / Sprint review & DoD / Sprint 05 |
| Trạng thái / phiên bản / ngày | **CLOSED — APPROVED** / 1.0 / 2026-10-29 |
| Owner / reviewer | PM / Khách hàng (Product Owner) + Architect + QA |
| Phạm vi | 22 AC của [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md); plugin catalog độc lập, TASK-394…406 |
| Baseline | `c94211f4` (QA TASK-404/406) + commit đóng gói tài liệu/shared-runtime cleanup trên `develop` |
| Evidence | [EVD-S05-001](../08_testing/evidence/00_EVD-S05-001_evidence_index.md), [TR-S05-002](../08_testing/03_TR-S05-002_plugin_architecture_test_report.md), [TR-S05-003](../08_testing/04_TR-S05-003_feat31_32_test_report.md), [TR-S05-004](../08_testing/05_TR-S05-004_task404_task406_test_report.md) |

## 1. Tóm tắt điều hành

- **Sprint 05 CLOSED 2026-10-29** theo chỉ đạo trực tiếp của chủ dự án (“ok chốt xong sprint 5”), sau PM DoD PASS.
- Catalog đã là **plugin độc lập** (zero-DB, gRPC data gateway, shared runtime theo version); core không còn module/bảng catalog.
- **0 bug Critical/High mở**. Toàn bộ BUG-135…153 đã Resolved.
- Backend **268 PASS / 0 fail / 1 skip**; i18n **13/13 locale 100%**; desktop + mobile 390×844 **0 console error**, overflow 0.
- QA sign-off đạt cho toàn sprint (FEAT-30/31/32 + TASK-394…406).
- 1 việc Medium chuyển backlog Sprint sau: [TASK-407](../07_items/TASK-407_cli_scaffold_zero_db.md) (CLI generator còn template Panache/Flyway/datasource) — **đã Done (QA) trong Sprint 06**.

## 2. Trace 22 AC

| AC | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| AC-01…AC-04 (DAG, đa cha, nhảy cấp) | ✅ PASS | TR-S05-002 (gateway/edge tests), TR-S05-003 (relation system) |
| AC-05 (chu trình) | ✅ PASS | TR-S05-003 §1 #4 (`CATALOG_TYPE_RELATION_CYCLE`) |
| AC-06…AC-08 (version/as-of/valid_to) | ✅ PASS | TR-S05-002 backend suite; `PluginDataGatewayTest` |
| AC-09 (quyền module + grant) | ✅ PASS | TR-S05-002 grants/permissions tests; TR-S05-003 #16 |
| AC-10…AC-12 (options/lookup/inline) | ✅ PASS | TR-S05-002 gateway/lookup tests; TASK-404/405 |
| AC-13…AC-14 (default install, unlocked, backfill) | ✅ PASS | TASK-406 lifecycle; TR-S05-002 migration/lifecycle |
| AC-15 (tenant isolation) | ✅ PASS | TR-S05-002 `PluginDataGatewayTest`; TR-S05-004 runtime 2 tenant |
| AC-16 (Entity Registry + Desktop/Mobile) | ✅ PASS | `plugin.json` entities/platforms; TR-S05-002 |
| AC-17 (màn đa cha, không modal) | ✅ PASS | TR-S05-004 drawer `Phân cấp`; TASK-405 |
| AC-18…AC-19 (import/export CSV/XLSX) | ✅ Dev PASS — QA browser cũ; cần smoke test trước release | TASK-390; TR-S05-001 withdrawn (residual risk #3) |
| AC-20 (ghi đè/ẩn system) | ✅ PASS | TR-S05-003 clone/sync/override |
| AC-21 (34 tỉnh / 3.321 xã) | ✅ PASS | TR-S05-004 bootstrap log; TR-S05-002 seed |
| AC-22 (Platform system catalog UI) | ✅ Dev PASS — QA ảnh UI cũ; cần smoke test trước release | TASK-392; TR-S05-001 withdrawn (residual risk #3) |

## 3. DoD Sprint 05

| Điều kiện | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| Không còn Critical/High mở | ✅ | 0 bug mở; TASK-398 closure đã Done (PM+QA) |
| 22 AC có bằng chứng | ✅ (19/22 QA mới; 3 AC smoke backlog) | AC-18/19/22 ghi residual risk, chủ dự án chấp nhận khi đóng |
| Backend/Regression | ✅ | 268 PASS / 0 fail / 1 skip |
| Browser desktop + mobile | ✅ | TR-S05-004; 0 console error; mobile 390×844 |
| Tài liệu người dùng | ✅ | UG-S05-001 0.3 final |
| Tài liệu triển khai/dev | ✅ | Deployment/developer guides cập nhật shared runtime + zero-DB |
| Tài liệu sprint đóng gói | ✅ | Sprint-Pack 00…09; REV này |
| PM DoD | ✅ PASS 2026-10-29 | Mục 5 |
| Khách hàng nghiệm thu | ✅ APPROVED 2026-10-29 | Mục 5 |
| Closure | ✅ CLOSED 2026-10-29 | — |

## 4. Release notes

- **Catalog plugin độc lập**: package `plugins/catalog`, UI iframe, data gateway gRPC + mTLS, core-owned migrations.
- **TASK-406**: 1 container/version/scope dùng chung nhiều tenant; disable không undeploy; uninstall/upgrade dọn theo ref-count; token theo request; bootstrap tenant sau commit.
- **TASK-404/405**: workspace quan hệ cha/con trong item drawer; bỏ action inline ở type list.
- **FEAT-31/32**: quan hệ loại, clone/sync system type, backfill/cycle guard.
- **Dọn zero-DB**: plugin không còn datasource/Flyway/Panache/repository; `plugin.json` bỏ `repositories`/`apis` legacy (chỉ giữ `entities`/`queries`/`migrations`); deployer/K8s labels chuyển `tenant_id` → `plugin_scope`.
- **Dev**: bỏ container test khỏi profile `dev`; compose `test` profile cho catalog tĩnh.

## 5. Gate & ký nghiệm thu

| Gate | Trạng thái | Người quyết định | Ngày / ghi chú |
| :--- | :--- | :--- | :--- |
| QA sign-off | ✅ PASS (FEAT-31/32, TASK-404/406) | QA | 2026-10-29 |
| PM DoD | ✅ **PASS 2026-10-29** | PM | Review REV-S05-001 1.0 |
| Customer acceptance | ✅ **APPROVED 2026-10-29** — “ok chốt xong sprint 5” | Chủ dự án | Chỉ đạo trực tiếp |
| Sprint closure | ✅ **CLOSED 2026-10-29** | PM | Sau PM DoD + nghiệm thu |

## 6. Rủi ro tồn đọng / backlog

| # | Mức | Nội dung | Xử lý |
| :--- | :--- | :--- | :--- |
| 1 | Medium | [TASK-407](../07_items/TASK-407_cli_scaffold_zero_db.md): CLI scaffold còn Panache/Flyway/datasource/TENANT_ID — **Done (QA) trong Sprint 06** (TASK-408…413) | Backlog sau Sprint 05 → xử lý S06 |
| 2 | Medium | Chưa E2E upgrade/rollback với **2 version** shared runtime | Test trước release tiếp theo |
| 3 | Medium | AC-18/19/22 chưa smoke test lại UI sau iframe | QA smoke trước nghiệm thu khách hàng |
| 4 | Low | Chưa deploy thử K8s staging cho shared runtime | Staging smoke |
| 5 | Low | System catalog vẫn dùng static `catalog-system-dev` | Migrate sang container `-system` sau |

> Chủ dự án đã nghiệm thu Sprint 05 ngày 2026-10-29 và chấp nhận các rủi ro trên làm backlog Sprint sau; không có mục Critical/High.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bộ hồ sơ đóng Sprint 05; trace AC, DoD, release notes, gate review | PM/QA/Developer |
| 1.0 | 2026-10-29 | PM DoD PASS; khách hàng nghiệm thu; **Sprint 05 CLOSED** | PM + Chủ dự án |
