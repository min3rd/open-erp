-- =====================================================================
-- V8.0.0: Sprint 08 - Form Builder & Workflow Engine as locked default plugins
-- 1. plugin_catalog entries for form & workflow (default_install=TRUE, locked=TRUE)
-- 2. plugin_versions entries (PUBLISHED) with full manifest & migration metadata
-- 3. permissions & role_permissions seed for system roles
-- 4. Per-tenant schema bootstrap (tenant_<id8>_form & tenant_<id8>_workflow)
--    and tenant_plugins / tenants.allowed_plugins backfill for existing tenants
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Plugin catalog: form and workflow as locked default plugins
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES
    ('form', 'PLUGIN_FORM_TITLE', 'PLUGIN_FORM_SUBTITLE', 'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE'),
    ('workflow', 'PLUGIN_WORKFLOW_TITLE', 'PLUGIN_WORKFLOW_SUBTITLE', 'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
    SET name_key = EXCLUDED.name_key,
        description_key = EXCLUDED.description_key,
        visibility = 'PLATFORM',
        default_install = TRUE,
        locked = TRUE,
        is_core = FALSE,
        catalog_status = 'ACTIVE',
        updated_at = now();

-- ---------------------------------------------------------------------
-- 2. Plugin versions: published entries with full manifest
-- ---------------------------------------------------------------------
INSERT INTO plugin_versions (
    catalog_id, version, release_status, core_compatibility, dependencies,
    platforms, permissions, entities, ui_manifest, distribution, manifest,
    migration_policy, rollback_strategy, template_version, created_at,
    published_at, publish_reason
)
SELECT c.id, '1.0.8', 'PUBLISHED', '>=1.0.0 <2.0.0', '[]'::jsonb,
       '{"desktop":{"supported":true,"features":["form:definition:manage","form:response:read","form:response:export"]},"mobile":{"supported":true,"features":["form:public:fill"]}}'::jsonb,
       '[{"code":"form:definition:manage","name":"Form definition manage"},{"code":"form:response:read","name":"Form response read"},{"code":"form:response:export","name":"Form response export"}]'::jsonb,
       '[{"name":"FormDefinition","table":"plg_form_definitions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"slug","type":"string","required":true,"max_length":64},{"name":"title_text","type":"string","required":true,"max_length":300},{"name":"description","type":"text","required":false},{"name":"document","type":"json","required":true},{"name":"entity_mapping","type":"json","required":false},{"name":"publish_status","type":"enum","enum_values":["DRAFT","PUBLISHED","CLOSED"],"default":"DRAFT"},{"name":"captcha","type":"enum","enum_values":["none","recaptcha-v3"],"default":"none"},{"name":"close_at","type":"datetime","required":false},{"name":"response_limit","type":"int","required":false},{"name":"accept_responses","type":"bool","required":true,"default":true},{"name":"latest_version","type":"int","required":true,"default":1},{"name":"created_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"updated_at","type":"datetime","required":false}],"validators":[{"field":"slug","rule":"max_length","value":64},{"field":"publish_status","rule":"enum","value":["DRAFT","PUBLISHED","CLOSED"]}]},{"name":"FormDefinitionVersion","table":"plg_form_definitions_versions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"version","type":"int","required":true},{"name":"document","type":"json","required":true},{"name":"entity_mapping","type":"json","required":false},{"name":"created_at","type":"datetime","required":false}]},{"name":"FormResponse","table":"plg_form_responses","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"form_id","type":"uuid","required":true},{"name":"form_version","type":"int","required":true},{"name":"answers","type":"json","required":true},{"name":"responder_email","type":"string","required":false,"max_length":320},{"name":"submitted_by_user_id","type":"uuid","required":false},{"name":"entity_write_status","type":"enum","enum_values":["SKIPPED","OK","FAILED"],"default":"SKIPPED"},{"name":"entity_write_error","type":"text","required":false},{"name":"workflow_instance_id","type":"uuid","required":false},{"name":"ip_hash","type":"string","required":false,"max_length":64},{"name":"idempotency_key","type":"string","required":true,"max_length":80},{"name":"status","type":"enum","enum_values":["SUBMITTED"],"default":"SUBMITTED"},{"name":"submitted_at","type":"datetime","required":false}],"validators":[{"field":"entity_write_status","rule":"enum","value":["SKIPPED","OK","FAILED"]}]},{"name":"FormFile","table":"plg_form_files","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"form_id","type":"uuid","required":true},{"name":"response_id","type":"uuid","required":false},{"name":"storage_key","type":"string","required":true,"max_length":400},{"name":"original_name","type":"string","required":true,"max_length":255},{"name":"content_type","type":"string","required":false,"max_length":120},{"name":"size_bytes","type":"int","required":false},{"name":"scan_status","type":"enum","enum_values":["PENDING","CLEAN","INFECTED","ERROR"],"default":"PENDING"},{"name":"scan_error","type":"text","required":false},{"name":"created_at","type":"datetime","required":false}],"validators":[{"field":"scan_status","rule":"enum","value":["PENDING","CLEAN","INFECTED","ERROR"]}]}]'::jsonb,
       '{"contract_version":"1.0","screens":[{"route":"/apps/form","title_key":"PLUGIN_FORM_TITLE","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/form/main.js","tag_name":"op-form-app","order":130,"platforms":["desktop"]}],"contributions":[],"slots":[],"crud":[]}'::jsonb,
       '{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/form","tag":"1.0.0"}'::jsonb,
       '{"schema_version":"2.0","id":"form","name":"Form Builder","description":"Thiết kế biểu mẫu kiểu Google Forms: sections, nhiều loại câu hỏi, skip logic, link public, thu và quản lý response, map vào entity.","version":"1.0.8","template_version":"2.0.0","author":"Open-ERP Plugin Team","core_version_compatibility":">=1.0.0 <2.0.0","migration_policy":"COMPATIBLE","rollback_strategy":"SNAPSHOT_RESTORE","dependencies":[],"public_access":true,"event_publications":[{"event":"form.response.submitted","entity":"FormResponse"}],"platforms":{"desktop":{"supported":true,"features":["form:definition:manage","form:response:read","form:response:export"]},"mobile":{"supported":true,"features":["form:public:fill"]}},"permissions":[{"code":"form:definition:manage","name":"Form definition manage"},{"code":"form:response:read","name":"Form response read"},{"code":"form:response:export","name":"Form response export"}],"entities":[{"name":"FormDefinition","table":"plg_form_definitions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"slug","type":"string","required":true,"max_length":64},{"name":"title_text","type":"string","required":true,"max_length":300},{"name":"description","type":"text","required":false},{"name":"document","type":"json","required":true},{"name":"entity_mapping","type":"json","required":false},{"name":"publish_status","type":"enum","enum_values":["DRAFT","PUBLISHED","CLOSED"],"default":"DRAFT"},{"name":"captcha","type":"enum","enum_values":["none","recaptcha-v3"],"default":"none"},{"name":"close_at","type":"datetime","required":false},{"name":"response_limit","type":"int","required":false},{"name":"accept_responses","type":"bool","required":true,"default":true},{"name":"latest_version","type":"int","required":true,"default":1},{"name":"created_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"updated_at","type":"datetime","required":false}],"validators":[{"field":"slug","rule":"max_length","value":64},{"field":"publish_status","rule":"enum","value":["DRAFT","PUBLISHED","CLOSED"]}]},{"name":"FormDefinitionVersion","table":"plg_form_definitions_versions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"version","type":"int","required":true},{"name":"document","type":"json","required":true},{"name":"entity_mapping","type":"json","required":false},{"name":"created_at","type":"datetime","required":false}]},{"name":"FormResponse","table":"plg_form_responses","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"form_id","type":"uuid","required":true},{"name":"form_version","type":"int","required":true},{"name":"answers","type":"json","required":true},{"name":"responder_email","type":"string","required":false,"max_length":320},{"name":"submitted_by_user_id","type":"uuid","required":false},{"name":"entity_write_status","type":"enum","enum_values":["SKIPPED","OK","FAILED"],"default":"SKIPPED"},{"name":"entity_write_error","type":"text","required":false},{"name":"workflow_instance_id","type":"uuid","required":false},{"name":"ip_hash","type":"string","required":false,"max_length":64},{"name":"idempotency_key","type":"string","required":true,"max_length":80},{"name":"status","type":"enum","enum_values":["SUBMITTED"],"default":"SUBMITTED"},{"name":"submitted_at","type":"datetime","required":false}],"validators":[{"field":"entity_write_status","rule":"enum","value":["SKIPPED","OK","FAILED"]}]},{"name":"FormFile","table":"plg_form_files","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"form_id","type":"uuid","required":true},{"name":"response_id","type":"uuid","required":false},{"name":"storage_key","type":"string","required":true,"max_length":400},{"name":"original_name","type":"string","required":true,"max_length":255},{"name":"content_type","type":"string","required":false,"max_length":120},{"name":"size_bytes","type":"int","required":false},{"name":"scan_status","type":"enum","enum_values":["PENDING","CLEAN","INFECTED","ERROR"],"default":"PENDING"},{"name":"scan_error","type":"text","required":false},{"name":"created_at","type":"datetime","required":false}],"validators":[{"field":"scan_status","rule":"enum","value":["PENDING","CLEAN","INFECTED","ERROR"]}]}],"relations":[{"name":"author","owner_entity":"FormDefinition","type":"MANY_TO_ONE","target":"core.user","storage":"SOFT_REF","target_display_field":"full_name","required":false,"on_delete":"SET_NULL"}],"queries":[{"id":"form.list","mode":"READ","operation":"LIST","entity":"FormDefinition","tenant_scope":"TENANT","select":["id","slug","title_text","description","publish_status","captcha","close_at","response_limit","accept_responses","latest_version","created_by","created_at","updated_at"],"sort":[{"field":"updated_at","direction":"DESC"}],"maxRows":100},{"id":"form.get","mode":"READ","operation":"LIST","entity":"FormDefinition","tenant_scope":"TENANT","select":["id","slug","title_text","description","document","entity_mapping","publish_status","captcha","close_at","response_limit","accept_responses","latest_version","created_by","created_at","updated_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1},{"id":"form.get_by_slug","mode":"READ","operation":"LIST","entity":"FormDefinition","tenant_scope":"TENANT","select":["id","slug","title_text","description","document","entity_mapping","publish_status","captcha","close_at","response_limit","accept_responses","latest_version"],"filters":[{"field":"slug","op":"EQ","param":"slug","required":true}],"maxRows":1},{"id":"form.insert","mode":"WRITE","operation":"INSERT","entity":"FormDefinition","tenant_scope":"TENANT","values":{"slug":{"param":"slug"},"title_text":{"param":"title_text"},"description":{"param":"description","optional":true,"allow_null":true},"document":{"param":"document","type":"jsonb"},"entity_mapping":{"param":"entity_mapping","optional":true,"allow_null":true,"type":"jsonb"},"publish_status":{"param":"publish_status","optional":true},"latest_version":{"param":"latest_version","optional":true},"created_by":{"param":"created_by","optional":true,"allow_null":true},"updated_at":{"param":"updated_at"}},"returning":["id","slug","title_text","publish_status","latest_version","created_at"]},{"id":"form.update","mode":"WRITE","operation":"UPDATE","entity":"FormDefinition","tenant_scope":"TENANT","values":{"title_text":{"param":"title_text"},"description":{"param":"description","optional":true,"allow_null":true},"document":{"param":"document","type":"jsonb"},"entity_mapping":{"param":"entity_mapping","optional":true,"allow_null":true,"type":"jsonb"},"latest_version":{"param":"latest_version"},"updated_at":{"param":"updated_at"}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","slug","latest_version","updated_at"]},{"id":"form.publish","mode":"WRITE","operation":"UPDATE","entity":"FormDefinition","tenant_scope":"TENANT","values":{"publish_status":{"param":"publish_status"},"captcha":{"param":"captcha","optional":true},"close_at":{"param":"close_at","optional":true,"allow_null":true},"response_limit":{"param":"response_limit","optional":true,"allow_null":true},"accept_responses":{"param":"accept_responses","optional":true},"updated_at":{"param":"updated_at"}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","slug","publish_status","captcha","close_at","response_limit","accept_responses"]},{"id":"form.version.insert","mode":"WRITE","operation":"INSERT","entity":"FormDefinitionVersion","tenant_scope":"TENANT","values":{"definition_id":{"param":"definition_id"},"version":{"param":"version"},"document":{"param":"document","type":"jsonb"},"entity_mapping":{"param":"entity_mapping","optional":true,"allow_null":true,"type":"jsonb"}},"returning":["id","definition_id","version","created_at"]},{"id":"form.version.list","mode":"READ","operation":"LIST","entity":"FormDefinitionVersion","tenant_scope":"TENANT","select":["id","definition_id","version","document","entity_mapping","created_at"],"filters":[{"field":"definition_id","op":"EQ","param":"definition_id","required":true}],"sort":[{"field":"version","direction":"DESC"}],"maxRows":200},{"id":"form.response.insert","mode":"WRITE","operation":"INSERT","entity":"FormResponse","tenant_scope":"TENANT","values":{"form_id":{"param":"form_id"},"form_version":{"param":"form_version"},"answers":{"param":"answers","type":"jsonb"},"responder_email":{"param":"responder_email","optional":true,"allow_null":true},"submitted_by_user_id":{"param":"submitted_by_user_id","optional":true,"allow_null":true},"entity_write_status":{"param":"entity_write_status","optional":true},"entity_write_error":{"param":"entity_write_error","optional":true,"allow_null":true},"ip_hash":{"param":"ip_hash","optional":true,"allow_null":true},"idempotency_key":{"param":"idempotency_key"}},"returning":["id","form_id","form_version","entity_write_status","submitted_at"]},{"id":"form.response.list","mode":"READ","operation":"LIST","entity":"FormResponse","tenant_scope":"TENANT","select":["id","form_id","form_version","answers","responder_email","submitted_by_user_id","entity_write_status","submitted_at"],"filters":[{"field":"form_id","op":"EQ","param":"form_id","required":true}],"sort":[{"field":"submitted_at","direction":"DESC"}],"maxRows":200},{"id":"form.response.get","mode":"READ","operation":"LIST","entity":"FormResponse","tenant_scope":"TENANT","select":["id","form_id","form_version","answers","responder_email","submitted_by_user_id","entity_write_status","entity_write_error","submitted_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1},{"id":"form.response.by_key","mode":"READ","operation":"LIST","entity":"FormResponse","tenant_scope":"TENANT","select":["id","form_id","form_version","answers","responder_email","entity_write_status","submitted_at"],"filters":[{"field":"idempotency_key","op":"EQ","param":"idempotency_key","required":true}],"maxRows":1},{"id":"form.response.count","mode":"READ","operation":"LIST","entity":"FormResponse","tenant_scope":"TENANT","select":["id"],"filters":[{"field":"form_id","op":"EQ","param":"form_id","required":true}],"maxRows":1000},{"id":"form.file.insert","mode":"WRITE","operation":"INSERT","entity":"FormFile","tenant_scope":"TENANT","values":{"form_id":{"param":"form_id"},"response_id":{"param":"response_id","optional":true,"allow_null":true},"storage_key":{"param":"storage_key"},"original_name":{"param":"original_name"},"content_type":{"param":"content_type","optional":true,"allow_null":true},"size_bytes":{"param":"size_bytes","optional":true,"allow_null":true},"scan_status":{"param":"scan_status","optional":true}},"returning":["id","form_id","storage_key","scan_status","created_at"]},{"id":"form.file.get","mode":"READ","operation":"LIST","entity":"FormFile","tenant_scope":"TENANT","select":["id","form_id","response_id","storage_key","original_name","content_type","size_bytes","scan_status","created_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1}],"migrations":[{"version":"1.0.0","file":"V1.0.0__form_schema.sql","checksum":"sha256:660959d230db627c76bdd5a6783fc189cc943b817fccfb8951f6c14ff3d469fe","description":"form builder schema"}],"kafka_events":{"publishes":[],"subscribes":[]},"websockets":[],"ui_manifest":{"contract_version":"1.0","screens":[{"route":"/apps/form","title_key":"PLUGIN_FORM_TITLE","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/form/main.js","tag_name":"op-form-app","order":130,"platforms":["desktop"]}],"contributions":[],"slots":[],"crud":[]},"distribution":{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/form","tag":"1.0.0"}}'::jsonb,
       'COMPATIBLE', 'SNAPSHOT_RESTORE', '2.0.0', now(), now(),
       'Sprint 08 default form plugin'
FROM plugin_catalog c
WHERE c.plugin_key = 'form'
ON CONFLICT (catalog_id, version) DO UPDATE
    SET release_status = 'PUBLISHED',
        platforms = EXCLUDED.platforms,
        permissions = EXCLUDED.permissions,
        entities = EXCLUDED.entities,
        ui_manifest = EXCLUDED.ui_manifest,
        distribution = EXCLUDED.distribution,
        manifest = EXCLUDED.manifest,
        published_at = now(),
        publish_reason = 'Sprint 08 default form plugin';

INSERT INTO plugin_versions (
    catalog_id, version, release_status, core_compatibility, dependencies,
    platforms, permissions, entities, ui_manifest, distribution, manifest,
    migration_policy, rollback_strategy, template_version, created_at,
    published_at, publish_reason
)
SELECT c.id, '1.0.13', 'PUBLISHED', '>=1.0.0 <2.0.0', '[]'::jsonb,
       '{"desktop":{"supported":true,"features":["workflow:definition:manage","workflow:instance:read","workflow:task:action","workflow:report:read"]},"mobile":{"supported":true,"features":["workflow:task:action","workflow:instance:read"]}}'::jsonb,
       '[{"code":"workflow:definition:manage","name":"Workflow definition manage"},{"code":"workflow:instance:read","name":"Workflow instance read"},{"code":"workflow:task:action","name":"Workflow task action"},{"code":"workflow:report:read","name":"Workflow report read"}]'::jsonb,
       '[{"name":"WorkflowDefinition","table":"plg_workflow_definitions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"key","type":"string","required":true,"max_length":80},{"name":"version","type":"int","required":true},{"name":"status","type":"enum","enum_values":["DRAFT","PUBLISHED","ARCHIVED"],"default":"DRAFT"},{"name":"document","type":"json","required":true},{"name":"created_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"published_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["DRAFT","PUBLISHED","ARCHIVED"]}]},{"name":"WorkflowInstance","table":"plg_workflow_instances","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"definition_version","type":"int","required":true},{"name":"status","type":"enum","enum_values":["RUNNING","COMPLETED","CANCELLED"],"default":"RUNNING"},{"name":"outcome","type":"enum","enum_values":["APPROVED","REJECTED","CANCELLED"],"required":false},{"name":"trigger_type","type":"enum","enum_values":["MANUAL","API","EVENT","WEBHOOK","BOOTSTRAP"],"required":true},{"name":"source_ref","type":"json","required":false},{"name":"context","type":"json","required":false},{"name":"idempotency_key","type":"string","required":true,"max_length":120},{"name":"initiated_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"completed_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["RUNNING","COMPLETED","CANCELLED"]},{"field":"trigger_type","rule":"enum","value":["MANUAL","API","EVENT","WEBHOOK","BOOTSTRAP"]}]},{"name":"WorkflowTask","table":"plg_workflow_tasks","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"instance_id","type":"uuid","required":true},{"name":"node_id","type":"string","required":true,"max_length":80},{"name":"node_type","type":"enum","enum_values":["APPROVAL","TASK"],"required":true},{"name":"status","type":"enum","enum_values":["PENDING","IN_PROGRESS","COMPLETED","RETURNED","SKIPPED","CANCELLED"],"default":"PENDING"},{"name":"approval_mode","type":"enum","enum_values":["ANY_ONE","ALL_APPROVE","VOTE_RATIO"],"default":"ANY_ONE"},{"name":"vote_ratio","type":"int","required":false},{"name":"assignees","type":"json","required":true},{"name":"candidates","type":"json","required":true},{"name":"claimed_by","type":"uuid","required":false},{"name":"action_votes","type":"json","required":true},{"name":"due_at","type":"datetime","required":false},{"name":"remind_before_hours","type":"int","required":false},{"name":"reminder_slots","type":"json","required":true},{"name":"overdue_at","type":"datetime","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"completed_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["PENDING","IN_PROGRESS","COMPLETED","RETURNED","SKIPPED","CANCELLED"]},{"field":"approval_mode","rule":"enum","value":["ANY_ONE","ALL_APPROVE","VOTE_RATIO"]}]},{"name":"WorkflowEvent","table":"plg_workflow_events","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"instance_id","type":"uuid","required":true},{"name":"task_id","type":"uuid","required":false},{"name":"event","type":"string","required":true,"max_length":32},{"name":"actor_user_id","type":"uuid","required":false},{"name":"payload","type":"json","required":false},{"name":"created_at","type":"datetime","required":false}]},{"name":"WorkflowTrigger","table":"plg_workflow_triggers","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"source_plugin","type":"string","required":true,"max_length":40},{"name":"entity","type":"string","required":true,"max_length":80},{"name":"event_type","type":"string","required":true,"max_length":40},{"name":"filter","type":"json","required":false},{"name":"enabled","type":"bool","required":true,"default":true},{"name":"created_at","type":"datetime","required":false}]},{"name":"WorkflowWebhookEndpoint","table":"plg_workflow_webhook_endpoints","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"name","type":"string","required":true,"max_length":120},{"name":"path_token","type":"string","required":true,"max_length":48},{"name":"secret_hash","type":"string","required":true,"max_length":128},{"name":"enabled","type":"bool","required":true,"default":true},{"name":"created_at","type":"datetime","required":false},{"name":"rotated_at","type":"datetime","required":false}]}]'::jsonb,
       '{"contract_version":"1.0","screens":[{"route":"/apps/workflow","title_key":"PLUGIN_WORKFLOW_TITLE","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/workflow/main.js","tag_name":"op-workflow-app","order":131,"platforms":["desktop","mobile"]}],"contributions":[{"id":"workflow-my-tasks-item","slot":"core.layout.user-menu.items","title_key":"PLUGIN_WORKFLOW_MY_TASKS","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/workflow/main.js","tag_name":"op-workflow-menu-item","permission":"workflow:task:action","order":20,"contract_version":"1.0","platforms":["desktop","mobile"],"isolation":"light","icon":"bell"}],"slots":[],"crud":[]}'::jsonb,
       '{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/workflow","tag":"1.0.0"}'::jsonb,
       '{"schema_version":"2.0","id":"workflow","name":"Workflow Engine","description":"Tạo và xử lý công việc theo luồng: định nghĩa versioned, điều kiện rẽ nhánh, bước song song, phê duyệt nhiều chế độ, task inbox, SLA, audit, webhook.","version":"1.0.13","template_version":"2.0.0","author":"Open-ERP Plugin Team","core_version_compatibility":">=1.0.0 <2.0.0","migration_policy":"COMPATIBLE","rollback_strategy":"SNAPSHOT_RESTORE","dependencies":[],"event_subscriptions":[{"source":"*","event":"*"}],"platforms":{"desktop":{"supported":true,"features":["workflow:definition:manage","workflow:instance:read","workflow:task:action","workflow:report:read"]},"mobile":{"supported":true,"features":["workflow:task:action","workflow:instance:read"]}},"permissions":[{"code":"workflow:definition:manage","name":"Workflow definition manage"},{"code":"workflow:instance:read","name":"Workflow instance read"},{"code":"workflow:task:action","name":"Workflow task action"},{"code":"workflow:report:read","name":"Workflow report read"}],"entities":[{"name":"WorkflowDefinition","table":"plg_workflow_definitions","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"key","type":"string","required":true,"max_length":80},{"name":"version","type":"int","required":true},{"name":"status","type":"enum","enum_values":["DRAFT","PUBLISHED","ARCHIVED"],"default":"DRAFT"},{"name":"document","type":"json","required":true},{"name":"created_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"published_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["DRAFT","PUBLISHED","ARCHIVED"]}]},{"name":"WorkflowInstance","table":"plg_workflow_instances","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"definition_version","type":"int","required":true},{"name":"status","type":"enum","enum_values":["RUNNING","COMPLETED","CANCELLED"],"default":"RUNNING"},{"name":"outcome","type":"enum","enum_values":["APPROVED","REJECTED","CANCELLED"],"required":false},{"name":"trigger_type","type":"enum","enum_values":["MANUAL","API","EVENT","WEBHOOK","BOOTSTRAP"],"required":true},{"name":"source_ref","type":"json","required":false},{"name":"context","type":"json","required":false},{"name":"idempotency_key","type":"string","required":true,"max_length":120},{"name":"initiated_by","type":"uuid","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"completed_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["RUNNING","COMPLETED","CANCELLED"]},{"field":"trigger_type","rule":"enum","value":["MANUAL","API","EVENT","WEBHOOK","BOOTSTRAP"]}]},{"name":"WorkflowTask","table":"plg_workflow_tasks","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"instance_id","type":"uuid","required":true},{"name":"node_id","type":"string","required":true,"max_length":80},{"name":"node_type","type":"enum","enum_values":["APPROVAL","TASK"],"required":true},{"name":"status","type":"enum","enum_values":["PENDING","IN_PROGRESS","COMPLETED","RETURNED","SKIPPED","CANCELLED"],"default":"PENDING"},{"name":"approval_mode","type":"enum","enum_values":["ANY_ONE","ALL_APPROVE","VOTE_RATIO"],"default":"ANY_ONE"},{"name":"vote_ratio","type":"int","required":false},{"name":"assignees","type":"json","required":true},{"name":"candidates","type":"json","required":true},{"name":"claimed_by","type":"uuid","required":false},{"name":"action_votes","type":"json","required":true},{"name":"due_at","type":"datetime","required":false},{"name":"remind_before_hours","type":"int","required":false},{"name":"reminder_slots","type":"json","required":true},{"name":"overdue_at","type":"datetime","required":false},{"name":"created_at","type":"datetime","required":false},{"name":"completed_at","type":"datetime","required":false}],"validators":[{"field":"status","rule":"enum","value":["PENDING","IN_PROGRESS","COMPLETED","RETURNED","SKIPPED","CANCELLED"]},{"field":"approval_mode","rule":"enum","value":["ANY_ONE","ALL_APPROVE","VOTE_RATIO"]}]},{"name":"WorkflowEvent","table":"plg_workflow_events","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"instance_id","type":"uuid","required":true},{"name":"task_id","type":"uuid","required":false},{"name":"event","type":"string","required":true,"max_length":32},{"name":"actor_user_id","type":"uuid","required":false},{"name":"payload","type":"json","required":false},{"name":"created_at","type":"datetime","required":false}]},{"name":"WorkflowTrigger","table":"plg_workflow_triggers","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"definition_id","type":"uuid","required":true},{"name":"source_plugin","type":"string","required":true,"max_length":40},{"name":"entity","type":"string","required":true,"max_length":80},{"name":"event_type","type":"string","required":true,"max_length":40},{"name":"filter","type":"json","required":false},{"name":"enabled","type":"bool","required":true,"default":true},{"name":"created_at","type":"datetime","required":false}]},{"name":"WorkflowWebhookEndpoint","table":"plg_workflow_webhook_endpoints","storage_scope":"TENANT","fields":[{"name":"tenant_id","type":"uuid","required":true},{"name":"name","type":"string","required":true,"max_length":120},{"name":"path_token","type":"string","required":true,"max_length":48},{"name":"secret_hash","type":"string","required":true,"max_length":128},{"name":"enabled","type":"bool","required":true,"default":true},{"name":"created_at","type":"datetime","required":false},{"name":"rotated_at","type":"datetime","required":false}]}],"relations":[{"name":"initiator","owner_entity":"WorkflowInstance","type":"MANY_TO_ONE","target":"core.user","storage":"SOFT_REF","target_display_field":"full_name","required":false,"on_delete":"SET_NULL"}],"queries":[{"id":"definition.list","mode":"READ","operation":"LIST","entity":"WorkflowDefinition","tenant_scope":"TENANT","select":["id","key","version","status","document","created_by","created_at","published_at"],"sort":[{"field":"created_at","direction":"DESC"}],"maxRows":100},{"id":"definition.get","mode":"READ","operation":"LIST","entity":"WorkflowDefinition","tenant_scope":"TENANT","select":["id","key","version","status","document","created_by","created_at","published_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1},{"id":"definition.latest","mode":"READ","operation":"LIST","entity":"WorkflowDefinition","tenant_scope":"TENANT","select":["id","key","version","status","document","created_at","published_at"],"filters":[{"field":"key","op":"EQ","param":"key","required":true},{"field":"status","op":"EQ","param":"status","required":true}],"sort":[{"field":"version","direction":"DESC"}],"maxRows":1},{"id":"definition.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowDefinition","tenant_scope":"TENANT","values":{"key":{"param":"key"},"version":{"param":"version"},"status":{"param":"status","optional":true},"document":{"param":"document","type":"jsonb"},"created_by":{"param":"created_by","optional":true,"allow_null":true}},"returning":["id","key","version","status","created_at"]},{"id":"definition.publish","mode":"WRITE","operation":"UPDATE","entity":"WorkflowDefinition","tenant_scope":"TENANT","values":{"status":{"param":"status"},"published_at":{"param":"published_at"}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","key","version","status","published_at"]},{"id":"instance.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowInstance","tenant_scope":"TENANT","values":{"definition_id":{"param":"definition_id"},"definition_version":{"param":"definition_version"},"trigger_type":{"param":"trigger_type"},"source_ref":{"param":"source_ref","optional":true,"allow_null":true,"type":"jsonb"},"context":{"param":"context","optional":true,"allow_null":true,"type":"jsonb"},"idempotency_key":{"param":"idempotency_key"},"initiated_by":{"param":"initiated_by","optional":true,"allow_null":true}},"returning":["id","definition_id","definition_version","status","created_at"]},{"id":"instance.get","mode":"READ","operation":"LIST","entity":"WorkflowInstance","tenant_scope":"TENANT","select":["id","definition_id","definition_version","status","outcome","trigger_type","source_ref","context","initiated_by","created_at","completed_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1},{"id":"instance.by_idem","mode":"READ","operation":"LIST","entity":"WorkflowInstance","tenant_scope":"TENANT","select":["id","definition_id","definition_version","status","outcome","trigger_type","source_ref","context","initiated_by","created_at","completed_at"],"filters":[{"field":"idempotency_key","op":"EQ","param":"idempotency_key","required":true}],"maxRows":1},{"id":"instance.list","mode":"READ","operation":"LIST","entity":"WorkflowInstance","tenant_scope":"TENANT","select":["id","definition_id","definition_version","status","outcome","trigger_type","source_ref","initiated_by","created_at","completed_at"],"sort":[{"field":"created_at","direction":"DESC"}],"maxRows":100},{"id":"instance.complete","mode":"WRITE","operation":"UPDATE","entity":"WorkflowInstance","tenant_scope":"TENANT","values":{"status":{"param":"status"},"outcome":{"param":"outcome"},"completed_at":{"param":"completed_at"}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","status","outcome","completed_at"]},{"id":"task.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowTask","tenant_scope":"TENANT","values":{"instance_id":{"param":"instance_id"},"node_id":{"param":"node_id"},"node_type":{"param":"node_type"},"approval_mode":{"param":"approval_mode","optional":true},"vote_ratio":{"param":"vote_ratio","optional":true,"allow_null":true},"assignees":{"param":"assignees","type":"jsonb"},"candidates":{"param":"candidates","type":"jsonb"},"due_at":{"param":"due_at","optional":true,"allow_null":true},"remind_before_hours":{"param":"remind_before_hours","optional":true,"allow_null":true}},"returning":["id","instance_id","node_id","status","approval_mode","due_at","created_at"]},{"id":"task.get","mode":"READ","operation":"LIST","entity":"WorkflowTask","tenant_scope":"TENANT","select":["id","instance_id","node_id","node_type","status","approval_mode","vote_ratio","assignees","candidates","claimed_by","action_votes","due_at","remind_before_hours","reminder_slots","overdue_at","created_at","completed_at"],"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"maxRows":1},{"id":"task.update","mode":"WRITE","operation":"UPDATE","entity":"WorkflowTask","tenant_scope":"TENANT","values":{"status":{"param":"status","optional":true},"claimed_by":{"param":"claimed_by","optional":true,"allow_null":true},"action_votes":{"param":"action_votes","optional":true,"type":"jsonb"},"assignees":{"param":"assignees","optional":true,"type":"jsonb"},"overdue_at":{"param":"overdue_at","optional":true,"allow_null":true},"reminder_slots":{"param":"reminder_slots","optional":true,"type":"jsonb"},"completed_at":{"param":"completed_at","optional":true,"allow_null":true}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","instance_id","node_id","status","claimed_by","completed_at"]},{"id":"task.inbox","mode":"READ","operation":"LIST","entity":"WorkflowTask","tenant_scope":"TENANT","select":["id","instance_id","node_id","node_type","status","approval_mode","assignees","candidates","claimed_by","due_at","overdue_at","created_at"],"filters":[{"field":"status","op":"IN","param":"statuses","required":true}],"sort":[{"field":"due_at","direction":"ASC"}],"maxRows":100},{"id":"task.list_by_instance","mode":"READ","operation":"LIST","entity":"WorkflowTask","tenant_scope":"TENANT","select":["id","instance_id","node_id","node_type","status","approval_mode","assignees","candidates","action_votes","due_at","overdue_at","created_at","completed_at"],"filters":[{"field":"instance_id","op":"EQ","param":"instance_id","required":true}],"sort":[{"field":"created_at","direction":"ASC"}],"maxRows":200},{"id":"event.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowEvent","tenant_scope":"TENANT","values":{"instance_id":{"param":"instance_id"},"task_id":{"param":"task_id","optional":true,"allow_null":true},"event":{"param":"event"},"actor_user_id":{"param":"actor_user_id","optional":true,"allow_null":true},"payload":{"param":"payload","optional":true,"allow_null":true,"type":"jsonb"}},"returning":["id","instance_id","event","created_at"]},{"id":"event.list_by_instance","mode":"READ","operation":"LIST","entity":"WorkflowEvent","tenant_scope":"TENANT","select":["id","instance_id","task_id","event","actor_user_id","payload","created_at"],"filters":[{"field":"instance_id","op":"EQ","param":"instance_id","required":true}],"sort":[{"field":"created_at","direction":"ASC"}],"maxRows":500},{"id":"trigger.list","mode":"READ","operation":"LIST","entity":"WorkflowTrigger","tenant_scope":"TENANT","select":["id","definition_id","source_plugin","entity","event_type","filter","enabled","created_at"],"filters":[{"field":"enabled","op":"EQ","param":"enabled","required":true}],"maxRows":200},{"id":"trigger.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowTrigger","tenant_scope":"TENANT","values":{"definition_id":{"param":"definition_id"},"source_plugin":{"param":"source_plugin"},"entity":{"param":"entity"},"event_type":{"param":"event_type"},"filter":{"param":"filter","optional":true,"allow_null":true,"type":"jsonb"},"enabled":{"param":"enabled","optional":true}},"returning":["id","definition_id","source_plugin","entity","event_type","created_at"]},{"id":"trigger.delete","mode":"WRITE","operation":"DELETE","entity":"WorkflowTrigger","tenant_scope":"TENANT","filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id"]},{"id":"webhook.insert","mode":"WRITE","operation":"INSERT","entity":"WorkflowWebhookEndpoint","tenant_scope":"TENANT","values":{"name":{"param":"name"},"path_token":{"param":"path_token"},"secret_hash":{"param":"secret_hash"},"enabled":{"param":"enabled","optional":true}},"returning":["id","name","path_token","created_at"]},{"id":"webhook.get_by_path","mode":"READ","operation":"LIST","entity":"WorkflowWebhookEndpoint","tenant_scope":"TENANT","select":["id","tenant_id","name","path_token","secret_hash","enabled","created_at"],"filters":[{"field":"path_token","op":"EQ","param":"path_token","required":true}],"maxRows":1},{"id":"webhook.list","mode":"READ","operation":"LIST","entity":"WorkflowWebhookEndpoint","tenant_scope":"TENANT","select":["id","name","path_token","enabled","created_at","rotated_at"],"sort":[{"field":"created_at","direction":"DESC"}],"maxRows":100},{"id":"webhook.rotate","mode":"WRITE","operation":"UPDATE","entity":"WorkflowWebhookEndpoint","tenant_scope":"TENANT","values":{"secret_hash":{"param":"secret_hash"},"rotated_at":{"param":"rotated_at"}},"filters":[{"field":"id","op":"EQ","param":"id","required":true}],"returning":["id","rotated_at"]}],"migrations":[{"version":"1.0.0","file":"V1.0.0__workflow_schema.sql","checksum":"sha256:bc41a0c5b69e1a08a742cb17bd259f326c584cf448a69c8ab37196e24a9fb256","description":"workflow engine schema"}],"kafka_events":{"publishes":[],"subscribes":[]},"websockets":[],"ui_manifest":{"contract_version":"1.0","screens":[{"route":"/apps/workflow","title_key":"PLUGIN_WORKFLOW_TITLE","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/workflow/main.js","tag_name":"op-workflow-app","order":131,"platforms":["desktop","mobile"]}],"contributions":[{"id":"workflow-my-tasks-item","slot":"core.layout.user-menu.items","title_key":"PLUGIN_WORKFLOW_MY_TASKS","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/workflow/main.js","tag_name":"op-workflow-menu-item","permission":"workflow:task:action","order":20,"contract_version":"1.0","platforms":["desktop","mobile"],"isolation":"light","icon":"bell"}],"slots":[],"crud":[]},"distribution":{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/workflow","tag":"1.0.0"}}'::jsonb,
       'COMPATIBLE', 'SNAPSHOT_RESTORE', '2.0.0', now(), now(),
       'Sprint 08 default workflow plugin'
FROM plugin_catalog c
WHERE c.plugin_key = 'workflow'
ON CONFLICT (catalog_id, version) DO UPDATE
    SET release_status = 'PUBLISHED',
        platforms = EXCLUDED.platforms,
        permissions = EXCLUDED.permissions,
        entities = EXCLUDED.entities,
        ui_manifest = EXCLUDED.ui_manifest,
        distribution = EXCLUDED.distribution,
        manifest = EXCLUDED.manifest,
        published_at = now(),
        publish_reason = 'Sprint 08 default workflow plugin';

-- ---------------------------------------------------------------------
-- 3. Permissions seed
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('form:definition:manage',     'form',     'definition', 'manage', 'PERM_FORM_DEFINITION_MANAGE',     FALSE),
    ('form:response:read',         'form',     'response',   'read',   'PERM_FORM_RESPONSE_READ',         FALSE),
    ('form:response:export',       'form',     'response',   'export', 'PERM_FORM_RESPONSE_EXPORT',       FALSE),
    ('workflow:definition:manage', 'workflow', 'definition', 'manage', 'PERM_WORKFLOW_DEFINITION_MANAGE', FALSE),
    ('workflow:instance:read',     'workflow', 'instance',   'read',   'PERM_WORKFLOW_INSTANCE_READ',     FALSE),
    ('workflow:task:action',       'workflow', 'task',       'action', 'PERM_WORKFLOW_TASK_ACTION',       FALSE),
    ('workflow:report:read',       'workflow', 'report',     'read',   'PERM_WORKFLOW_REPORT_READ',       FALSE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. Role permissions seed for system roles
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_ADMIN', 'TENANT_OWNER')
  AND p.domain IN ('form', 'workflow')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND (
    (r.code = 'GENERAL_MANAGER' AND p.code IN (
      'form:response:read', 'form:response:export',
      'workflow:task:action', 'workflow:instance:read', 'workflow:report:read'
    ))
    OR (r.code = 'STAFF' AND p.code IN (
      'form:response:read', 'workflow:task:action', 'workflow:instance:read'
    ))
    OR (r.code = 'VIEWER' AND p.code IN (
      'form:response:read', 'workflow:instance:read', 'workflow:report:read'
    ))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. Per-tenant schema bootstrap helpers (matching V1.0.0 plugin migrations)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION form_bootstrap_schema(p_schema text) RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plugin_schema_history (
            version varchar(32) PRIMARY KEY,
            description text,
            checksum varchar(80) NOT NULL,
            installed_at timestamptz NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        INSERT INTO %I.plugin_schema_history (version, description, checksum)
        VALUES ('1.0.0', 'form builder schema', 'sha256:660959d230db627c76bdd5a6783fc189cc943b817fccfb8951f6c14ff3d469fe')
        ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_form_definitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            slug VARCHAR(64) NOT NULL,
            title_text VARCHAR(300) NOT NULL,
            description TEXT,
            document JSONB NOT NULL,
            entity_mapping JSONB,
            publish_status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
            captcha VARCHAR(24) NOT NULL DEFAULT 'none',
            close_at TIMESTAMP WITH TIME ZONE,
            response_limit INTEGER,
            accept_responses BOOLEAN NOT NULL DEFAULT TRUE,
            latest_version INTEGER NOT NULL DEFAULT 1,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_form_definitions_slug UNIQUE (tenant_id, slug),
            CONSTRAINT ck_form_publish_status CHECK (publish_status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
            CONSTRAINT ck_form_captcha CHECK (captcha IN ('none', 'recaptcha-v3'))
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_form_definitions_status ON %I.plg_form_definitions (tenant_id, publish_status)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_form_definitions_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            definition_id UUID NOT NULL,
            version INTEGER NOT NULL,
            document JSONB NOT NULL,
            entity_mapping JSONB,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_form_definition_version UNIQUE (tenant_id, definition_id, version)
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_form_responses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            form_id UUID NOT NULL,
            form_version INTEGER NOT NULL,
            answers JSONB NOT NULL DEFAULT '{}'::jsonb,
            responder_email VARCHAR(320),
            submitted_by_user_id UUID,
            entity_write_status VARCHAR(16) NOT NULL DEFAULT 'SKIPPED',
            entity_write_error TEXT,
            workflow_instance_id UUID,
            ip_hash VARCHAR(64),
            idempotency_key VARCHAR(80) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED',
            submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT ck_form_entity_write_status CHECK (entity_write_status IN ('SKIPPED', 'OK', 'FAILED')),
            CONSTRAINT uq_form_response_idempotency UNIQUE (tenant_id, idempotency_key)
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_form_responses_form_submitted ON %I.plg_form_responses (tenant_id, form_id, submitted_at DESC)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_form_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            form_id UUID NOT NULL,
            response_id UUID,
            storage_key VARCHAR(400) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            content_type VARCHAR(120),
            size_bytes BIGINT,
            scan_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            scan_error TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT ck_form_file_scan_status CHECK (scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR'))
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_form_files_response ON %I.plg_form_files (tenant_id, response_id)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_form_public_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            form_id UUID NOT NULL,
            event VARCHAR(24) NOT NULL,
            ip_hash VARCHAR(64),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT ck_form_public_event CHECK (event IN ('VIEW', 'SUBMIT', 'REJECT_RATELIMIT', 'REJECT_CAPTCHA'))
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_form_public_events_form ON %I.plg_form_public_events (tenant_id, form_id, created_at DESC)', p_schema);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION workflow_bootstrap_schema(p_schema text) RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plugin_schema_history (
            version varchar(32) PRIMARY KEY,
            description text,
            checksum varchar(80) NOT NULL,
            installed_at timestamptz NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        INSERT INTO %I.plugin_schema_history (version, description, checksum)
        VALUES ('1.0.0', 'workflow engine schema', 'sha256:bc41a0c5b69e1a08a742cb17bd259f326c584cf448a69c8ab37196e24a9fb256')
        ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_definitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            key VARCHAR(80) NOT NULL,
            version INTEGER NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
            document JSONB NOT NULL,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            published_at TIMESTAMP WITH TIME ZONE,
            CONSTRAINT uq_workflow_definition_version UNIQUE (tenant_id, key, version),
            CONSTRAINT ck_workflow_definition_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_definitions_key_status ON %I.plg_workflow_definitions (tenant_id, key, status)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_instances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            definition_id UUID NOT NULL,
            definition_version INTEGER NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'RUNNING',
            outcome VARCHAR(24),
            trigger_type VARCHAR(16) NOT NULL,
            source_ref JSONB,
            context JSONB,
            idempotency_key VARCHAR(120) NOT NULL,
            initiated_by UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            CONSTRAINT ck_workflow_instance_status CHECK (status IN ('RUNNING', 'COMPLETED', 'CANCELLED')),
            CONSTRAINT ck_workflow_instance_trigger CHECK (trigger_type IN ('MANUAL', 'API', 'EVENT', 'WEBHOOK', 'BOOTSTRAP')),
            CONSTRAINT uq_workflow_instance_idempotency UNIQUE (tenant_id, idempotency_key)
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON %I.plg_workflow_instances (tenant_id, status)', p_schema);
    EXECUTE format($idx$CREATE INDEX IF NOT EXISTS idx_workflow_instances_source ON %I.plg_workflow_instances (tenant_id, ((source_ref->>'aggregate_id')))$idx$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            instance_id UUID NOT NULL,
            node_id VARCHAR(80) NOT NULL,
            node_type VARCHAR(16) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            approval_mode VARCHAR(16) NOT NULL DEFAULT 'ANY_ONE',
            vote_ratio NUMERIC(3, 2),
            assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
            candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
            claimed_by UUID,
            action_votes JSONB NOT NULL DEFAULT '[]'::jsonb,
            due_at TIMESTAMP WITH TIME ZONE,
            remind_before_hours INTEGER,
            reminder_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
            overdue_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            CONSTRAINT ck_workflow_task_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'SKIPPED', 'CANCELLED')),
            CONSTRAINT ck_workflow_task_mode CHECK (approval_mode IN ('ANY_ONE', 'ALL_APPROVE', 'VOTE_RATIO'))
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_tasks_inbox ON %I.plg_workflow_tasks (tenant_id, status, due_at)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance ON %I.plg_workflow_tasks (tenant_id, instance_id)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_tasks_candidates ON %I.plg_workflow_tasks USING GIN (candidates)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            instance_id UUID NOT NULL,
            task_id UUID,
            event VARCHAR(32) NOT NULL,
            actor_user_id UUID,
            payload JSONB,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_events_instance ON %I.plg_workflow_events (tenant_id, instance_id, created_at)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_triggers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            definition_id UUID NOT NULL,
            source_plugin VARCHAR(40) NOT NULL DEFAULT '*',
            entity VARCHAR(80) NOT NULL DEFAULT '*',
            event_type VARCHAR(40) NOT NULL,
            filter JSONB,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_workflow_triggers_lookup ON %I.plg_workflow_triggers (tenant_id, source_plugin, entity, event_type)', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_workflow_webhook_endpoints (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(120) NOT NULL,
            path_token VARCHAR(48) NOT NULL,
            secret_hash VARCHAR(128) NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            rotated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_workflow_webhook_path UNIQUE (path_token)
        )$ddl$, p_schema);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 6. Backfill every existing non-system tenant
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t RECORD;
    v_form_schema TEXT;
    v_wf_schema TEXT;
BEGIN
    FOR t IN SELECT id FROM tenants WHERE id <> '00000000-0000-0000-0000-000000000001' LOOP
        v_form_schema := 'tenant_' || substr(replace(t.id::text, '-', ''), 1, 8) || '_form';
        v_wf_schema   := 'tenant_' || substr(replace(t.id::text, '-', ''), 1, 8) || '_workflow';

        PERFORM form_bootstrap_schema(v_form_schema);
        PERFORM workflow_bootstrap_schema(v_wf_schema);

        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'form', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_form_schema, '1.0.8', '{"runtime":"docker","deployment":"openerp-plugin-form-1-0-8","service":"openerp-plugin-form-1-0-8","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'form'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = EXCLUDED.installed_version,
                deploy_ref = COALESCE(tenant_plugins.deploy_ref, EXCLUDED.deploy_ref),
                installed_at = COALESCE(tenant_plugins.installed_at, now()),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'workflow', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_wf_schema, '1.0.13', '{"runtime":"docker","deployment":"openerp-plugin-workflow-1-0-13","service":"openerp-plugin-workflow-1-0-13","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'workflow'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = EXCLUDED.installed_version,
                deploy_ref = COALESCE(tenant_plugins.deploy_ref, EXCLUDED.deploy_ref),
                installed_at = COALESCE(tenant_plugins.installed_at, now()),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        UPDATE tenants
        SET allowed_plugins = CASE
            WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> '["form"]'::jsonb THEN allowed_plugins
            ELSE COALESCE(allowed_plugins, '[]'::jsonb) || '["form"]'::jsonb
        END
        WHERE id = t.id;

        UPDATE tenants
        SET allowed_plugins = CASE
            WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> '["workflow"]'::jsonb THEN allowed_plugins
            ELSE COALESCE(allowed_plugins, '[]'::jsonb) || '["workflow"]'::jsonb
        END
        WHERE id = t.id;
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS form_bootstrap_schema(text);
DROP FUNCTION IF EXISTS workflow_bootstrap_schema(text);
