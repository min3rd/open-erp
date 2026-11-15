-- =====================================================================
-- V9.0.1: Attendance plugin manifest must declare its migration bundle.
-- The install saga only runs migrations listed in plugin_versions.manifest.
-- Without this array the attendance schema was created empty and all
-- runtime API calls failed with 500 (missing tables).
-- =====================================================================
UPDATE plugin_versions
SET manifest = jsonb_set(
        manifest,
        '{migrations}',
        '[
          {
            "version": "1.0.0",
            "file": "V1.0.0__attendance_schema.sql",
            "checksum": "sha256:86609605af9bb8fb2b3956bb496b7b68cfd764eae22199d3eeee010e0e328007",
            "description": "attendance schema"
          },
          {
            "version": "1.1.0",
            "file": "V1.1.0__attendance_timesheet_and_leave_schema.sql",
            "checksum": "sha256:f2e0aeaf84e9a768bba7392134991383c1653dc1b1648796fc3e437078a90ff9",
            "description": "attendance timesheet and leave schema"
          }
        ]'::jsonb,
        true
    )
WHERE catalog_id = (SELECT id FROM plugin_catalog WHERE plugin_key = 'attendance')
  AND version = '1.0.0';
