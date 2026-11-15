ALTER TABLE plg_attendance_devices
    ADD COLUMN IF NOT EXISTS public_token VARCHAR(128);
