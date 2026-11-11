# [FEAT-40] Plugin Workflow engine — core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-40 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 1.0 / 2026-11-09 — Default plugin locked cho 100% tenant (V8.0.0 migration); Backend WorkflowEngineService, TriggerService, WorkflowInternalResource, WorkflowResource; WC bundle build PASS với `@shared` ERP Workspace layout, 4 KPI cards, filter bar, user-menu contribution; i18n 13 locale |
| Owner | Developer Agent |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) AC-W01…W15, [ADR-S08-001](../05_solutions/02_ADR-S08-001_workflow_engine_state_machine.md), [DES-DB-S08-001](../06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) §3, [DES-API-S08-001](../06_designs/api/01_DES-API-S08-001_form_workflow_api.md) §4–5, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §4 |
| Phụ thuộc | FEAT-41 (Event Hub internal endpoints, tenants internal API, SDK) |

## Phạm vi

Plugin Maven module `plugins/workflow` (`com.vn9melody.openerp.plugins.workflow`, id `workflow`, WC `op-workflow-app`): engine state machine thuần (node enum, condition DSL, parallel fork/join, 3 chế độ duyệt, 4 kiểu assignment + fallback, return/reassign, chặn self-approval), definition versioning, instance pin version, task inbox, SLA scheduler (Quarkus Scheduler, overdue không chặn duyệt), event log append-only, trigger qua Event Hub + manual + webhook inbound (secret/rotate/log), AUTO_WEBHOOK + AUTO_ENTITY_UPDATE, reports (trạng thái/quá hạn/hiệu suất).

## Checklist

- [x] Scaffold module + plugin.json 2.0 (event_subscriptions TODO khi Core parse mở rộng) + migration V1.0.0: 6 bảng `plg_workflow_*` — 2026-11-02
- [x] Engine thuần: WorkflowEngine + ExpressionEvaluator (đã có, 6/6 test) + AssigneeResolver + ParallelJoinTracker + bộ transition test toàn diện (không DB)
- [x] Backend services: DefinitionService (validate graph/chống vòng/publish), InstanceService (idempotent trigger), TaskService (inbox/claim/action), SlaScanJob (@Scheduled 60s multi-tenant idempotent), WebhookService, TriggerService
- [x] Frontend WC: inbox (claim/action + drawer bối cảnh), flows + builder, runs timeline, reports, webhooks; user-menu contribution "Việc của tôi"; i18n 13 locale; đại tu sang `@shared` ERP Workspace layout
- [x] Undo / Redo Engine cho Workflow Designer Studio ([TASK-448](TASK-448_workflow_builder_undo_redo_engine.md)): 50-step snapshot stack, phím tắt `Ctrl+Z` / `Ctrl+Y`, toolbar buttons có tooltip và Feather icons
- [x] Internal API: instances/tasks cho plugin khác (employee); bootstrap seed `employee-profile-change`
- [x] Cấu hình default & locked plugin cho 100% tenant (V8.0.0 migration)

## AC truy vết

AC-W01…AC-W12, AC-W14, AC-W15 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
