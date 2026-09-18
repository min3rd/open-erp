-- BUG-31: Align IAM schema with DES-01
-- NOTE: the TEXT default '[]' cannot be auto-cast to jsonb, so drop/recreate the default around the type change.
ALTER TABLE user_two_factor ALTER COLUMN backup_codes_hash DROP DEFAULT;
ALTER TABLE user_two_factor ALTER COLUMN backup_codes_hash TYPE JSONB USING backup_codes_hash::jsonb;
ALTER TABLE user_two_factor ALTER COLUMN backup_codes_hash SET DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(type);

-- Email verification OTP is stored in Redis (DES-01 section 4), not in PostgreSQL.
ALTER TABLE users DROP COLUMN IF EXISTS verification_otp;
ALTER TABLE users DROP COLUMN IF EXISTS verification_otp_expires_at;
