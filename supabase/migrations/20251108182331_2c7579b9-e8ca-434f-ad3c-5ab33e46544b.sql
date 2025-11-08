-- Rename Stripe-specific columns to generic payment provider columns
ALTER TABLE public.orders 
  RENAME COLUMN stripe_payment_intent_id TO payment_provider_id;

ALTER TABLE public.orders 
  RENAME COLUMN stripe_charge_id TO payment_transaction_id;

-- Add payment provider column to track which service was used
ALTER TABLE public.orders 
  ADD COLUMN payment_provider TEXT DEFAULT 'lemonsqueezy';

-- Add comment for clarity
COMMENT ON COLUMN public.orders.payment_provider IS 'Payment provider used: lemonsqueezy, stripe, midtrans, etc.';
COMMENT ON COLUMN public.orders.payment_provider_id IS 'Primary payment identifier from the payment provider';
COMMENT ON COLUMN public.orders.payment_transaction_id IS 'Secondary transaction identifier from the payment provider';