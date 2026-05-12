## Goal

1. Give admins a way to manually delete any order from the Order Management page (with a confirmation prompt).
2. Surface the previously-hidden `pending_payment` orders so admins can see what's "hanging".
3. Automatically delete `pending_payment` orders that have been sitting unpaid for more than 120 minutes (2 × 60).

## Context found

- Orders are inserted with `status = 'pending_payment'` by `create-lemonsqueezy-checkout`. The webhook later promotes them to `payment_received`.
- The current admin filter dropdown does not include `pending_payment`, so abandoned checkouts are invisible in the UI today. There are 12 such rows already in the DB (all `tjhinn@gmail.com` from 2026‑05‑11).
- `OrderActions.tsx` has no Delete button, and `AdminOrders.tsx` has no delete handler.
- RLS on `orders` already allows admins to `DELETE`, so no policy change is needed.

## Changes

### 1. UI — manual delete

**`src/pages/admin/OrderActions.tsx`**
- Add a small destructive "Delete Order" button at the bottom of every order card (shown for all statuses, not just cancelled).
- Wrap it in a shadcn `AlertDialog` confirmation: "Delete this order permanently? This cannot be undone."
- Accept a new `onDelete(orderId)` prop and an `isDeleting` flag.

**`src/pages/AdminOrders.tsx`**
- Add `deletingOrders` state set + `handleDelete(orderId)` that calls `supabase.from('orders').delete().eq('id', orderId)`, toasts result, then `refetch()`.
- Pass `onDelete` and `isDeleting` into `<OrderActions>`.

**`src/pages/admin/OrderFilters.tsx`**
- Add `"pending_payment"` to the `StatusFilter` union and a new `<SelectItem value="pending_payment">⏳ Awaiting Payment</SelectItem>` option so admins can find these orders.
- Mirror the union update in `AdminOrders.tsx`.

**`src/pages/admin/OrderCard.tsx`**
- Add `pending_payment: "bg-slate-400"` to `getStatusColor` so the new badge renders cleanly.

### 2. Auto-delete after 120 minutes

**New edge function `supabase/functions/cleanup-pending-orders/index.ts`**
- Uses the service-role client.
- Deletes from `orders` where `status = 'pending_payment'` AND `created_at < now() - interval '120 minutes'`.
- Returns `{ deleted: <count> }` and logs the count.
- Standard CORS + try/catch.

**Scheduled job (via `supabase--insert`, not migration, since it embeds project URL + anon key)**
- Enable `pg_cron` and `pg_net` extensions (idempotent).
- Schedule the function to run every 15 minutes:
  ```sql
  select cron.schedule(
    'cleanup-pending-orders-every-15min',
    '*/15 * * * *',
    $$ select net.http_post(
      url := 'https://aoszitfxsnwxbocthejl.supabase.co/functions/v1/cleanup-pending-orders',
      headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
      body := '{}'::jsonb
    ); $$
  );
  ```

### 3. Optional cleanup of existing backlog

After the user confirms, run a one-off `DELETE FROM orders WHERE status = 'pending_payment' AND created_at < now() - interval '120 minutes'` via the insert tool to clear the 12 currently-hanging orders, OR just let the cron job do it on its first run.

## Out of scope

- No changes to the checkout function itself (the webhook will still promote real payments to `payment_received` before the 2h window).
- No change to RLS policies (admins already have DELETE).
- No soft-delete / archive table — user asked for true deletion.
