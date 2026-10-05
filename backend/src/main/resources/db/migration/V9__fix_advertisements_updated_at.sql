ALTER TABLE advertisements
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

UPDATE advertisements
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;
