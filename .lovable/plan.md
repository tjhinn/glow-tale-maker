## Root cause

The Thank You page query (`select personalization_data, story_id, personalized_cover_url from orders where id = :order_id`) is blocked by Row-Level Security. The `orders` table only allows SELECT for admins or for the authenticated user matching `user_email`. After LemonSqueezy checkout the visitor lands on `/thank-you?order_id=...` **unauthenticated**, so the query returns no row and `coverUrl` stays `null` — the UI falls back to the bundled `sample-story-1.jpg` (which is exactly what's shown in the screenshot).

I confirmed in the database that order `e2aa34e9-...` has a valid `personalized_cover_url` stored; the row simply isn't reachable from the browser.

## Fix

Add a small public edge function `get-order-cover` that the Thank You page calls instead of querying the table directly.

1. **New edge function** `supabase/functions/get-order-cover/index.ts`
   - Accepts `{ orderId: string }`.
   - Uses the service role client to look up the order.
   - Returns only the fields the Thank You page needs: `personalizedCoverUrl`, `heroName`, `storyId`, `storyTitle`, `storyMoral` (joining `stories` for the latter two).
   - No auth required; only exposes non-sensitive personalization fields. Configured with `verify_jwt = false` in `supabase/config.toml`.

2. **`src/pages/ThankYou.tsx`**
   - Replace the direct `supabase.from('orders').select(...)` + `stories` queries with a single `supabase.functions.invoke('get-order-cover', { body: { orderId } })` call.
   - Use the returned `personalizedCoverUrl` to set `coverUrl`; populate `heroName`, `personalization` (minimal — just heroName for the greeting), and `selectedStory` from the response.
   - Keep the existing localStorage fallback path for the no-`order_id` case.

No schema or RLS changes; the table stays locked down.
