# [FEAT-30] Plugin core "Danh mục & quản trị danh mục" (catalog)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-30 / Feature / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — 19/19 task code xong; QA: TR-S05-001 (18 PASS/4 PARTIAL/3 NOT RUN, TC-17 chờ QA lại 390px)** |
| Owner/agent / reviewer | Developer (agent) / Architect + QA |
| Cập nhật / input version | 2026-10-06 / [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) (Pending), [SOL-S05-001](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) |
| depends_on / blocks / parent | Sprint 03 (plugin manager), Sprint 01/02 (RBAC, tổ chức) / các plugin nghiệp vụ sau / — |
| Write scope / baseline | `modules/catalog/**`, `shared/components/catalog-picker/**`, `web/features/settings/catalog/**`, `mobile/pages/settings/catalog/**`, migration `V4.0.0` |

## 1. Mục tiêu

Hạ tầng **danh mục dùng chung** cho mọi plugin nghiệp vụ: phân cấp nhiều cấp, **đa cha (DAG)**, **version + hiệu lực thời gian**, quản trị CRUD + phân quyền hai tầng, API lookup cho form động, danh mục cố định cho doanh nghiệp; plugin **luôn bật** cho mọi tenant.

Nguồn: [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) (R1–R8).

## 2. Phạm vi

**Trong**: 4 bảng CSDL (loại/bản ghi/cạnh/grant) + ràng buộc EXCLUDE; truy vấn DAG (recursive CTE); version + as-of; CRUD + quyền 2 tầng; API lookup (types/options/resolve/path/inline); **import/export CSV** (Q7); **ghi đè/ẩn danh mục hệ thống theo tenant** (Q1/Q2); seed **13 danh mục cố định** (gồm Phòng ban là danh mục riêng — Q3); component `catalog-picker` dùng chung; màn quản trị Desktop; tra cứu Mobile; đăng ký plugin core + backfill tenant.

**Ngoài (v1)**: quy trình duyệt (Q8), đồng bộ địa giới bên ngoài, bitemporal đầy đủ, đa ngôn ngữ tên danh mục (Q9), phân quyền dữ liệu theo chi nhánh/phòng ban (Q17) — xem CONF §1.

## 3. Task con

| Task | Nội dung | Mức | depends_on |
| :--- | :--- | :--- | :--- |
| [TASK-375](TASK-375_migration_v4_catalog_schema.md) | Migration V4.0.0 + seed plugin core + backfill | High | — |
| [TASK-376](TASK-376_plugin_registration_entity_registry.md) | Khai báo plugin core + Entity Registry + ma trận nền tảng | High | TASK-375 |
| [TASK-377](TASK-377_catalog_repository_recursive_queries.md) | Repository + truy vấn đệ quy (DAG, chu trình, options) | High | TASK-375 |
| [TASK-378](TASK-378_catalog_type_service_and_grants.md) | CRUD loại + quản trị quyền theo loại | High | TASK-377 |
| [TASK-379](TASK-379_catalog_item_service_versioning.md) | CRUD bản ghi + version + hiệu lực | High | TASK-377 |
| [TASK-380](TASK-380_catalog_edge_service_dag.md) | Quan hệ đa cha (DAG) + chống chu trình | High | TASK-377 |
| [TASK-381](TASK-381_catalog_lookup_api_for_dynamic_forms.md) | API lookup cho form động | High | TASK-379, TASK-380 |
| [TASK-382](TASK-382_catalog_two_tier_permissions.md) | Phân quyền hai tầng | High | TASK-378 |
| [TASK-383](TASK-383_catalog_seed_and_department_bridge.md) | Seed danh mục cố định + cầu nối phòng ban | High | TASK-379 |
| [TASK-384](TASK-384_catalog_backend_tests.md) | Test backend trên PostgreSQL thật | High | TASK-378…382 |
| [TASK-385](TASK-385_catalog_admin_ui.md) | Màn quản trị danh mục (Web) | High | TASK-381 |
| [TASK-386](TASK-386_shared_catalog_picker_component.md) | Component `catalog-picker` dùng chung | High | TASK-381 |
| [TASK-387](TASK-387_catalog_picker_integration_and_mobile_browse.md) | Tích hợp picker + tra cứu Mobile | Medium | TASK-386 |
| [TASK-388](TASK-388_catalog_i18n_and_docs.md) | i18n 13 locale + User/Developer Guide | Medium | TASK-385, TASK-386 |
| [TASK-389](TASK-389_catalog_qa_browser.md) | QA browser Desktop + Mobile | High | TASK-385…387 |
| [TASK-390](TASK-390_catalog_import_export_csv.md) | Import/Export CSV + `.xlsx` danh mục (khách chốt Q7/N3) | High | TASK-381 |
| [TASK-391](TASK-391_catalog_tenant_override_system_items.md) | Ghi đè/ẩn danh mục hệ thống theo tenant (khách chốt Q1/Q2) | High | TASK-379, TASK-381 |
| [TASK-392](TASK-392_platform_system_catalog_admin.md) | Màn quản trị danh mục hệ thống (cổng Platform — N5) | High | TASK-385, TASK-390 |
| [TASK-393](TASK-393_seed_admin_units_two_levels.md) | Seed dữ liệu địa giới thật 2 cấp tỉnh→xã (N2) | High | TASK-375, TASK-377 |

## 4. Tiêu chí hoàn thành

- **22 AC** của [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) §2 được kiểm chứng (backend test + QA browser).
- Plugin `catalog` **ACTIVE** cho mọi tenant (mới + backfill), không gỡ được; entity đã đăng ký Registry.
- Build web + mobile PASS; i18n 13/13 100%; 0 console error; overflow 0 ở 390px.
- User Guide + Developer Guide cập nhật; TR-S05-001 có baseline/evidence.

## 5. Rủi ro

| Rủi ro | Mức | Nguồn |
| :--- | :--- | :--- |
| DAG + version sai logic | High | [SOL-S05-001](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) §6 |
| Trùng nguồn sự thật "Phòng ban" | High | CONF Q3 |
| Phạm vi phình (import/approval/đa ngôn ngữ) | Medium | CONF §1 |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Tạo feature + 15 task con (chưa triển khai) | Developer Agent; chờ gate scope |
| 0.2 | 2026-10-06 | Gate APPROVED; mở rộng lên **19 task con** (392 màn hệ thống, 393 seed địa giới) | Developer Agent; chỉ đạo chủ dự án |
| 0.4 | 2026-10-06 | **QA**: TR-S05-001 (18 PASS/4 PARTIAL/3 NOT RUN) + 10 ảnh minh chứng; phát hiện & sửa 5 lỗi (`d507e07`, `050a3bc`) gồm 1 lỗi Critical (Mobile thiếu auth interceptor) | QA Agent; nguồn: chạy thật trên dev |
| 0.3 | 2026-10-06 | **Triển khai**: migration V4.0.0 apply sạch (60/60 tenant backfill, 600 grant), 4 entity vào registry, recursive CTE + options gộp tenant thắng, seeder địa giới (34 tỉnh/3.321 xã), `catalog-picker` dùng chung — 49 test + build web/mobile PASS; đang làm API + UI | Developer Agent; nguồn: test + build log |
