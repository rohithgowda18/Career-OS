-- Repair users created before the auth DTO contract was aligned.
-- Keep the account data, but replace blank profile handles with deterministic values.

WITH blank_users AS (
    SELECT
        id,
        COALESCE(NULLIF(LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9]', '', 'g')), ''), 'user') AS base_username
    FROM users
    WHERE username IS NULL OR BTRIM(username) = ''
),
resolved_usernames AS (
    SELECT
        blank_users.id,
        CASE
            WHEN COUNT(*) OVER (PARTITION BY base_username) > 1
                OR EXISTS (
                    SELECT 1
                    FROM users existing_user
                    WHERE LOWER(existing_user.username) = blank_users.base_username
                      AND existing_user.id <> blank_users.id
                )
            THEN LEFT(blank_users.base_username || blank_users.id, 255)
            ELSE blank_users.base_username
        END AS username
    FROM blank_users
)
UPDATE users
SET username = resolved_usernames.username
FROM resolved_usernames
WHERE users.id = resolved_usernames.id;

UPDATE user_profiles
SET username = users.username
FROM users
WHERE user_profiles.user_id = users.id
  AND (user_profiles.username IS NULL OR BTRIM(user_profiles.username) = '');

ALTER TABLE users
    ADD CONSTRAINT users_username_not_blank
    CHECK (username IS NULL OR BTRIM(username) <> '');
