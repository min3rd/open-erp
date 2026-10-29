# [00] Sprint 05 — Plugin nghiệp vụ độc lập đầu tiên: Danh mục & quản trị danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S05-001 / 1.0 / 2026-10-29 |
| Trạng thái tài liệu / sprint | **CLOSED — APPROVED 2026-10-29** (PM DoD + khách hàng nghiệm thu) |
| Owner / reviewer | PM Agent / Chủ dự án + Architect + QA |
| Đầu vào / đọc trước / đọc tiếp | [RAW-S05-001](01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) — chỉ đạo trực tiếp của chủ dự án / [Sprint 04](../sprint_04_ui_ux_experience/00_READING_GUIDE.md) (đã đóng) / [REV-S05-001](09_review/01_REV-S05-001_sprint_05_dod_review.md) |

> **✅ 2026-10-29 — SPRINT 05 ĐÃ ĐÓNG:** catalog là plugin độc lập (zero-DB, data gateway, shared runtime theo version); 0 bug Critical/High mở; QA PASS cho FEAT-30/31/32 + TASK-394…406. Biên bản/DoD tại [REV-S05-001](09_review/01_REV-S05-001_sprint_05_dod_review.md). Backlog Medium chuyển tiếp: [TASK-407](07_items/TASK-407_cli_scaffold_zero_db.md) + các rủi ro ghi ở REV §6.

## 1. Đọc để hiểu gì?

Sprint 05 tạo **plugin nghiệp vụ độc lập đầu tiên** của hệ thống — hạ tầng **danh mục dùng chung** cho mọi plugin nghiệp vụ về sau:

1. **Cấu trúc dữ liệu danh mục**: phân cấp nhiều cấp (tỉnh → huyện → xã), **nhảy cấp** (tỉnh → xã), **đa cha/DAG** (Lập trình viên ⊂ CNTT **và** ⊂ Khoa học dữ liệu; Công việc ⊂ Ngành **và** ⊂ Phân bổ).
2. **Version + hiệu lực theo thời gian** cho cả bản ghi và quan hệ cha–con.
3. **Quản trị danh mục**: CRUD, phân quyền **hai tầng** (quyền module + quyền theo từng loại danh mục).
4. **API cho form động**: schema loại, options lazy (tenant + hệ thống), resolve theo lô, tạo nhanh khi nhập tự do.
5. **Danh mục cố định cho doanh nghiệp**: Chức danh, Phòng ban (cầu nối cây tổ chức)… autocomplete **hoặc** nhập tự do.
6. **Plugin luôn bật**: cài tự động cho tenant mới và backfill tenant hiện có; không gỡ được.

Người mới đọc trước: [Developer Reading Guide](../../08_developer_guides/00_READING_GUIDE.md) → [Project walkthrough](../../08_developer_guides/01_project_walkthrough.md) → [shared UI guide](../../08_developer_guides/shared_ui_contribution_guide.md).

## 2. Lộ trình đọc

Khách hàng đọc 01–04 và 08–09. Developer đọc CONF, SOL, DES, item, QA/review.

