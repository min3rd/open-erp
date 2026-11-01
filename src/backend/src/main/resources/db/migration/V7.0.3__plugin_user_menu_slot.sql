-- Sprint 07 / TASK-438: account-menu slot for plugin contributions.
INSERT INTO plugin_ui_slots
  (slot_code, host_type, title_key, contract_version, allowed_render_modes, constraints, status, created_at, updated_at)
VALUES
  ('core.layout.user-menu.items', 'CORE', 'PLUGIN_SLOT_CORE_USER_MENU_ITEMS', '1.0',
   '["WEB_COMPONENT","MODULE_FEDERATION"]'::jsonb,
   '{"max_contributions":8,"min_height_px":32,"platforms":["desktop","mobile"]}'::jsonb,
   'ACTIVE', NOW(), NOW())
ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO UPDATE
  SET allowed_render_modes = EXCLUDED.allowed_render_modes,
      constraints = EXCLUDED.constraints,
      status = 'ACTIVE',
      updated_at = NOW();
