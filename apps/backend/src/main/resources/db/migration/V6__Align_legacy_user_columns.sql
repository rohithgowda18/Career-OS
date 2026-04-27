-- Production still has legacy Node-era user columns. Make them compatible with
-- Spring registration inserts while preserving existing data.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS open_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_signed_in TIMESTAMP;

UPDATE users
SET open_id = 'email:' || LOWER(email)
WHERE (open_id IS NULL OR BTRIM(open_id::TEXT) = '')
  AND email IS NOT NULL;

UPDATE users
SET name = COALESCE(
    NULLIF(BTRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
    NULLIF(username, ''),
    email
)
WHERE name IS NULL OR BTRIM(name::TEXT) = '';

UPDATE users
SET password_hash = password
WHERE (password_hash IS NULL OR BTRIM(password_hash::TEXT) = '')
  AND password IS NOT NULL;

UPDATE users
SET last_signed_in = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE last_signed_in IS NULL;

ALTER TABLE users
    ALTER COLUMN open_id SET NOT NULL,
    ALTER COLUMN name DROP NOT NULL,
    ALTER COLUMN password_hash DROP NOT NULL,
    ALTER COLUMN last_signed_in SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN last_signed_in SET NOT NULL;
