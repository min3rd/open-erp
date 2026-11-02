# [FEAT-39] Plugin Form builder — core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-39 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | In Progress / 0.3 / 2026-11-02 — backend hoàn tất: FormResponseService (idempotent + pin version + entity mapping qua proxy + event publish), FormPublicResource (view/submit/upload/signed download), FormFileService (ClamAV + HMAC), CSV/summary; WC bundle `op-form-app` + `op-form-fill` build PASS; integration test gắn TR |
| Owner | Developer Agent |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) AC-F01…F15, [DES-DB-S08-001](../06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) §2, [DES-API-S08-001](../06_designs/api/01_DES-API-S08-001_form_workflow_api.md) §2–3, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §2–3, [ADR-S08-003](../05_solutions/04_ADR-S08-003_public_form_access.md), [DES-ARCH-S08-001 §6](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) |
| Phụ thuộc | FEAT-41 (Event Hub, Entity Write Proxy, Public Session, SDK storage-support) |

## Phạm vi

Plugin Maven module `plugins/form` (`com.vn9melody.openerp.plugins.form`, id `form`, WC `op-form-app` + `op-form-fill`): builder, 12 loại câu hỏi + section, version semantics (DES-ARCH §6), skip logic, entity mapping, anonymous fill public, upload file + ClamAV + signed URL, quiz, response table/summary/CSV/notification, outbox event `form.response.submitted`.

## Checklist

- [x] Scaffold module + plugin.json 2.0 (entities, permissions, migrations, ui_manifest) + `pom.xml` trong `plugins/pom.xml` — 2026-11-02, `mvn -pl form -am test` PASS
- [x] Migration V1.0.0: 5 bảng `plg_form_*` theo DES-DB §2 — 2026-11-02
- [x] FormDocumentValidator thuần: ref unique/ref pattern, forward-only logic (2-pass), ref type immutable sau publish — 7/7 unit test PASS
- [ ] Backend: FormResource + FormDefinitionService (validate document/logic/ref/type immutable, version snapshot) + FormResponseService (idempotent, entity write qua proxy, pin version) + FormFileService (SDK storage-support) + FormPublicResource (rate limit/captcha)
- [ ] Frontend WC: builder (builder tab + panel + preview), forms list, responses + summary, fill public, i18n 13 locale
- [ ] Test: validator thuần + integration PostgreSQL thật + E2E submit → event

## AC truy vết

AC-F01…AC-F15 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
