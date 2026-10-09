
CREATE TABLE dairy_stores (
    id BIGSERIAL PRIMARY KEY,

    owner_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,

    store_name VARCHAR(180) NOT NULL,
    description TEXT,
    phone VARCHAR(40),

    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    delivery_radius_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    operating_days VARCHAR(200),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_dairy_store_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_dairy_store_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_dairy_store_delivery_radius
        CHECK (delivery_radius_km > 0)
);

CREATE INDEX idx_dairy_stores_owner
    ON dairy_stores(owner_id);

CREATE INDEX idx_dairy_stores_location
    ON dairy_stores(city, state);

CREATE INDEX idx_dairy_stores_postal_code
    ON dairy_stores(postal_code);
