-- Sprint 06 / TASK-415: Core UI slots for header actions and system settings tabs.
-- IFRAME is no longer an allowed slot render mode; catalog screen migration is
-- handled by the plugin manifest (TASK-420).

ALTER TABLE plugin_ui_slots
  ALTER COLUMN allowed_render_modes
  SET DEFAULT '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb;

UPDATE plugin_ui_slots
SET allowed_render_modes = '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
    updated_at = NOW()
WHERE host_type = 'CORE';

UPDATE plugin_ui_slots
SET constraints = constraints || '{"platforms":["desktop"]}'::jsonb,
    updated_at = NOW()
WHERE host_type = 'CORE'
  AND slot_code IN ('core.dashboard.widgets', 'core.settings.sections')
  AND NOT (constraints ? 'platforms');

INSERT INTO plugin_ui_slots
  (slot_code, host_type, title_key, contract_version, allowed_render_modes, constraints, status, created_at, updated_at)
VALUES
  ('core.layout.header.actions', 'CORE', 'PLUGIN_SLOT_CORE_HEADER_ACTIONS', '1.0',
   '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
   '{"max_contributions":6,"min_height_px":32,"platforms":["desktop","mobile"]}'::jsonb,
   'ACTIVE', NOW(), NOW()),
  ('core.settings.system.tabs', 'CORE', 'PLUGIN_SLOT_CORE_SETTINGS_TABS', '1.0',
   '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
   '{"max_contributions":12,"min_height_px":320,"platforms":["desktop"]}'::jsonb,
   'ACTIVE', NOW(), NOW())
ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO UPDATE
  SET allowed_render_modes = EXCLUDED.allowed_render_modes,
      constraints = EXCLUDED.constraints,
      updated_at = NOW();