| Thứ tự | ID/alias | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S05-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) | Nguyên văn yêu cầu + bóc tách R1–R8 | BA |
| 02.01 | ANL-S05-001 | [Bài toán dữ liệu](02_analysis/01_ANL-S05-001_catalog_data_model_problems.md) | Cây/DAG, nhảy cấp, version, hiệu lực, trường hợp biên | BA |
| 02.02 | ANL-S05-002 | [Chức năng, phân quyền, form động](02_analysis/02_ANL-S05-002_admin_features_permissions_dynamic_forms.md) | CRUD, quyền 2 tầng, API form, danh mục cố định, always-on | BA |
| 03.01 | BENCH-S05-001 | [Đối chuẩn danh mục ERP](03_benchmarks/01_BENCH-S05-001_catalog_patterns_in_erp.md) | Odoo/ERPNext/Drupal/ServiceNow… làm thế nào; bài học | BA |
| 04.01 | CONF-S05-001 | [Scope & AC Sprint 05](04_confirmation/01_CONF-S05-001_sprint_05_scope.md) | ✅ **CONFIRMATION GATE APPROVED 2026-10-06** — **22 AC**, 25/25 câu đã trả lời | BA + Khách hàng |
| 05.01 | SOL-S05-001 | [Kiến trúc plugin](05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) | 16 quyết định kiến trúc + luồng + rủi ro — **D1 bị bác** | Architect |
| 05.02 | ADR-S05-001 | [Catalog plugin package độc lập](05_solutions/02_ADR-S05-001_catalog_independent_plugin.md) | Hướng B: package trong monorepo, container/schema/gateway/UI riêng; **plugin sở hữu system catalog + fan-out**; 12 quyết định + 5 phase | Architect |
| 05.03 | ADR-S05-002 | [Backend plugin tối giản](05_solutions/03_ADR-S05-002_thin_plugin_backend.md) | Plugin khai báo entity/relations/repository/API/WS; core cấp datasource/security/SDK runtime | Architect |
| 05.04 | SOL-S05-002 | [Plugin Data Gateway gRPC](05_solutions/04_SOL-S05-002_plugin_data_gateway_grpc.md) | Plugin zero DB; core validate/execute query DSL; mTLS, migration core, Redis cache; **Approved** | Architect |
| 06.01 | DES-DB-S05-001 | [Thiết kế CSDL](06_designs/db/01_DES-DB-S05-001_catalog_schema.md) | DDL 4 bảng, EXCLUDE, index, seed/backfill, truy vấn mẫu | Architect |
| 06.02 | DES-API-S05-001 | [Thiết kế API](06_designs/api/01_DES-API-S05-001_catalog_api.md) | 3 nhóm API + contract + mã lỗi | Architect |
| 06.03 | DES-UI-S05-001 | [Thiết kế UI](06_designs/ui/01_DES-UI-S05-001_catalog_admin_ui.md) | Màn 3 cột + component picker + ma trận Desktop/Mobile | Architect |
| 07.01 | FEAT-30 | [Plugin Danh mục](07_items/FEAT-30_catalog_core_plugin.md) | Feature + 19 task baseline lịch sử; **Done (QA)** theo plugin độc lập TASK-394…406 | Developer/QA |
| 07.02 | TASK-375…393 | [07_items/](07_items/) | Baseline code lịch sử (19/19) — **superseded** bởi TASK-394…406, không dùng nghiệm thu | Developer |
| 07.03 | TASK-394…407 | [07_items/](07_items/) | Tái triển khai plugin độc lập, data gateway, shared runtime, QA; TASK-407 Medium backlog | Developer/QA |
| 08.01 | TP-S05-001 | [Test plan Sprint 05](08_testing/01_TP-S05-001_sprint_05_test_plan.md) | **25 TC** theo AC + ma trận lấy mẫu | QA |
| 08.02 | TR-S05-001 | [Test report Sprint 05](08_testing/02_TR-S05-001_sprint_05_test_report.md) | Baseline cũ **21 PASS / 4 PARTIAL** — **withdrawn**, phải chạy lại sau khi đổi kiến trúc | QA |
| 08.03 | EVD-S05-001 | [Evidence index](08_testing/evidence/00_EVD-S05-001_evidence_index.md) | **12 ảnh minh chứng** (baseline cũ; dùng lại sau khi UI chuyển sang plugin) | QA |
| 08.04 | TR-S05-003 | [Test report FEAT-31/32](08_testing/04_TR-S05-003_feat31_32_test_report.md) | Quan hệ loại, clone/xoá clone/sync/platform sync — **Pass (QA)** | QA |
| 08.05 | TR-S05-004 | [Test report TASK-404/406](08_testing/05_TR-S05-004_task404_task406_test_report.md) | Workspace quan hệ cha/con + shared runtime 1 container/version — **Pass (QA)** | QA |
| 09.01 | REV-S05-001 | [Nghiệm thu & đóng Sprint 05](09_review/01_REV-S05-001_sprint_05_dod_review.md) | Trace 22 AC, DoD, release notes, gate review — **CLOSED 2026-10-29** | PM + Khách hàng |

