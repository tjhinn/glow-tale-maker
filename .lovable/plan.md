## Goal
Show the order's actual personalized cover on the Thank You page's "A Sneak Peek at the Magic" card.

## Current behavior
`src/pages/ThankYou.tsx` displays `personalization?.personalizedCoverUrl || sample1`. The order fetch only selects `personalization_data` and `story_id`, so the real `orders.personalized_cover_url` column is never read. When personalization data lacks that field (the common case post-payment), it falls back to the static `sample1` placeholder.

## Change
In `src/pages/ThankYou.tsx`:
1. Extend the Supabase select to include `personalized_cover_url`: 
   `.select('personalization_data, story_id, personalized_cover_url')`.
2. Add a `coverUrl` state, set it from `order.personalized_cover_url` when present, otherwise fall back to `personalizationData?.personalizedCoverUrl`.
3. In the localStorage fallback path, also try `personalizationData?.personalizedCoverUrl`.
4. Update the `<img src>` to `coverUrl || sample1` and keep `sample1` as last-resort placeholder while loading or if the order has no cover yet.

No backend, schema, or other page changes.
