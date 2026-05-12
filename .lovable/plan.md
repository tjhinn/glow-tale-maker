## Why

The order-level `approved` status is dead code. The `approve-order` edge function sends the email and transitions the order straight from `pending_admin_review` → `email_sent` (Completed) in a single update. Nothing ever writes `status = 'approved'` to an order, and 0 rows currently use it. The "Approved" filter option in the admin dropdown will always return an empty list, which is confusing.

(The page-level `approved` status used in `PageReview` / `PageThumbnail` for individual storybook pages is a separate concept and is **not** affected.)

## Changes

1. **`src/pages/admin/OrderFilters.tsx`** — Remove the `<SelectItem value="approved">Approved</SelectItem>` row and drop `"approved"` from the `OrderStatus` union type.
2. **`src/pages/admin/OrderActions.tsx`** — Remove `"approved"` from the status union and from the `getStatusLabel` switch (the case currently returning "Approved").
3. **`src/pages/AdminOrders.tsx`** — Remove `"approved"` from both status unions used in the file.
4. **`src/pages/admin/OrderCard.tsx`** — Remove the `approved: "bg-green-500"` entry from the status colors map.
5. **Database migration** — Rebuild the `order_status` enum without the `approved` value (Postgres has no `DROP VALUE`, so we create a new enum, alter the `orders.status` column to use it, and drop the old enum). Safe because no rows use this value.

## Out of scope

- Page-level approval flow in `PageReview.tsx`, `PageThumbnail.tsx`, and `compile-storybook-pdf` — these use a separate per-page `status` field, not the order enum.
- The `approve-order` edge function logic — it already does the right thing (review → email_sent in one step).
