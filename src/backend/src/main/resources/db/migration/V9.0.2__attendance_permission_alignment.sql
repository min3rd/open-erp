-- =====================================================================
-- V9.0.2: Align attendance permission codes with the plugin runtime.
-- V9.0.0 seeded a short legacy list; the REST resources require the codes
-- declared in plugins/attendance/plugin.json. Without these rows every admin
-- screen (logs, records, shifts, reports, settings) returned 403.
-- =====================================================================
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('attendance:checkin:self',      'attendance', 'checkin',   'self',     'PERM_ATTENDANCE_CHECKIN_SELF',      FALSE),
    ('attendance:log:manage',        'attendance', 'log',       'manage',   'PERM_ATTENDANCE_LOG_MANAGE',        FALSE),
    ('attendance:kiosk:operate',     'attendance', 'kiosk',     'operate',  'PERM_ATTENDANCE_KIOSK_OPERATE',     FALSE),
    ('attendance:shift:manage',      'attendance', 'shift',     'manage',   'PERM_ATTENDANCE_SHIFT_MANAGE',      FALSE),
    ('attendance:record:read',       'attendance', 'record',    'read',     'PERM_ATTENDANCE_RECORD_READ',       FALSE),
    ('attendance:record:override',   'attendance', 'record',    'override', 'PERM_ATTENDANCE_RECORD_OVERRIDE',   FALSE),
    ('attendance:request:submit',    'attendance', 'request',   'submit',   'PERM_ATTENDANCE_REQUEST_SUBMIT',    FALSE),
    ('attendance:leave:manage',      'attendance', 'leave',     'manage',   'PERM_ATTENDANCE_LEAVE_MANAGE',      FALSE),
    ('attendance:timesheet:lock',    'attendance', 'timesheet', 'lock',     'PERM_ATTENDANCE_TIMESHEET_LOCK',    FALSE),
    ('attendance:timesheet:confirm', 'attendance', 'timesheet', 'confirm',  'PERM_ATTENDANCE_TIMESHEET_CONFIRM', FALSE),
    ('attendance:report:read',       'attendance', 'report',    'read',     'PERM_ATTENDANCE_REPORT_READ',       FALSE),
    ('attendance:settings:manage',   'attendance', 'settings',  'manage',   'PERM_ATTENDANCE_SETTINGS_MANAGE',   FALSE)
ON CONFLICT (code) DO NOTHING;

-- Tenant administrators / owners can operate every attendance screen.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_ADMIN', 'TENANT_OWNER')
  AND p.domain = 'attendance'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- General managers can approve, read records/reports and manage shifts.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'GENERAL_MANAGER'
  AND p.domain = 'attendance'
  AND p.code IN (
      'attendance:read', 'attendance:checkin:self', 'attendance:punch',
      'attendance:log:manage', 'attendance:shift:manage', 'attendance:record:read',
      'attendance:record:override', 'attendance:request:create', 'attendance:request:submit',
      'attendance:request:approve', 'attendance:leave:manage', 'attendance:timesheet:manage',
      'attendance:timesheet:confirm', 'attendance:report:read', 'attendance:kiosk'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff keep only self-service permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'STAFF'
  AND p.domain = 'attendance'
  AND p.code IN (
      'attendance:read', 'attendance:checkin:self', 'attendance:punch',
      'attendance:request:create', 'attendance:request:submit',
      'attendance:timesheet:confirm', 'attendance:kiosk:operate'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
