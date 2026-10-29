ALTER TABLE plg_in_app_notification_preferences
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE plg_in_app_notification_preferences
    DROP CONSTRAINT IF EXISTS uq_in_app_notification_pref_user;

ALTER TABLE plg_in_app_notification_preferences
    ADD COLUMN IF NOT EXISTS scope VARCHAR(16) NOT NULL DEFAULT 'USER';

ALTER TABLE plg_in_app_notification_preferences
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(160);

ALTER TABLE plg_in_app_notification_preferences
    ADD COLUMN IF NOT EXISTS support_email VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_in_app_notification_pref_user
    ON plg_in_app_notification_preferences (user_id)
    WHERE scope = 'USER';

CREATE UNIQUE INDEX IF NOT EXISTS uq_in_app_notification_pref_tenant
    ON plg_in_app_notification_preferences (scope)
    WHERE scope = 'TENANT';
