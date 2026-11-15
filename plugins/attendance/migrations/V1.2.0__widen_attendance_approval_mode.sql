-- Widen approval_mode: INTERNAL_FALLBACK (17 chars) did not fit varchar(16).
ALTER TABLE plg_attendance_requests
    ALTER COLUMN approval_mode TYPE varchar(32);
