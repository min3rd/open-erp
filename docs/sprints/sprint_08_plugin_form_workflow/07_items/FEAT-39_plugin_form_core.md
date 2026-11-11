# [FEAT-39] Plugin Form builder — core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-39 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 1.0 / 2026-11-09 — Default plugin locked cho 100% tenant (V8.0.0 migration); Backend FormResponseService, FormPublicResource, FormFileService, CSV/summary; WC bundle build PASS với `@shared` ERP Workspace layout, 4 KPI cards, filter bar, 0 raw controls; i18n 13 locale |
| Owner | Developer Agent |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) AC-F01…F15, [DES-DB-S08-001](../06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) §2, [DES-API-S08-001](../06_designs/api/01_DES-API-S08-001_form_workflow_api.md) §2–3, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §2–3, [ADR-S08-003](../05_solutions/04_ADR-S08-003_public_form_access.md), [DES-ARCH-S08-001 §6](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) |
| Phụ thuộc | FEAT-41 (Event Hub, Entity Write Proxy, Public Session, SDK storage-support) |

## Phạm vi

Plugin Maven module `plugins/form` (`com.vn9melody.openerp.plugins.form`, id `form`, WC `op-form-app` + `op-form-fill`): builder, 12 loại câu hỏi + section, version semantics (DES-ARCH §6), skip logic, entity mapping, anonymous fill public, upload file + ClamAV + signed URL, quiz, response table/summary/CSV/notification, outbox event `form.response.submitted`.

## Checklist

- [x] Scaffold module + plugin.json 2.0 (entities, permissions, migrations, ui_manifest) + `pom.xml` trong `plugins/pom.xml` — 2026-11-02, `mvn -pl form -am test` PASS
- [x] Migration V1.0.0: 5 bảng `plg_form_*` theo DES-DB §2 — 2026-11-02
- [x] FormDocumentValidator thuần: ref unique/ref pattern, forward-only logic (2-pass), ref type immutable sau publish — 7/7 unit test PASS
- [x] Backend: FormResource + FormDefinitionService (validate document/logic/ref/type immutable, version snapshot) + FormResponseService (idempotent, entity write qua proxy, pin version) + FormFileService (SDK storage-support) + FormPublicResource (rate limit/captcha)
- [x] Frontend WC: builder (builder tab + panel + preview), forms list, responses + summary, fill public, i18n 13 locale; đại tu sang `@shared` ERP Workspace layout
- [x] Cấu hình default & locked plugin cho 100% tenant (V8.0.0 migration)
- [x] Nâng cấp trường Grid kiểu Excel: cấu hình kiểu cột, 3 nguồn dữ liệu Select & Cascading cha-con cô lập cấp dòng, công thức tính toán dòng và tổng kết cột ([TASK-445](TASK-445_form_excel_style_grid_field.md))
- [x] Mở rộng bộ 32 loại trường Form Builder qua 6 nhóm nghiệp vụ ERP chuẩn mực ([TASK-446](TASK-446_form_builder_comprehensive_field_palette.md))
- [x] Xây dựng bộ máy Undo/Redo Engine 50 bước, phím tắt Ctrl+Z/Ctrl+Y, section tabs 1 hàng scroll ngang ([TASK-447](TASK-447_form_builder_undo_redo_engine.md))
- [x] Test: validator thuần + integration PostgreSQL thật + E2E submit → event

## AC truy vết

AC-F01…AC-F15 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
