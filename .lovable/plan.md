## Auto-start page generation on payment

Trigger page generation immediately when LemonSqueezy confirms payment, so orders arrive in admin already as `pages_ready_for_review` (or in-progress) instead of sitting at `payment_received`.

### Changes

**1. New edge function `auto-generate-pages`** (`verify_jwt = false`)
- Accepts `{ orderId }` plus a shared-secret header (`x-internal-secret`) to prevent public abuse.
- Loads order + `stories.pages` via service role.
- Sets order status to `pages_in_progress`.
- Loops pages 1..N sequentially, calling the same logic as `generate-single-page` (extracted into a shared helper inlined in the function — safer than cross-function HTTP loops which would hit auth + timeout headaches).
- Per-page failure → writes `error_log`, sets status to `generation_failed`, stops.
- All pages succeed → status becomes `pages_ready_for_review`.
- Runs via `EdgeRuntime.waitUntil(...)` so the HTTP response returns immediately.

**2. `lemonsqueezy-webhook`**
- After updating order to `payment_received` on `order_created`, fire-and-forget a `fetch` to `auto-generate-pages` with the shared secret header. Do not await.
- Idempotency: skip if order already past `payment_received`.

**3. `generate-single-page`**
- Keep admin-only for manual retries from the dashboard. No change to auth.
- (Logic is duplicated inside `auto-generate-pages` rather than relaxing auth here, to keep the admin surface tight.)

**4. `supabase/config.toml`**
- Add `[functions.auto-generate-pages] verify_jwt = false`.

**5. New secret `INTERNAL_FUNCTION_SECRET`**
- Shared between `lemonsqueezy-webhook` and `auto-generate-pages` so only our webhook can trigger auto-generation.

**6. Admin UI (`AdminOrders` / `OrderCard` / `OrderActions`)**
- Render `pages_in_progress` with a spinner + "Generating pages…" badge.
- Keep manual "Start Page Generation" button visible only for orders stuck in `payment_received` or `generation_failed` (fallback path).

**7. Backfill / fallback**
- Existing orders in `payment_received` keep the manual button — no migration needed.
- If `auto-generate-pages` invocation fails to even start, order stays at `payment_received` and admin can trigger manually.

### Technical notes

- Sequential generation (not parallel) — matches the existing manual flow and avoids hitting AI rate limits on a 24-page book.
- ~3min total runtime fits within Supabase edge function background execution via `EdgeRuntime.waitUntil`.
- No DB schema changes; `pages_in_progress` and `generation_failed` already exist in the `order_status` enum (used by current manual flow).
- No frontend customer-facing changes — this is admin-side only.

### Files

- **New:** `supabase/functions/auto-generate-pages/index.ts`
- **Edit:** `supabase/functions/lemonsqueezy-webhook/index.ts`, `supabase/config.toml`, `src/pages/AdminOrders.tsx` (+ `OrderCard.tsx` / `OrderActions.tsx` as needed)
- **Secret:** add `INTERNAL_FUNCTION_SECRET`
