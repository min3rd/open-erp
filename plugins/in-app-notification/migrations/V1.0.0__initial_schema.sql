CREATE TABLE IF NOT EXISTS plg_in_app_notification_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_text VARCHAR(255) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    level VARCHAR(16) NOT NULL DEFAULT 'INFO',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_in_app_notification_level CHECK (level IN ('INFO', 'WARN', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_in_app_notification_recipient_created
    ON plg_in_app_notification_notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notification_recipient_unread
    ON plg_in_app_notification_notifications (recipient_id, read_at)
    WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS plg_in_app_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    channel_email BOOLEAN NOT NULL DEFAULT FALSE,
    channel_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    level_min VARCHAR(16) NOT NULL DEFAULT 'INFO',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_in_app_notification_pref_user UNIQUE (user_id),
    CONSTRAINT ck_in_app_notification_pref_level CHECK (level_min IN ('INFO', 'WARN', 'ERROR'))
);
