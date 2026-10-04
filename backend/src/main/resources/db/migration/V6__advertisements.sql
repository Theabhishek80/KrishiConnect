CREATE TABLE IF NOT EXISTS advertisements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(160),
    image_url TEXT NOT NULL,
    link_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_advertisements_active_order
ON advertisements(active, sort_order, id);
