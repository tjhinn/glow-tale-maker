## Add Footer Links + Legal Pages

### 1. New shared `SiteFooter` component
Create `src/components/layout/SiteFooter.tsx` containing:
- "YourFairyTale.ai" + sparkle (current Home footer style)
- Tagline line
- **New row of links**: Terms of Service · Refund Policy · Privacy Policy (using `react-router-dom` `Link`)
- Copyright line

Styled with existing semantic tokens (`text-muted-foreground`, `border-border/50`, `bg-secondary/10`, `font-heading`).

### 2. Wire footer into every customer-facing page
- `Home.tsx` — replace inline footer with `<SiteFooter />`
- `Personalize.tsx`, `StorySelection.tsx`, `Preview.tsx`, `Checkout.tsx`, `ThankYou.tsx`, `NotFound.tsx`, plus the 3 new legal pages — append `<SiteFooter />` at the bottom of each
- Admin pages **excluded** (internal tools — no public footer needed)

### 3. Three new legal pages
Routes added to `App.tsx`:
- `/terms` → `src/pages/Terms.tsx`
- `/refund` → `src/pages/Refund.tsx`
- `/privacy` → `src/pages/Privacy.tsx`

Each page uses `PageWrapper`, a centered prose container, `<h1>` title, last-updated date, sectioned `<h2>` headings, and `<SiteFooter />`.

### Page contents (standard boilerplate, tailored to YourFairyTale.ai)

**Terms of Service** (~10 sections):
Acceptance, Eligibility (parent/guardian 18+), Service Description (AI-personalized digital storybook), Account & Submitted Content (photos, names), License You Grant Us (limited use to fulfill order), Acceptable Use (no NSFW, no third-party photos without consent), Intellectual Property (we own templates; you own personalization data; final PDF licensed for personal non-commercial use), Payments (USD via LemonSqueezy), Disclaimers (AI generation may vary), Limitation of Liability, Governing Law, Changes to Terms, Contact.

**Refund Policy** (~6 sections):
Digital product nature, 7-day satisfaction guarantee for generation issues (broken PDF, wrong personalization), no refunds after PDF download for change-of-mind, how to request (email support), processing time (5–10 business days), partial refunds for partial defects, contact.

**Privacy Policy** (~10 sections):
Data we collect (email, child's first name, photo, personalization), how we use it (generate the storybook, fulfill order, customer support), AI processing (third-party AI gateway for image generation, no training on your data), storage & retention (photos auto-expire, orders kept for record-keeping), children's privacy (COPPA — only parents/guardians submit data on behalf of children), cookies, third parties (LemonSqueezy payments, Resend email, Lovable Cloud hosting), your rights (access/delete), security, international transfers, changes, contact.

Tone: friendly but clear; placeholder contact email `support@yourfairytale.ai`. Last-updated dates set to 2026-05-10.

### Out of scope
- No translations
- No cookie consent banner
- No backend changes
