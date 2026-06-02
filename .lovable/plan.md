## End-to-End Mobile Customer Journey Test

**Recipient:** `tjhinn+test1@gmail.com`
**Viewport:** 390×844 (iPhone)
**Payment:** real LemonSqueezy test-mode payment with card `4242 4242 4242 4242`

### Flow I'll drive in the browser

1. Open preview at 390×844, land on home.
2. Tap "Begin Your Story" → **Personalize**: fill name/gender/pet/color/etc., upload a hero photo. Verify `validate-child-photo` + `upload-hero-photo` succeed in edge logs.
3. **Choose Story** → pick one of the 4 active stories.
4. **Preview** → wait for AI cover generation (~3 min, polled via `check-cover-status`). Confirm watermarked cover renders.
5. Trigger the share flow → confirm SHARE20 discount badge + confetti.
6. Tap checkout → confirm LemonSqueezy hosted page opens with the discounted custom price.
7. Pay with `4242 4242 4242 4242`, any future expiry, any CVC, email `tjhinn+test1@gmail.com`.

### Backend verification after payment

- `orders`: confirm latest row has `status = 'payment_received'` (or later), correct `user_email`, `discount_applied = true`, `discount_code = 'SHARE20'`, `amount_paid` matches discounted price, `personalized_cover_url` set.
- `lemonsqueezy-webhook` edge logs: confirm 200 OK + order update.
- Thank-you page: confirm non-watermarked cover renders + post-purchase messaging.
- Confirm the order appears in the admin dashboard, ready for the admin to trigger page generation + PDF compile.

### Email delivery

Order fulfillment in this project is **semi-automated** — the customer email (PDF link) only sends after an admin manually generates pages, compiles the PDF, and approves. So immediately after payment, no customer-facing email is expected.

I'll verify what I can right now:
- Query `email_send_log` for `tjhinn+test1@gmail.com` to confirm any pending/sent rows. If empty, that's expected — and I'll flag it clearly rather than calling it a failure.
- If you want the full PDF-delivery email tested too, I'll need you to either (a) tell me to also drive the admin fulfillment flow (generate-character-illustration runs 24 times × ~3 min each, so this is a long job), or (b) just verify the email infra by triggering a non-fulfillment test send.

### What I'll report

For each step: pass / fail with screenshots at key moments (mobile preview, LemonSqueezy checkout, thank-you) and the relevant SQL/log output. If anything breaks, I stop and surface the exact error before continuing.

### Caveats

- Cover generation alone is ~3 min; total wall time ~5–8 min before payment.
- I cannot read the Gmail inbox — final "did it land in my inbox" check is yours (and only applies once an admin-triggered email actually fires).
- If the LemonSqueezy store is in live mode, I'll stop before paying and ask you to flip it to test mode first.

Approve to switch to build mode and I'll start.
