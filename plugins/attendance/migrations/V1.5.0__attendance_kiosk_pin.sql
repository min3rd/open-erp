ALTER TABLE plg_attendance_employee_refs
    ADD COLUMN IF NOT EXISTS kiosk_pin_hash VARCHAR(128),
    ADD COLUMN IF NOT EXISTS kiosk_pin_updated_at TIMESTAMP WITH TIME ZONE;