> Bảng đọc là snapshot danh mục. Khi thêm artifact phải cập nhật index này trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (CONF-S05-001) | ✅ **APPROVED 2026-10-06** — 22 AC + 19 task được duyệt | Khách hàng (chủ dự án) | CONF 1.0; chỉ đạo trực tiếp "ok chốt scope và lập trình đi nhé" |
| Design ready (SOL/DES) | ✅ **APPROVED sau re-architecture** — ADR-S05-001 (plugin độc lập), data gateway SOL-S05-002; TR-S05-002 PASS | Architect/Reviewer | ADR/SOL + TR-S05-002 |
| QA sign-off | ✅ **PASS toàn sprint** — FEAT-30/31/32 + TASK-394…406; TR-S05-002/003/004 | QA | 2026-10-29 |
| PM đánh giá DoD | ✅ **PASS 2026-10-29** — 0 Critical/High mở; 22 AC trace; REV-S05-001 | PM | REV-S05-001 1.0 |
| Customer acceptance | ✅ **APPROVED 2026-10-29** — chủ dự án chỉ đạo "ok chốt xong sprint 5" | Khách hàng | REV-S05-001 §5 |
| Closure | ✅ **CLOSED 2026-10-29** | PM | REV-S05-001 §5 |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S05-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | PM | Used |
| RAW-S05-001 | [01_raw_notes/](01_raw_notes/) | BA | Used |
| ANL-S05-001…002 | [02_analysis/](02_analysis/) | BA | Used |
| BENCH-S05-001 | [03_benchmarks/](03_benchmarks/) | BA | Used |
| CONF-S05-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used (APPROVED 2026-10-06) |
| SOL-S05-001 | [05_solutions/](05_solutions/) | Architect | Used |
| DES-DB/API/UI-S05-001 | [06_designs/](06_designs/) | Architect | Used |
| FEAT-30 | [07_items/FEAT-30](07_items/FEAT-30_catalog_core_plugin.md) | Developer | Used (Planned) |
| TASK-375…389 | [07_items/](07_items/) | Developer | Used — **superseded** (baseline lịch sử; xem banner từng file) |
| TASK-390…391 | [07_items/](07_items/) | Developer | Used — **superseded** (import/export + ghi đè đã chuyển sang plugin độc lập) |
| TASK-392…393 | [07_items/](07_items/) | Developer | Used — **superseded** (platform UI + seed nằm trong plugin độc lập) |
| BUG-135 | [BUG-135](07_items/BUG-135_catalog_not_independent_plugin.md) | Architect → Developer | Used — **Resolved (dev+QA)** |
| BUG-136 | [BUG-136](07_items/BUG-136_locked_plugin_uninstall_not_blocked.md) | Developer | Used — **Resolved (dev+QA)** |
| BUG-137…153 | [07_items/](07_items/) | Developer/QA | Used — **Resolved** (plugin host/CSS/context menu/mobile, pagination, sync, clone) |
| TASK-394…406 | [07_items/](07_items/) | Developer/QA | Used — **Done (QA/PM)**, gồm TASK-398 closure |
| TASK-407 | [TASK-407](07_items/TASK-407_cli_scaffold_zero_db.md) | Developer | Used — **Open (Medium)** backlog: CLI scaffold zero-DB |
| TP-S05-001 | [08_testing/](08_testing/) | QA | Used (Executed — thay bởi TR-S05-002/003/004) |
| TR-S05-001 | [08_testing/](08_testing/) | QA | Used (baseline cũ — withdrawn) |
| REV-S05-001 | [09_review/](09_review/) | PM + Khách hàng | Used (CLOSED 2026-10-29) |
| ADR-S05-* | Chưa tạo | Architect | Reserved |

## 5. Việc chuyển tiếp từ Sprint 04

| Việc | Nguồn | Sprint 05 xử lý |
| :--- | :--- | :--- |
| 1 touch target 27px tại web 390px | [REV-S04-001 §4](../sprint_04_ui_ux_experience/09_review/01_REV-S04-001_sprint_04_review.md) | Sửa khi màn danh mục/UI được chạm tới (TASK-385) |
| Skeleton khi mạng chậm — kiểm tay | REV-S04-001 §4 | Áp dụng lại mẫu vùng-tải độc lập cho màn danh mục (TASK-385) |
| Review kỹ thuật độc lập SOL/DES + smoke K8s staging | Sprint 03/04 follow-up | Ngoài phạm vi Sprint 05 (theo dõi ở review) |

