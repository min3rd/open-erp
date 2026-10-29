ALTER TABLE plg_in_app_notification_preferences
    ALTER COLUMN channel_email DROP NOT NULL;

ALTER TABLE plg_in_app_notification_preferences
    ALTER COLUMN channel_in_app DROP NOT NULL;

ALTER TABLE plg_in_app_notification_preferences
    ALTER COLUMN level_min DROP NOT NULL;
