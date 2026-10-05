-- =====================================================================
-- V3.2.0: Sprint 04 - Per-user UI preferences (TASK-369)
-- Theme/shape/layout/mode are per-user overrides; NULL means "follow the
-- tenant/default". The tenant default lives in tenants.ui_theme. Idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Per-user UI preference columns (NULL = follow the tenant/default).
-- ---------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS ui_theme VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ui_shape VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ui_layout VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ui_mode VARCHAR(16);
