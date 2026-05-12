ALTER TYPE order_status RENAME TO order_status_old;

CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'payment_received',
  'generating_images',
  'pending_admin_review',
  'email_sent',
  'cancelled',
  'pages_in_progress',
  'pages_ready_for_review'
);

ALTER TABLE orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status USING status::text::order_status,
  ALTER COLUMN status SET DEFAULT 'payment_received'::order_status;

DROP TYPE order_status_old;