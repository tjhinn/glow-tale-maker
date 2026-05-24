# Rebrand: YourFairyTale.ai → ArtBookMagic

Swap every **brand** mention to **ArtBookMagic** / **artbookmagic.com**. Keep generic story-genre uses of "fairy tale" (NotFound copy, ThankYou copy, AI illustration prompts) — those describe the product, not the brand.

## Files to change

### 1. SEO / head (`index.html`)
- `<title>` → `ArtBookMagic - Personalized Children's Storybooks`
- `meta[name=author]` → `ArtBookMagic`
- `link[rel=canonical]` → `https://artbookmagic.com`
- All `og:*` (site_name, title, description, url) → ArtBookMagic + `https://artbookmagic.com`
- Twitter `site` / `creator` → `@ArtBookMagic` (see open Q below)
- Titles/descriptions: replace brand only; keep "fairy tale" wording where it describes the product genre.

### 2. UI brand
- `src/components/layout/PageWrapper.tsx` — header text → `ArtBookMagic`
- `src/components/layout/SiteFooter.tsx` — footer logo + © line → `ArtBookMagic`
- `src/pages/Home.tsx:59` — H1 brand → `ArtBookMagic`
- `src/index.css:13` — comment → `ArtBookMagic`

### 3. Legal pages (`Privacy.tsx`, `Refund.tsx`, `Terms.tsx`)
- Replace every `YourFairyTale.ai` brand reference with `ArtBookMagic`.
- Replace every `support@yourfairytale.ai` mailto + visible text with `support@artbookmagic.com`.

### 4. Edge functions
- `supabase/functions/approve-order/index.ts` — email body brand strings ("The YourFairyTale.ai Team", footer tagline, © line) → ArtBookMagic.
- `supabase/functions/create-lemonsqueezy-checkout/index.ts` — `ALLOWED_ORIGINS` + `DEFAULT_ORIGIN`: replace `https://yourfairytale.ai` and `https://www.yourfairytale.ai` with `https://artbookmagic.com` and `https://www.artbookmagic.com`. (Keep the `your-fairy-tale.lovable.app` Lovable preview origin for now — flag below.)

### 5. Untouched on purpose
- `src/pages/NotFound.tsx`, `src/pages/ThankYou.tsx`, `supabase/functions/generate-character-illustration/index.ts`, `supabase/functions/illustrate-hero-photo/index.ts` — uses of "fairy tale" describe the genre, not the brand. Leave as-is.
- `docs/*` and `.lovable/plan.md` — internal planning docs, not user-facing. Leave unless you want them rewritten too.
- Sender `from` in edge functions — already swapped to `ArtBookMagic <noreply@artbookmagic.com>` last step.

## Open questions

1. **Support email** — confirm `support@artbookmagic.com` (used across Privacy/Refund/Terms). I'll need to set this up in Resend or your registrar so it actually receives mail, but the page links can land first.
2. **Twitter handle** — `@ArtBookMagic` OK, or do you have a different handle? If unknown, I can drop the twitter:site/creator tags rather than point at a non-existent account.
3. **Lovable preview origin** — keep `https://your-fairy-tale.lovable.app` in the allowed-origins list, or remove it now that artbookmagic.com is the canonical site? (Removing it would break the old preview URL.)
4. **Docs folder** — also rebrand `/docs/*.md` and `.lovable/plan.md` for internal consistency, or leave?

Answer those and I'll switch to build mode and ship it in one pass.
