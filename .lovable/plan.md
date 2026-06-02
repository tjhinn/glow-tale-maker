## Goal
Add a single-switch **test mode** to LemonSqueezy checkout, isolated to one edge function so it's trivial to rip out at launch.

## Approach: one env-driven flag

All test-mode logic lives in `supabase/functions/create-lemonsqueezy-checkout/index.ts`, gated by a single secret `LEMONSQUEEZY_TEST_MODE` (`"true"` / `"false"`). No frontend changes, no DB changes, no new files. Going Live = set the secret to `false` (or delete it) and optionally delete the ~15 lines marked `// TEST MODE`.

## What changes in the edge function

1. Read the flag at the top:
   ```ts
   // TEST MODE — remove this block at launch
   const TEST_MODE = Deno.env.get("LEMONSQUEEZY_TEST_MODE")?.trim().toLowerCase() === "true";
   ```

2. Allow optional **test-specific** secrets that fall back to the live ones, so the user can either:
   - Just flip `LEMONSQUEEZY_API_KEY` to a test key (simplest), **or**
   - Keep live secrets in place and add `LEMONSQUEEZY_TEST_API_KEY`, `LEMONSQUEEZY_TEST_STORE_ID`, `LEMONSQUEEZY_TEST_VARIANT_ID` for parallel use.
   ```ts
   const API_KEY = (TEST_MODE && Deno.env.get("LEMONSQUEEZY_TEST_API_KEY")) || Deno.env.get("LEMONSQUEEZY_API_KEY");
   const STORE_ID = (TEST_MODE && Deno.env.get("LEMONSQUEEZY_TEST_STORE_ID")) || Deno.env.get("LEMONSQUEEZY_STORE_ID");
   const VARIANT_ID = (TEST_MODE && Deno.env.get("LEMONSQUEEZY_TEST_VARIANT_ID")) || Deno.env.get("LEMONSQUEEZY_VARIANT_ID");
   ```

3. Set `test_mode: true` on the checkout payload when the flag is on (LemonSqueezy's documented attribute for API-created test checkouts):
   ```ts
   if (TEST_MODE) checkoutAttributes.test_mode = true;
   ```

4. Log the mode clearly so it's obvious in edge function logs:
   `console.log("[LS] mode=" + (TEST_MODE ? "TEST" : "LIVE"))`.

5. Tag the order row with `discount_code` unchanged, but prepend `"[TEST] "` to nothing in DB — instead, just rely on logs + LemonSqueezy's own test-mode marker on the order. (Keeps DB schema untouched.)

## Removing it at launch

Search the file for `// TEST MODE` — three small blocks. Delete them, restore the original three direct `Deno.env.get(...)` lines, done. No migrations, no frontend cleanup.

## Action required from you

After I implement, set the secret `LEMONSQUEEZY_TEST_MODE=true` and either:
- swap `LEMONSQUEEZY_API_KEY` to your test key, **or**
- add `LEMONSQUEEZY_TEST_API_KEY` (+ test store/variant IDs if different) and leave live keys alone.

I'll prompt for the secret(s) after you approve.
