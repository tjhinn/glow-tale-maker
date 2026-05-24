
## Goal
Move all transactional emails off the shared `onboarding@resend.dev` sandbox (which only delivers to your own inbox) and onto your real domain `artbookmagic.com` so customers and admins actually receive emails in production.

## Important branding note
The app currently says "YourFairyTale.ai" everywhere (email subjects, footers, allowed origins, copy). If we send from `@artbookmagic.com`, recipients will see a mismatch ("YourFairyTale.ai" branded email arriving from `noreply@artbookmagic.com`). Recommend a separate small pass later to rebrand the app copy to ArtBookMagic — but that's out of scope for #2. For now we'll just swap the sender.

---

## Steps

### Step 1 — Add domain in Resend (you do this, ~5 min)
1. Go to https://resend.com/domains → **Add Domain** → enter `artbookmagic.com`.
2. Resend shows ~4 DNS records (MX, SPF TXT, DKIM TXT, optional DMARC).
3. Add them at your domain registrar (since the domain was bought through Lovable, go to **Project Settings → Domains → ⋯ → Configure → Manage DNS records**).
4. Back in Resend, click **Verify DNS Records**. Usually verifies in 5–30 min; can take up to 72h.

### Step 2 — Code change (I do this in build mode)
Swap the `from` field in both edge functions:

**`supabase/functions/approve-order/index.ts`** (customer storybook delivery email)
- `from: "YourFairyTale.ai <onboarding@resend.dev>"` → `from: "ArtBookMagic <noreply@artbookmagic.com>"`

**`supabase/functions/create-lemonsqueezy-checkout/index.ts`** (admin new-order notification)
- `from: "YourFairyTale <onboarding@resend.dev>"` → `from: "ArtBookMagic <noreply@artbookmagic.com>"`
- Also fix the recipient: `to: ["admin@yourfairytale.ai"]` → `to: ["tjhinn@gmail.com"]` (folding checklist #5 in — it's literally one line away). Confirm this is the right inbox.

That's the entire change. Edge functions auto-deploy.

### Step 3 — Test (after DNS verifies)
- Place a test order → confirm admin notification arrives at `tjhinn@gmail.com`.
- Approve the order → confirm customer storybook delivery email arrives at the customer email.
- Check both don't land in spam (SPF/DKIM passing means they shouldn't).

---

## Open questions before I build
1. **Sender address** — `noreply@artbookmagic.com` OK, or prefer `hello@`, `stories@`, `magic@`?
2. **Display name** — "ArtBookMagic" OK, or keep "YourFairyTale.ai" for now even though domain is artbookmagic.com (recipients will see this mismatch in their inbox)?
3. **Admin notification recipient** — confirm `tjhinn@gmail.com` is correct (folding in checklist #5).

Once you answer those, switch to build mode and I'll make the edits.
