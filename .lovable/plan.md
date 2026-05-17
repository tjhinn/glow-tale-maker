## Goal

Replace `.lovable/plan.md` with a soft-launch readiness checklist so we can pick it up next session.

## File to update

- `.lovable/plan.md` — overwrite the existing (stale) email-template plan with the checklist below.

## New `.lovable/plan.md` contents

```markdown
# Soft Launch Readiness — YourFairyTale.ai

Status: in progress. Resume from the first unchecked item.

## Launch blockers (must fix before inviting anyone)

- [ ] **Buy custom domain** via Project Settings → Domains → Buy new domain (e.g. `yourfairytale.ai`). Auto-connects + SSL on publish.
- [ ] **Verify sending domain in Resend**
  - Add domain in Resend → Domains
  - Add SPF, DKIM, DMARC DNS records (manage via Project Settings → Domains → ⋯ → Configure → Manage DNS records, since domain is bought through Lovable)
  - Wait for "Verified" status
- [ ] **Update `from` addresses** away from `onboarding@resend.dev`
  - `supabase/functions/approve-order/index.ts`
  - `supabase/functions/create-lemonsqueezy-checkout/index.ts`
  - Use e.g. `YourFairyTale <hello@yourfairytale.ai>`
- [ ] **Switch LemonSqueezy from test → live mode**
  - Rotate secrets: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID`
  - Update webhook URL in LemonSqueezy dashboard → live store
  - Rotate `LEMONSQUEEZY_WEBHOOK_SECRET`
- [ ] **Fix hardcoded admin recipient** in `create-lemonsqueezy-checkout/index.ts`
  - Currently `admin@yourfairytale.ai` (mailbox doesn't exist yet)
  - Swap to a real inbox until mailbox is set up
- [ ] **Wipe test data** before launch
  - Delete the 3 test orders
  - Clear `order-images` bucket
  - Clear generated test PDFs
  - **Preserve:** `stories`, `reviews`, `carousel_images`, `user_roles`
- [ ] **Publish to custom domain**
- [ ] **Run one real end-to-end paid test** with a live card → refund afterward

## Strongly recommended

- [ ] Confirm `cleanup-pending-orders` cron is active and running
- [ ] Document admin fulfillment SOP (cover gen → page review → PDF compile → approve)
- [ ] Set up email rule so order notifications don't get lost

## Legal & trust

- [ ] Review `/terms`, `/refund`, `/privacy` content
- [x] Parental consent checkbox on Personalize page
- [ ] Confirm 1-month download link expiry matches actual storage TTL

## Monitoring & security

- [ ] Review Edge Function logs for recent errors
- [ ] Run `security--run_security_scan` and resolve findings
- [ ] Run Supabase linter

## Nice-to-have (post-soft-launch)

- [ ] SEO basics (title, meta description, OG image, sitemap)
- [ ] Analytics (Plausible / PostHog)
- [ ] Sentry for error tracking
- [ ] "Beta" badge in header
- [ ] Audit loading / empty / error states across all pages

## Execution order

1. Buy domain → 2. Verify in Resend → 3. Update `from` addresses → 4. LemonSqueezy live + secrets → 5. Fix admin email → 6. Wipe test data → 7. Publish → 8. Real paid test → 9. Legal review → 10. Security scan → 11. Invite beta users
```

## Out of scope

No code edits — this is documentation only.
