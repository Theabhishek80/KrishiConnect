-- The production database already contains the original advertisements table.
-- The current application expects sort_order, while the production V6 schema
-- also contains an extra updated_at column. This forward-only migration adds
-- only the missing objects; it does not delete or rewrite existing data.

ALTER TABLE advertisements
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_advertisements_active_order
    ON advertisements(active, sort_order, id);
