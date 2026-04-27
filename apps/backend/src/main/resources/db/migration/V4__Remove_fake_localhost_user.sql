-- Remove legacy demo/test account that must never exist in production.
-- Foreign keys from user-owned tables are ON DELETE CASCADE in the schema.

DELETE FROM users
WHERE LOWER(email) = 'user@localhost';
