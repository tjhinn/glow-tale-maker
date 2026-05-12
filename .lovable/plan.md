## Why

The customer email sent on order approval lives in `supabase/functions/approve-order/index.ts` (hardcoded HTML — no Resend dashboard needed). It currently looks generic and has two bugs visible in your screenshot:

1. The story title still shows the literal `{heroName}` placeholder (e.g. `"{heroName}, the Cloud Painter"`) — placeholders aren't being substituted before the title is injected into the email.
2. The "available for 7 days" copy is still showing, even though we updated the link TTL to 1 month last round. The deployed function is stale and/or the title bug fix never landed in this codepath.

## Bug fixes

**1. Replace placeholders in the story title**

Before injecting `storyTitle` into the email HTML, run the same placeholder replacement we already use elsewhere (e.g. `ThankYou.tsx`'s `replaceStoryPlaceholders`). Pull values from `order.personalization_data` and substitute `{heroName}`, `{petName}`, `{petType}`, `{favoriteColor}`, `{favoriteFood}`, `{city}`.

**2. "7 days" → "1 month"**

Verify line ~182 already says "1 month" (it does in the source — the screenshot is from a pre-fix send or a stale deploy). Redeploying `approve-order` after this edit will fix it going forward.

## Design refresh (fully on-brand)

Rebuild the HTML template to feel like the app — storybook warmth, Fredoka headings, brand palette, sparkle accents, paper-white background.

**Visual system**
- Background: `#FFFDF8` (paper white) outside the card; white `#FFFFFF` inside
- Card: `border-radius: 24px`, soft shadow `0 8px 32px rgba(255, 139, 0, 0.12)`, max-width 600px
- Header band: gradient `linear-gradient(135deg, #FF8B00 0%, #FFB347 50%, #FFE97F 100%)` with subtle sparkle emoji decorations
- Primary CTA button: solid `#FF8B00`, white text, 50px radius, glow shadow `0 6px 20px rgba(255, 139, 0, 0.35)`, hover darken
- Accent divider: thin `#7A5FFF` (violet) line under the heading for a "magical" touch
- Info note: soft gold `#FFF8E1` background, left border `#FFE97F`, with a small book emoji
- Typography: Fredoka via Google Fonts `<link>` in `<head>` for headings, Inter fallback for body. Email-safe fallback stack: `Fredoka, 'Comic Sans MS', 'Trebuchet MS', sans-serif` for headings; `Inter, -apple-system, Segoe UI, sans-serif` for body. (Many email clients strip web fonts — fallbacks ensure it still feels friendly.)

**Layout (top to bottom)**
1. Gradient header — large Fredoka heading "✨ {heroName}'s Story is Ready ✨" (uses replaced name, not literal placeholder)
2. Soft personalized greeting — "Hi there 👋"
3. Warm intro paragraph mentioning the personalized story title and the child's name
4. Hero illustration moment — sparkle divider line + a single italic line like "*Turn the page — the magic begins…*"
5. Big glowing CTA button — "📖 Open {heroName}'s Storybook"
6. Soft gold info note — "Your storybook lives at this link for **1 month**. Save it to your device so you can read it again and again." 
7. Closing line — "With love and a little bit of magic, ✨" / "The YourFairyTale.ai Team"
8. Footer — copyright, sent-to address, small muted text

**Copy rewrite (warmer, on-brand voice — matches the "kind, nurturing, magical" tone)**

Replace the current corporate phrasing ("We're thrilled to let you know that…") with storybook voice. Examples:
- Subject: `✨ {heroName}'s storybook has arrived`
- Heading: `✨ {heroName}'s Story is Ready ✨`
- Intro: `Something magical just happened. {heroName}'s very own fairy tale — "{storyTitle}" — has been lovingly illustrated, page by page, and is ready to be read tonight.`
- Sub-line: `Every sparkle, every brushstroke, every word — made just for {heroName}.`
- CTA: `📖 Open {heroName}'s Storybook`
- Info note: `Your download link will be available for 1 month. Save the storybook to your device so {heroName} can revisit the magic anytime.`
- Sign-off: `With love and a little bit of magic, ✨\nThe YourFairyTale.ai Team`

All `{heroName}` and `{storyTitle}` references in the copy will be substituted server-side before the HTML string is built.

## Files changed

- `supabase/functions/approve-order/index.ts` — replace the `emailHtml` template, add a small `replacePlaceholders(text, personalization)` helper at the top of the handler, run it on `storyTitle` before composing the HTML, update the subject line.

## Out of scope

- No changes to delivery (still Resend via `onboarding@resend.dev` sender — let me know if you want to switch to a verified branded sender domain like `hello@yourfairytale.ai`, that's a separate setup).
- No changes to auth emails or other edge functions.
- No DB changes.

## Notes

- The function auto-redeploys on save, so the "7 days" bug disappears as soon as the new code lands.
- Email clients are notoriously strict — the design uses inline styles, table-free flex with simple block layout, and web-safe font fallbacks so it renders cleanly in Gmail, Apple Mail, and Outlook.
- I'll keep the HTML self-contained (no external CSS, no JS) as required by email rendering.
