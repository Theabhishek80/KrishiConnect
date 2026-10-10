-- ---------------------------------------------------------------
-- Orders: delivery date, payment info, address snapshot, timestamps
-- ---------------------------------------------------------------
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method         VARCHAR(20) NOT NULL DEFAULT 'COD',
    ADD COLUMN IF NOT EXISTS payment_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
    ADD COLUMN IF NOT EXISTS shipping_name          VARCHAR(120),
    ADD COLUMN IF NOT EXISTS shipping_phone         VARCHAR(40),
    ADD COLUMN IF NOT EXISTS delivered_at           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at           TIMESTAMPTZ;

-- Give old orders sensible values
UPDATE orders
   SET expected_delivery_date = ((created_at AT TIME ZONE 'Asia/Kolkata')::date + 3)
 WHERE expected_delivery_date IS NULL;

UPDATE orders SET payment_status = 'PAID' WHERE status = 'DELIVERED';

-- ---------------------------------------------------------------
-- Notifications: optional link to open when the user clicks it
-- ---------------------------------------------------------------
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS link VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------
-- Users: notification preferences (Settings page)
-- ---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS notify_orders BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_email  BOOLEAN NOT NULL DEFAULT TRUE;

-- ---------------------------------------------------------------
-- Saved addresses (table already exists from V1) - just add an index
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
