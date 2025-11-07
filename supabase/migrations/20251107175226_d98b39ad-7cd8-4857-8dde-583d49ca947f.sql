-- Add 'pending_payment' status to order_status enum
-- This is the initial status when an order is created but payment hasn't been completed yet
ALTER TYPE order_status ADD VALUE 'pending_payment' BEFORE 'payment_received';