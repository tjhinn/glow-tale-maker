## Why

The storybook download link is currently valid for 7 days (signed URL TTL of `60*60*24*7`). Change every reference of that retention period to **1 month** (~30 days, `60*60*24*30`).

## Changes

**Code**
1. `supabase/functions/compile-storybook-pdf/index.ts` (line 622–625) — change the signed URL TTL from `60 * 60 * 24 * 7` to `60 * 60 * 24 * 30` and update the "7-day signed URL" comment.
2. `supabase/functions/approve-order/index.ts` (line 182–183) — update the customer email copy from "available for 7 days" to "available for 1 month".

**Docs (user-facing wording)**
3. `docs/masterplan.md` (line 190) — "no persistent storage beyond 7 days" → "1 month".
4. `docs/implementation-plan.md` (line 242) — "Download links expire in 7 days" → "1 month".
5. `docs/app-flow-pages-and-roles.md` (line 217) — "expires in 7 days" → "1 month".

## Out of scope (intentionally NOT changed)

- **`src/pages/Refund.tsx`** — the "7-Day Quality Guarantee" is the **refund window**, not the storybook retention period. It is a separate policy and stays at 7 days unless you tell me otherwise.
- **`docs/tasks.md`** — historical changelog entries describing what was originally built. Leaving them as a historical record; let me know if you want them rewritten too.

## Notes

- "1 month" is implemented as 30 days in code (signed URL TTL is in seconds; Supabase doesn't have a calendar-month notion).
- No database migration needed — the TTL lives only in the signed URL string. Existing already-issued URLs stay valid for their original 7 days; all newly compiled storybooks get the new 30-day window.
