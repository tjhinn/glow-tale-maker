
# Set up branded email on artbookmagic.com

## 1. Configure sender domain
- Open the email setup dialog to add **artbookmagic.com**.
- Use subdomain `notify` (so DNS lookups go to `notify.artbookmagic.com`) and enable **"Display From as root domain"** so users see `noreply@artbookmagic.com` in their inbox.
- Add the NS records Lovable provides at your domain registrar.
- Email infrastructure (queue, send log, suppression list, unsubscribe tokens, dispatcher cron) is provisioned automatically.
- DNS can take up to 72 hours to verify. Scaffolding and deploying don't have to wait.

## 2. Scaffold branded auth email templates
- 6 templates (signup, magic link, password recovery, invite, email change, reauthentication).
- Styled to match ArtBookMagic: Fredoka headings, warm orange (`#FF8B00`) primary CTA, violet accent, paper-white background, sparkle motifs — matching the existing approve-order email aesthetic.
- Note: the customer-facing app currently has no signup/login UI, so these only fire if/when end-user auth is added. The admin login at `/admin-login` does use Supabase auth and may trigger password reset.
- Deploy `auth-email-hook`.

## 3. Scaffold transactional email infrastructure
- Creates `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression` edge functions and a template registry.
- Create a branded `/unsubscribe` page in the app.

## 4. Create two transactional templates
- **`order-ready`** — the "✨ {heroName}'s storybook has arrived" email currently in `approve-order/index.ts`. Port the existing HTML into a React Email component. Props: `heroName`, `storyTitle`, `pdfUrl`, `recipientEmail`.
- **`admin-new-order`** — the internal "New Order Received" notification currently in `create-lemonsqueezy-checkout/index.ts`. Props: `orderId`, `customerEmail`, `amount`, `discountApplied`, plus personalization fields.

## 5. Migrate existing Resend call sites
- **`supabase/functions/approve-order/index.ts`** — replace the direct `resend.emails.send(...)` block with `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'order-ready', recipientEmail: order.user_email, idempotencyKey: `order-ready-${orderId}`, templateData: { ... } } })`. Remove the Resend import and `RESEND_API_KEY` usage.
- **`supabase/functions/create-lemonsqueezy-checkout/index.ts`** — replace the admin-notification `resend.emails.send(...)` with an invoke of `send-transactional-email` using `admin-new-order` template, recipient `tjhinn@gmail.com`, idempotency `admin-order-${order.id}`. Remove the Resend import.
- Deploy both functions.

## 6. Cleanup
- After both migrations are verified, the `RESEND_API_KEY` secret is no longer used by these flows. I'll flag it but won't delete it until you confirm nothing else depends on it.

## Technical details
- Sender subdomain: `notify.artbookmagic.com` (delegated to Lovable nameservers via NS records).
- Visible From: `noreply@artbookmagic.com` (via display_from_root setting in the setup dialog).
- All sends route through pgmq with automatic retries, rate-limit backoff, suppression checks, and a system-managed unsubscribe footer. The admin-notification email also gets an unsubscribe footer — that's by design and required.
- Idempotency keys prevent duplicate sends if the edge function is retried.

## Open question before I start step 5
The admin notification currently goes to a hardcoded `tjhinn@gmail.com`. Keep that hardcoded, or move it to a secret (e.g. `ADMIN_NOTIFICATION_EMAIL`) so it's easy to change later?
