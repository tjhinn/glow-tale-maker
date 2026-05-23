## Remove Sneak Peek section from Thank You page

Delete the "A Sneak Peek at the Magic" Card (the entire `<Card>` block containing the cover image preview) from `src/pages/ThankYou.tsx`.

### Changes
- **`src/pages/ThankYou.tsx`**: Remove the Sneak Peek `<Card>` block (lines ~135–160). Also remove now-unused imports/state: `sample1` import, `coverUrl` state, and the `setCoverUrl` calls in `fetchOrderData` and `tryLocalStorage`.

No backend or other page changes.