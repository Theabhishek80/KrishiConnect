-- Dairy marketplace: products, store reviews, direct orders, monthly subscriptions.

CREATE TABLE dairy_products (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES dairy_stores(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL DEFAULT 'MILK',
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    unit VARCHAR(40) NOT NULL DEFAULT 'litre',
    stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_quantity_per_day NUMERIC(8,2),
    monthly_subscription_price NUMERIC(12,2) CHECK (monthly_subscription_price IS NULL OR monthly_subscription_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dairy_products_store ON dairy_products(store_id);

CREATE TABLE dairy_store_reviews (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES dairy_stores(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dairy_review_store_user UNIQUE (store_id, user_id)
);
CREATE INDEX idx_dairy_reviews_store ON dairy_store_reviews(store_id);

CREATE TABLE dairy_orders (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES dairy_stores(id),
    product_id BIGINT NOT NULL REFERENCES dairy_products(id) ON DELETE RESTRICT,
    consumer_id BIGINT NOT NULL REFERENCES users(id),
    product_name VARCHAR(180) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    total_amount NUMERIC(12,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    phone VARCHAR(40) NOT NULL,
    note TEXT,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
    status VARCHAR(25) NOT NULL DEFAULT 'PLACED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dairy_orders_store ON dairy_orders(store_id);
CREATE INDEX idx_dairy_orders_consumer ON dairy_orders(consumer_id);

CREATE TABLE dairy_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES dairy_stores(id),
    product_id BIGINT NOT NULL REFERENCES dairy_products(id) ON DELETE RESTRICT,
    consumer_id BIGINT NOT NULL REFERENCES users(id),
    product_name VARCHAR(180) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    quantity_per_day NUMERIC(8,2) NOT NULL CHECK (quantity_per_day > 0),
    monthly_price NUMERIC(12,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    phone VARCHAR(40) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dairy_subs_store ON dairy_subscriptions(store_id);
CREATE INDEX idx_dairy_subs_consumer ON dairy_subscriptions(consumer_id);
