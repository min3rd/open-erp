-- =====================================================================
-- V4.0.1: Sprint 05 cleanup - drop the unused bridge columns
-- CONF-S05-001 section 3.1 (internal decision 1): the "bridge" option was
-- dropped with Q3, so catalog_types no longer carries source/source_ref.
-- The column always held 'PLUGIN' and source_ref was never written; keeping
-- them would contradict the plugin descriptor and the entity registry.
-- PostgreSQL 16+, schema public. Idempotent.
-- =====================================================================

ALTER TABLE catalog_types DROP COLUMN IF EXISTS source_ref;
ALTER TABLE catalog_types DROP COLUMN IF EXISTS source;