> Trạng thái sản phẩm lấy ở artifact gốc trong `07_items/` và review, không lấy từ bảng này khi chưa có bằng chứng.

## 6. Điểm đã phân vân / xử lý (cập nhật 2026-10-29)

| # | Điểm | Loại | Đề xuất / trạng thái |
| :--- | :--- | :--- | :--- |
| 1 | **Duyệt scope** (Q18) | Cổng — trước đây chặn code | ✅ **APPROVED 2026-10-06** — 22 AC + 19 task |
| 2 | **Design ready gate**: D1 in-process | Nội bộ | ✅ **RESOLVED 2026-10-27→29** — ADR-S05-001 + plugin độc lập; TR-S05-002 PASS |
| 3 | ~~**Giấy phép dữ liệu địa giới** (`provinces.open-api.vn`)~~ | Kỹ thuật/pháp lý | ✅ **Đã xử lý 2026-10-06**: tệp `provinces-communes.csv` sinh một lần (34 tỉnh / 3.321 xã-phường, dữ liệu sau sáp nhập 2025), header ghi **nguồn + ngày + số dòng**; runtime không gọi mạng; cập nhật bằng `node scripts/gen-admin-units.mjs` + kiểm tra `node scripts/check-admin-units.mjs` |
| 4 | **Extension PostgreSQL** `btree_gist`, `pg_trgm` có sẵn trên dev/staging/prod? | Kỹ thuật | ✅ **Dev đã kiểm chứng 2026-10-06**: `btree_gist` 1.7 + `pg_trgm` 1.6 cài đặt thành công trên `openerp-postgres-primary` (PostgreSQL 16, cả hai là trusted extension từ PG 13+); migration `CREATE EXTENSION IF NOT EXISTS` là no-op an toàn. Staging/prod chạy cùng migration |
| 5 | **Mobile**: màn tra cứu read-only | Scope nhỏ | ✅ Đã làm TASK-387 + TASK-403 (iframe read-only 390×844 PASS) |
| 6 | **`name_en`**: chỉ hiển thị ở form quản trị | Scope nhỏ | Mặc định như vậy; đa ngôn ngữ tên danh mục để sprint sau (Q9) |

**Ba điểm Architect đã tự chốt theo hướng an toàn hơn (ghi để review biết)**:
1. `allowed_parent_types` **NULL = chỉ cùng loại** (trước đó ghi "mọi loại" — nay đổi để tránh cấu trúc sai).
2. **Grant mặc định** cho `TENANT_OWNER`/`TENANT_ADMIN` trên mọi loại tenant (tránh "cài xong không ai sửa được").
3. **Tenant import trùng `code` với mục hệ thống ⇒ tạo bản ghi ghi đè của tenant** (nhất quán Q1/Q2), không sửa bản hệ thống.

**Cập nhật 2026-10-06 (lập trình)**: điểm 5 đã **chốt xây** (màn tra cứu Mobile read-only, TASK-387); điểm 6 giữ mặc định; điểm 2 (design review) đang xử lý bằng chính các lượt verify + ghi sai lệch ở DES-DB §6.1.

## 7. Tài liệu ngoài Sprint-Pack

| Tài liệu | Vị trí | Ghi chú |
| :--- | :--- | :--- |
| Hướng dẫn sử dụng | [UG-S05-001](../../06_user_guides/sprint_05_catalog_plugin_user_guide.md) | 13 mục; ảnh minh hoạ bổ sung sau QA (TASK-389) |
| Triển khai (Docker/K8s) | [docker_deployment_guide.md](../../07_deployment_guides/docker_deployment_guide.md) mục 5, [k8s_production_guide.md](../../07_deployment_guides/k8s_production_guide.md) | Extension `btree_gist`/`pg_trgm`, seed địa giới trong JAR, `OPENERP_CATALOG_IMPORT_MAX_ROWS` |
| Kỹ thuật tạo plugin | [create_new_plugin_guide.md](../../08_developer_guides/create_new_plugin_guide.md) | ⚠️ Mục 6 (CORE_IN_PROCESS) đang bị bác theo BUG-135; không dùng làm mẫu cho plugin nghiệp vụ. Chờ ADR-S05-001 |
