# Fix: "Failed to approve page" error

## Root cause

Postgres logs show: `permission denied for function update_generated_page`.

A prior security-hardening migration (`20260517172505_...`) revoked `EXECUTE` on `public.update_generated_page` from `authenticated`. But the admin UI (`src/pages/admin/PageReview.tsx`) calls this RPC directly from the browser as an authenticated user. The function already enforces an internal admin/service_role check via JWT claims + `has_role`, but Postgres rejects the call before reaching that check because the role has no `EXECUTE` grant.

Result: every page Approve / Reject / Regenerate click from the admin dashboard fails with the toast "Failed to approve page N". Edge functions (service_role) are unaffected, which is why generation itself still works.

This is unrelated to the recent prompt edits in `generate-single-page` / `auto-generate-pages` — those changes only touched prompt text.

## Fix

Add a new migration that grants `EXECUTE` on `update_generated_page` back to `authenticated`. The function's internal `IF v_jwt_role IS DISTINCT FROM 'service_role' AND NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION ...` keeps non-admin authenticated users locked out, so this is safe.

```sql
GRANT EXECUTE ON FUNCTION public.update_generated_page(
  uuid, integer, text, text, timestamp with time zone, text
) TO authenticated;
```

No client code changes needed.

## Verification

After the migration applies, open Admin → an order with generated pages, click Approve on a page. Toast should say "Page N approved" and the page status should flip to approved. Re-check postgres logs to confirm no more `permission denied` errors.
