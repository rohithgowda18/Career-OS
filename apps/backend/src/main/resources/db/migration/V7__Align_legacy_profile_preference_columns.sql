-- Registration creates user_preferences and user_profiles immediately after
-- users. Legacy Node-era databases may still have extra NOT NULL columns on
-- these tables that Spring does not write, so give them production-safe
-- defaults or relax them where appropriate.

ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS default_view VARCHAR(50),
    ADD COLUMN IF NOT EXISTS notifications_enabled INTEGER,
    ADD COLUMN IF NOT EXISTS email_notifications_enabled INTEGER,
    ADD COLUMN IF NOT EXISTS email_deadline_reminders INTEGER,
    ADD COLUMN IF NOT EXISTS email_status_updates INTEGER,
    ADD COLUMN IF NOT EXISTS weekly_digest_enabled INTEGER,
    ADD COLUMN IF NOT EXISTS digest_day VARCHAR(20),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

ALTER TABLE user_preferences
    ALTER COLUMN default_view DROP DEFAULT,
    ALTER COLUMN notifications_enabled DROP DEFAULT,
    ALTER COLUMN email_notifications_enabled DROP DEFAULT,
    ALTER COLUMN email_deadline_reminders DROP DEFAULT,
    ALTER COLUMN email_status_updates DROP DEFAULT,
    ALTER COLUMN weekly_digest_enabled DROP DEFAULT,
    ALTER COLUMN default_view TYPE VARCHAR(50) USING LOWER(default_view::TEXT),
    ALTER COLUMN notifications_enabled TYPE INTEGER USING CASE WHEN notifications_enabled IS NULL THEN NULL WHEN LOWER(notifications_enabled::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END,
    ALTER COLUMN email_notifications_enabled TYPE INTEGER USING CASE WHEN email_notifications_enabled IS NULL THEN NULL WHEN LOWER(email_notifications_enabled::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END,
    ALTER COLUMN email_deadline_reminders TYPE INTEGER USING CASE WHEN email_deadline_reminders IS NULL THEN NULL WHEN LOWER(email_deadline_reminders::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END,
    ALTER COLUMN email_status_updates TYPE INTEGER USING CASE WHEN email_status_updates IS NULL THEN NULL WHEN LOWER(email_status_updates::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END,
    ALTER COLUMN weekly_digest_enabled TYPE INTEGER USING CASE WHEN weekly_digest_enabled IS NULL THEN NULL WHEN LOWER(weekly_digest_enabled::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END;

UPDATE user_preferences
SET default_view = 'dashboard'
WHERE default_view IS NULL OR BTRIM(default_view::TEXT) = '';

UPDATE user_preferences
SET notifications_enabled = 1
WHERE notifications_enabled IS NULL;

UPDATE user_preferences
SET email_notifications_enabled = 1
WHERE email_notifications_enabled IS NULL;

UPDATE user_preferences
SET email_deadline_reminders = 1
WHERE email_deadline_reminders IS NULL;

UPDATE user_preferences
SET email_status_updates = 1
WHERE email_status_updates IS NULL;

UPDATE user_preferences
SET weekly_digest_enabled = 0
WHERE weekly_digest_enabled IS NULL;

UPDATE user_preferences
SET digest_day = 'monday'
WHERE digest_day IS NULL OR BTRIM(digest_day::TEXT) = '';

UPDATE user_preferences
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE user_preferences
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

ALTER TABLE user_preferences
    ALTER COLUMN default_view SET DEFAULT 'dashboard',
    ALTER COLUMN notifications_enabled SET DEFAULT 1,
    ALTER COLUMN email_notifications_enabled SET DEFAULT 1,
    ALTER COLUMN email_deadline_reminders SET DEFAULT 1,
    ALTER COLUMN email_status_updates SET DEFAULT 1,
    ALTER COLUMN weekly_digest_enabled SET DEFAULT 0,
    ALTER COLUMN digest_day SET DEFAULT 'monday',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50),
    ADD COLUMN IF NOT EXISTS show_accepted_only INTEGER,
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

ALTER TABLE user_profiles
    ALTER COLUMN profile_visibility DROP DEFAULT,
    ALTER COLUMN show_accepted_only DROP DEFAULT,
    ALTER COLUMN profile_visibility TYPE VARCHAR(50) USING LOWER(profile_visibility::TEXT),
    ALTER COLUMN show_accepted_only TYPE INTEGER USING CASE WHEN show_accepted_only IS NULL THEN NULL WHEN LOWER(show_accepted_only::TEXT) IN ('true', 't', '1', 'yes') THEN 1 ELSE 0 END;

UPDATE user_profiles
SET profile_visibility = 'private'
WHERE profile_visibility IS NULL OR BTRIM(profile_visibility::TEXT) = '';

UPDATE user_profiles
SET show_accepted_only = 0
WHERE show_accepted_only IS NULL;

ALTER TABLE user_profiles
    ALTER COLUMN profile_visibility SET DEFAULT 'private',
    ALTER COLUMN show_accepted_only SET DEFAULT 0,
    ALTER COLUMN avatar_url DROP NOT NULL,
    ALTER COLUMN website_url DROP NOT NULL;
