# [FEAT-40] Plugin Workflow engine — core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-40 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | In Progress / 0.3 / 2026-11-02 — backend hoàn tất: WorkflowEngineService (open idempotent, walk START/CONDITION/PARALLEL/CC/AUTO, 3 chế độ duyệt, RETURN/REASSIGN/CLAIM, chặn self-approval, SLA scan, event log + publish instance.completed), TriggerService, WorkflowInternalResource (events/instances/tasks/sla-scan/bootstrap seed `employee-profile-change`), WorkflowResource (definitions CRUD/publish, instances, inbox, actions); WC bundle build PASS; integration test gắn TR |
| Owner | Developer Agent |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) AC-W01…W15, [ADR-S08-001](../05_solutions/02_ADR-S08-001_workflow_engine_state_machine.md), [DES-DB-S08-001](../06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) §3, [DES-API-S08-001](../06_designs/api/01_DES-API-S08-001_form_workflow_api.md) §4–5, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §4 |
| Phụ thuộc | FEAT-41 (Event Hub internal endpoints, tenants internal API, SDK) |

## Phạm vi

Plugin Maven module `plugins/workflow` (`com.vn9melody.openerp.plugins.workflow`, id `workflow`, WC `op-workflow-app`): engine state machine thuần (node enum, condition DSL, parallel fork/join, 3 chế độ duyệt, 4 kiểu assignment + fallback, return/reassign, chặn self-approval), definition versioning, instance pin version, task inbox, SLA scheduler (Quarkus Scheduler, overdue không chặn duyệt), event log append-only, trigger qua Event Hub + manual + webhook inbound (secret/rotate/log), AUTO_WEBHOOK + AUTO_ENTITY_UPDATE, reports (trạng thái/quá hạn/hiệu suất).

## Checklist

- [x] Scaffold module + plugin.json 2.0 (event_subscriptions TODO khi Core parse mở rộng) + migration V1.0.0: 6 bảng `plg_workflow_*` — 2026-11-02
- [ ] Engine thuần: WorkflowEngine + ExpressionEvaluator (đã có, 6/6 test) + AssigneeResolver + ParallelJoinTracker + bộ transition test toàn diện (không DB)
- [ ] Backend services: DefinitionService (validate graph/chống vòng/publish), InstanceService (idempotent trigger), TaskService (inbox/claim/action), SlaScanJob (@Scheduled 60s multi-tenant idempotent), WebhookService, TriggerService
- [ ] Frontend WC: inbox (claim/action + drawer bối cảnh), flows + builder, runs timeline, reports, webhooks; user-menu contribution "Việc của tôi"; i18n 13 locale
- [ ] Internal API: instances/tasks cho plugin khác (employee); bootstrap seed `employee-profile-change`

## AC truy vết

AC-W01…AC-W12, AC-W14, AC-W15 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
