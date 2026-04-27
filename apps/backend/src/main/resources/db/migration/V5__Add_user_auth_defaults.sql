-- Align the Spring User entity with the legacy Node-era users table shape.
-- Production databases may already have these columns as NOT NULL; make the
-- defaults explicit so registration inserts never depend on omitted values.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS login_method VARCHAR(50);

UPDATE users
SET role = 'USER'
WHERE role IS NULL OR BTRIM(role) = '';

UPDATE users
SET login_method = 'EMAIL'
WHERE login_method IS NULL OR BTRIM(login_method) = '';

UPDATE users
SET is_active = true
WHERE is_active IS NULL;

UPDATE users
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE users
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'USER',
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN login_method SET DEFAULT 'EMAIL',
    ALTER COLUMN login_method SET NOT NULL,
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_active SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET NOT NULL;
