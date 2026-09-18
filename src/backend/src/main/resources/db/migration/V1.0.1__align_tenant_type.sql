-- BUG-24: Align tenants.type with the confirmed design (BUSINESS | PERSONAL)
-- V1.0.0 already ran with DEFAULT 'ORGANIZATION', so this migration converts data safely.
UPDATE tenants SET type = 'BUSINESS' WHERE type = 'ORGANIZATION';
ALTER TABLE tenants ALTER COLUMN type SET DEFAULT 'BUSINESS';
